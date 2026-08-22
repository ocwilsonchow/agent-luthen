import type { ChatTransport, UIMessage, UIMessageChunk } from "ai"
import {
  isRunStartChunk,
  isTerminalMastraChunk,
  mastraChunkToUiChunks,
  type MastraChunk,
  userTextFromMessage,
} from "@/lib/chat/mastra-chunks"
import { getMastraClient, type LuthenRunContext } from "@/lib/mastra/client"

export type ThreadConnection = "connecting" | "connected" | "disconnected"
export type ThreadDisplayStatus =
  "connecting" | "connected" | "disconnected" | "streaming"

export type ThreadHubSnapshot = {
  connection: ThreadConnection
  runActive: boolean
}

const RECONNECT_DELAY_MS = 1000

function lastUserText(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role !== "user") continue
    const text = userTextFromMessage(message)
    if (text) return text
  }
  return ""
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true }
    )
  })
}

export function displayThreadStatus(
  snapshot: ThreadHubSnapshot
): ThreadDisplayStatus {
  if (snapshot.connection === "connecting") return "connecting"
  if (snapshot.connection !== "connected") return "disconnected"
  if (snapshot.runActive) return "streaming"
  return "connected"
}

class ThreadHub {
  connection: ThreadConnection = "disconnected"
  runActive = false
  refs = 0
  enqueueStreams = 0
  private runChunks: MastraChunk[] = []
  private chunkListeners = new Set<(chunk: MastraChunk) => void>()
  private statusListeners = new Set<() => void>()
  private turnWaiters = new Set<() => void>()
  private unsubscribe?: () => void
  private loop?: Promise<void>
  private stopped = true
  private stopSignal?: AbortController

  constructor(
    private readonly agentId: string,
    private readonly threadId: string,
    private readonly resourceId: string
  ) {}

  snapshot(): ThreadHubSnapshot {
    return { connection: this.connection, runActive: this.runActive }
  }

  subscribeStatus(listener: () => void) {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  retain() {
    this.refs += 1
  }

  release() {
    this.refs -= 1
  }

  async start() {
    if (this.loop) return
    this.stopped = false
    this.stopSignal = new AbortController()
    this.loop = this.runLoop()
  }

  async stop() {
    this.stopped = true
    this.stopSignal?.abort()
    this.unsubscribe?.()
    this.unsubscribe = undefined
    await this.loop
    this.loop = undefined
    this.runActive = false
    this.runChunks = []
    this.setConnection("disconnected")
  }

  listen(listener: (chunk: MastraChunk) => void) {
    this.chunkListeners.add(listener)
    return () => {
      this.chunkListeners.delete(listener)
    }
  }

  listenWithReplay(listener: (chunk: MastraChunk) => void) {
    const seen = new Set<MastraChunk>()
    const wrapped = (chunk: MastraChunk) => {
      if (seen.has(chunk)) return
      seen.add(chunk)
      listener(chunk)
    }
    this.chunkListeners.add(wrapped)
    for (const chunk of this.runChunks) wrapped(chunk)
    return () => {
      this.chunkListeners.delete(wrapped)
    }
  }

  addTurnWaiter(cancel: () => void) {
    this.turnWaiters.add(cancel)
    return () => {
      this.turnWaiters.delete(cancel)
    }
  }

  get hasTurnWaiter() {
    return this.turnWaiters.size > 0
  }

  async abort() {
    await getMastraClient().getAgent(this.agentId).abortThread({
      threadId: this.threadId,
      resourceId: this.resourceId,
    })
  }

  private setConnection(connection: ThreadConnection) {
    if (this.connection === connection) return
    this.connection = connection
    this.emitStatus()
  }

  private emitStatus() {
    for (const listener of this.statusListeners) listener()
  }

  private handleChunk(chunk: MastraChunk) {
    if (!isTerminalMastraChunk(chunk)) {
      if (!this.runActive) {
        this.runChunks = []
        this.runActive = true
        this.emitStatus()
      }
      this.runChunks.push(chunk)
    }

    for (const listener of this.chunkListeners) listener(chunk)

    if (isTerminalMastraChunk(chunk)) {
      this.runActive = false
      this.runChunks = []
      this.emitStatus()
    }
  }

  private async runLoop() {
    while (!this.stopped) {
      this.setConnection("connecting")
      try {
        const agent = getMastraClient().getAgent(this.agentId)
        const subscription = await agent.subscribeToThread({
          threadId: this.threadId,
          resourceId: this.resourceId,
        })
        if (this.stopped) {
          subscription.unsubscribe()
          break
        }
        this.unsubscribe = subscription.unsubscribe
        this.setConnection("connected")
        await subscription.processDataStream({
          onChunk: (chunk) => {
            this.handleChunk(chunk as MastraChunk)
          },
          reconnect: true,
        })
      } catch {
        // subscribe dropped; reconnect below
      }
      this.unsubscribe = undefined
      if (this.runActive) {
        this.runActive = false
        this.runChunks = []
        this.emitStatus()
      }
      if (this.stopped) break
      this.setConnection("disconnected")
      await sleep(RECONNECT_DELAY_MS, this.stopSignal?.signal)
    }
    this.setConnection("disconnected")
  }
}

const hubs = new Map<string, ThreadHub>()

function hubKey(agentId: string, threadId: string) {
  return `${agentId}:${threadId}`
}

function getHub(agentId: string, threadId: string, resourceId: string) {
  const key = hubKey(agentId, threadId)
  const existing = hubs.get(key)
  if (existing) return existing
  const hub = new ThreadHub(agentId, threadId, resourceId)
  hubs.set(key, hub)
  return hub
}

export function acquireThreadHub(
  agentId: string,
  threadId: string,
  resourceId: string
) {
  const hub = getHub(agentId, threadId, resourceId)
  hub.retain()
  void hub.start()
  return hub
}

export function releaseThreadHub(agentId: string, threadId: string) {
  const key = hubKey(agentId, threadId)
  const hub = hubs.get(key)
  if (!hub) return
  hub.release()
  if (hub.refs > 0) return
  hubs.delete(key)
  void hub.stop()
}

function chunksToUiStream(
  hub: ThreadHub,
  abortSignal: AbortSignal | undefined,
  options: { abortRun: boolean; enqueue: boolean }
) {
  const enqueue = options.enqueue && hub.enqueueStreams === 0
  if (enqueue) hub.enqueueStreams += 1

  let unlisten = () => {}
  let closed = false
  const release = () => {
    if (closed) return
    closed = true
    if (enqueue) hub.enqueueStreams = Math.max(0, hub.enqueueStreams - 1)
    unlisten()
    abortSignal?.removeEventListener("abort", onAbort)
  }

  const onAbort = () => {
    if (options.abortRun) void hub.abort()
    release()
  }

  abortSignal?.addEventListener("abort", onAbort, { once: true })

  return new ReadableStream<UIMessageChunk>({
    start(controller) {
      unlisten = hub.listenWithReplay((chunk) => {
        if (closed) return
        if (enqueue) {
          for (const uiChunk of mastraChunkToUiChunks(chunk)) {
            controller.enqueue(uiChunk)
          }
        }
        if (isTerminalMastraChunk(chunk)) {
          release()
          try {
            controller.close()
          } catch {
            // already closed
          }
        }
      })
    },
    cancel() {
      release()
    },
  })
}

function waitForTurnStream(
  hub: ThreadHub,
  abortSignal: AbortSignal | undefined,
  abortRun: boolean
) {
  return new Promise<ReadableStream<UIMessageChunk> | null>((resolve) => {
    let settled = false
    const finish = (stream: ReadableStream<UIMessageChunk> | null) => {
      if (settled) return
      settled = true
      removeWaiter()
      unlisten()
      abortSignal?.removeEventListener("abort", onAbort)
      resolve(stream)
    }

    const tryAttach = (chunk?: MastraChunk) => {
      if (settled || hub.enqueueStreams > 0) return
      if (chunk) {
        if (isRunStartChunk(chunk) || !isTerminalMastraChunk(chunk)) {
          finish(
            chunksToUiStream(hub, abortSignal, { abortRun, enqueue: true })
          )
        }
        return
      }
      if (hub.runActive) {
        finish(chunksToUiStream(hub, abortSignal, { abortRun, enqueue: true }))
      }
    }

    const cancel = () => finish(null)
    const unlisten = hub.listen((chunk) => tryAttach(chunk))
    const onAbort = () => finish(null)
    const removeWaiter = hub.addTurnWaiter(cancel)

    if (abortSignal?.aborted) {
      finish(null)
      return
    }
    abortSignal?.addEventListener("abort", onAbort, { once: true })
    tryAttach()
  })
}

export class MastraThreadTransport implements ChatTransport<UIMessage> {
  constructor(
    private readonly agentId: string,
    private readonly threadId: string,
    private readonly resourceId: string,
    private readonly runContext: LuthenRunContext = {}
  ) {}

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0]) {
    const hub = getHub(this.agentId, this.threadId, this.resourceId)
    await hub.start()

    const text = lastUserText(messages)
    if (!text) {
      throw new Error("No user message to send")
    }

    const agent = getMastraClient(this.runContext).getAgent(this.agentId)
    const payload = {
      message: text,
      threadId: this.threadId,
      resourceId: this.resourceId,
    }

    if (hub.runActive) {
      await agent.queueMessage(payload)
    } else {
      await agent.sendMessage(payload)
    }

    // The page-level watch loop is the only stream that writes assistant
    // chunks. Sending only keeps this request open until the turn ends.
    const enqueue = !hub.hasTurnWaiter && hub.enqueueStreams === 0
    return chunksToUiStream(hub, abortSignal, { abortRun: true, enqueue })
  }

  async reconnectToStream({
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>["reconnectToStream"]>[0]) {
    const hub = getHub(this.agentId, this.threadId, this.resourceId)
    await hub.start()
    return waitForTurnStream(hub, abortSignal, false)
  }
}
