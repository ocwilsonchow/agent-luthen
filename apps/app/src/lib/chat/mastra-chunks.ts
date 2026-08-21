import type { UIMessage, UIMessageChunk } from "ai"

export type MastraChunk = {
  type?: string
  runId?: string
  payload?: Record<string, unknown>
  data?: unknown
  object?: unknown
  finishReason?: string
}

export function isTerminalMastraChunk(chunk: MastraChunk) {
  if (chunk.type === "error" || chunk.type === "abort") return true
  if (chunk.type !== "finish") return false
  const stepResult = recordOf(chunk).stepResult
  const stepReason =
    stepResult && typeof stepResult === "object" && "reason" in stepResult
      ? String((stepResult as { reason?: unknown }).reason ?? "")
      : ""
  const finishReason =
    textOf(recordOf(chunk).finishReason) || textOf(chunk.finishReason)
  return stepReason !== "tool-calls" && finishReason !== "tool-calls"
}

export function isRunStartChunk(chunk: MastraChunk) {
  return chunk.type === "start" || chunk.type === "data-user-message"
}

function recordOf(chunk: MastraChunk) {
  if (chunk.payload && typeof chunk.payload === "object") return chunk.payload
  if (chunk.data && typeof chunk.data === "object") {
    return chunk.data as Record<string, unknown>
  }
  return {}
}

function textOf(value: unknown) {
  return typeof value === "string" ? value : ""
}

function contentsToText(contents: unknown) {
  if (typeof contents === "string") return contents.trim()
  if (typeof contents === "number" || typeof contents === "boolean") {
    return String(contents)
  }
  if (!Array.isArray(contents)) return ""
  return contents
    .map((part) => {
      if (typeof part === "string") return part
      if (part && typeof part === "object" && "text" in part) {
        return textOf((part as { text?: unknown }).text)
      }
      return ""
    })
    .join("\n")
    .trim()
}

function recordFromUnknown(value: unknown) {
  if (!value || typeof value !== "object") return {}
  return value as Record<string, unknown>
}

export function userMessageFromData(data: unknown) {
  const record = recordFromUnknown(data)
  const nested = recordFromUnknown(record.data)
  const sources = [nested, record]
  for (const source of sources) {
    const text =
      contentsToText(source.contents) ||
      textOf(source.text) ||
      (typeof source.content === "string" ? source.content.trim() : "")
    if (!text) continue
    return {
      id: textOf(source.id) || textOf(record.id) || crypto.randomUUID(),
      text,
    }
  }
  return null
}

export function userTextFromMessage(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("\n")
    .trim()
}

export function mastraChunkToUiChunks(
  chunk: MastraChunk
): UIMessageChunk[] {
  const data = recordOf(chunk)
  const id = textOf(data.id) || "text"

  switch (chunk.type) {
    case "data-user-message": {
      const dataRecord = recordFromUnknown(chunk.data)
      const payloadRecord = recordOf(chunk)
      const merged = { ...dataRecord, ...payloadRecord }
      return [
        {
          type: "data-user-message",
          data: Object.keys(recordFromUnknown(merged.data)).length
            ? merged.data
            : merged,
          transient: true,
        } as UIMessageChunk,
      ]
    }
    case "start":
      return [
        {
          type: "start",
          messageId: textOf(data.messageId) || undefined,
        } as UIMessageChunk,
      ]
    case "text-start":
      return [{ type: "text-start", id }]
    case "text-delta":
      return [{ type: "text-delta", id, delta: textOf(data.text) }]
    case "text-end":
      return [{ type: "text-end", id }]
    case "reasoning-start":
      return [{ type: "reasoning-start", id }]
    case "reasoning-delta":
      return [{ type: "reasoning-delta", id, delta: textOf(data.text) }]
    case "reasoning-end":
      return [{ type: "reasoning-end", id }]
    case "tool-call-input-streaming-start":
      return [
        {
          type: "tool-input-start",
          toolCallId: textOf(data.toolCallId),
          toolName: textOf(data.toolName),
        },
      ]
    case "tool-call-delta":
      return [
        {
          type: "tool-input-delta",
          toolCallId: textOf(data.toolCallId),
          inputTextDelta: textOf(data.argsTextDelta),
        },
      ]
    case "tool-call-input-streaming-end":
      return [
        {
          type: "tool-input-available",
          toolCallId: textOf(data.toolCallId),
          toolName: textOf(data.toolName),
          input: data.args,
        } as UIMessageChunk,
      ]
    case "tool-call":
      return [
        {
          type: "tool-input-available",
          toolCallId: textOf(data.toolCallId),
          toolName: textOf(data.toolName),
          input: data.args,
        } as UIMessageChunk,
      ]
    case "tool-result":
      return [
        {
          type: "tool-output-available",
          toolCallId: textOf(data.toolCallId),
          output: data.result,
        } as UIMessageChunk,
      ]
    case "tool-error":
      return [
        {
          type: "tool-output-error",
          toolCallId: textOf(data.toolCallId),
          errorText: String(data.error ?? "Tool error"),
        } as UIMessageChunk,
      ]
    case "tool-call-approval":
      return [
        {
          type: "tool-approval-request",
          approvalId: textOf(data.toolCallId),
          toolCallId: textOf(data.toolCallId),
        },
      ]
    case "source":
      if (data.sourceType === "url" || data.url) {
        return [
          {
            type: "source-url",
            sourceId: textOf(data.id) || textOf(data.url),
            url: textOf(data.url),
            title: textOf(data.title) || undefined,
          } as UIMessageChunk,
        ]
      }
      return [
        {
          type: "source-document",
          sourceId: textOf(data.id),
          mediaType: textOf(data.mimeType) || "application/octet-stream",
          title: textOf(data.title) || "source",
        } as UIMessageChunk,
      ]
    case "finish":
      return [{ type: "finish" }]
    case "abort":
      return [{ type: "abort" }]
    case "error":
      return [
        {
          type: "error",
          errorText: String(data.error ?? "Agent error"),
        },
      ]
    default:
      return []
  }
}

function asParts(value: unknown): UIMessage["parts"] {
  if (!Array.isArray(value)) return []
  const parts: UIMessage["parts"] = []
  for (const part of value) {
    if (!part || typeof part !== "object") continue
    const record = part as Record<string, unknown>
    if (record.type === "text" && typeof record.text === "string") {
      parts.push({ type: "text", text: record.text })
    } else if (record.type === "data-user-message") {
      const incoming = userMessageFromData(record.data ?? record)
      if (incoming) parts.push({ type: "text", text: incoming.text })
    } else if (record.type === "reasoning" && typeof record.text === "string") {
      parts.push({ type: "reasoning", text: record.text })
    } else if (
      typeof record.type === "string" &&
      record.type.startsWith("tool-")
    ) {
      parts.push(record as UIMessage["parts"][number])
    } else if (record.type === "source" || record.type === "source-url") {
      parts.push({
        type: "source-url",
        sourceId: String(record.id ?? record.url ?? ""),
        url: String(record.url ?? ""),
        title: typeof record.title === "string" ? record.title : undefined,
      })
    }
  }
  return parts
}

export function toUiMessages(messages: unknown): UIMessage[] {
  if (!Array.isArray(messages)) return []
  return messages.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return []
    const msg = raw as Record<string, unknown>
    const role =
      msg.role === "assistant" || msg.role === "system" ? msg.role : "user"
    const content = msg.content
    let parts: UIMessage["parts"] = []
    if (typeof content === "string") {
      parts = [{ type: "text", text: content }]
    } else if (Array.isArray(msg.parts)) {
      parts = asParts(msg.parts)
    } else if (content && typeof content === "object") {
      const nested = content as Record<string, unknown>
      if (Array.isArray(nested.parts)) parts = asParts(nested.parts)
      else if (typeof nested.content === "string") {
        parts = [{ type: "text", text: nested.content }]
      }
      if (parts.length === 0) {
        const signal = recordFromUnknown(nested.metadata).signal
        const incoming = userMessageFromData(signal)
        if (incoming) parts = [{ type: "text", text: incoming.text }]
      }
    }
    return [
      {
        id: String(msg.id ?? crypto.randomUUID()),
        role,
        parts,
      } satisfies UIMessage,
    ]
  })
}
