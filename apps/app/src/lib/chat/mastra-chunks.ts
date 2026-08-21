import type { FinishReason, ToolUIPart, UIMessage, UIMessageChunk } from "ai"

const FINISH_REASONS = new Set<FinishReason>([
  "stop",
  "length",
  "content-filter",
  "tool-calls",
  "error",
  "other",
])

export type TokenUsage = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number
}

export type ChatMessageMetadata = {
  usage?: TokenUsage
  totalUsage?: TokenUsage
  modelId?: string
}

export type MastraChunk = {
  type?: string
  runId?: string
  payload?: Record<string, unknown>
  data?: unknown
  object?: unknown
  finishReason?: string
  toolCallId?: string
  toolName?: string
  args?: unknown
  input?: unknown
  dynamic?: boolean
}

const TOOL_UI_STATES = new Set<ToolUIPart["state"]>([
  "input-streaming",
  "input-available",
  "output-available",
  "output-error",
  "output-denied",
  "approval-requested",
  "approval-responded",
])

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

function numberOf(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

export function tokenUsageFromUnknown(value: unknown): TokenUsage | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const usage: TokenUsage = {
    inputTokens: numberOf(record.inputTokens) ?? numberOf(record.promptTokens),
    outputTokens:
      numberOf(record.outputTokens) ?? numberOf(record.completionTokens),
    totalTokens: numberOf(record.totalTokens),
    reasoningTokens: numberOf(record.reasoningTokens),
    cachedInputTokens: numberOf(record.cachedInputTokens),
  }
  return Object.values(usage).some((token) => token != null) ? usage : undefined
}

function tokenUsageFromPayload(data: Record<string, unknown>) {
  const output = recordFromUnknown(data.output)
  return (
    tokenUsageFromUnknown(output.usage) ?? tokenUsageFromUnknown(data.usage)
  )
}

function totalTokenUsageFromPayload(data: Record<string, unknown>) {
  return tokenUsageFromUnknown(data.totalUsage)
}

function usageMetadataFromPayload(
  data: Record<string, unknown>
): ChatMessageMetadata | undefined {
  const usage = tokenUsageFromPayload(data)
  const totalUsage = totalTokenUsageFromPayload(data) ?? usage
  const modelId = modelIdFromPayload(data)
  if (!usage && !totalUsage && !modelId) return undefined
  return {
    ...(usage ? { usage } : {}),
    ...(totalUsage ? { totalUsage } : {}),
    ...(modelId ? { modelId } : {}),
  }
}

function modelIdFromPayload(data: Record<string, unknown>) {
  const metadata = recordFromUnknown(data.metadata)
  const response = recordFromUnknown(data.response)
  const output = recordFromUnknown(data.output)
  return (
    textOf(response.modelId) ||
    textOf(metadata.modelId) ||
    textOf(output.modelId) ||
    textOf(data.modelId) ||
    undefined
  )
}

export function usageFromMessage(message: UIMessage): TokenUsage | undefined {
  return usageFromMetadata(message.metadata)
}

export function modelIdFromMessage(message: UIMessage): string | undefined {
  const modelId = textOf(recordFromUnknown(message.metadata).modelId)
  return modelId || undefined
}

export function totalTokenCount(usage: TokenUsage): number | undefined {
  if (usage.totalTokens != null) return usage.totalTokens
  if (usage.inputTokens == null && usage.outputTokens == null) return undefined
  return (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
}

function toolCallFields(chunk: MastraChunk, data: Record<string, unknown>) {
  const invocation = recordFromUnknown(data.toolInvocation)
  const top = chunk as Record<string, unknown>
  const toolCallId =
    textOf(data.toolCallId) ||
    textOf(invocation.toolCallId) ||
    textOf(top.toolCallId)
  const toolName =
    textOf(data.toolName) || textOf(invocation.toolName) || textOf(top.toolName)
  const input =
    data.args ??
    data.input ??
    invocation.args ??
    invocation.input ??
    top.args ??
    top.input
  const dynamic = Boolean(data.dynamic ?? invocation.dynamic ?? top.dynamic)
  return { toolCallId, toolName, input, dynamic }
}

function toolInputDelta(chunk: MastraChunk, data: Record<string, unknown>) {
  const top = chunk as Record<string, unknown>
  return (
    textOf(data.argsTextDelta) ||
    textOf(data.inputTextDelta) ||
    textOf(data.delta) ||
    textOf(top.argsTextDelta) ||
    textOf(top.inputTextDelta) ||
    textOf(top.delta)
  )
}

function mapToolUiState(
  state: unknown,
  invocation: Record<string, unknown>
): ToolUIPart["state"] {
  if (state === "partial-call") return "input-streaming"
  if (state === "call") return "input-available"
  if (state === "result") {
    return invocation.isError ? "output-error" : "output-available"
  }
  if (
    typeof state === "string" &&
    TOOL_UI_STATES.has(state as ToolUIPart["state"])
  ) {
    return state as ToolUIPart["state"]
  }
  if (invocation.result !== undefined || invocation.output !== undefined) {
    return invocation.isError ? "output-error" : "output-available"
  }
  if (invocation.args !== undefined || invocation.input !== undefined) {
    return "input-available"
  }
  return "input-streaming"
}

function toolPartFromRecord(
  record: Record<string, unknown>
): UIMessage["parts"][number] | null {
  if (record.type === "dynamic-tool") {
    return record as UIMessage["parts"][number]
  }

  if (record.type === "tool-invocation") {
    const invocation = recordFromUnknown(record.toolInvocation)
    const toolName = textOf(invocation.toolName) || textOf(record.toolName)
    if (!toolName) return null
    const state = mapToolUiState(invocation.state, invocation)
    const input = invocation.args ?? invocation.input ?? record.input
    const output = invocation.result ?? invocation.output ?? record.output
    const errorText =
      textOf(invocation.errorText) ||
      (invocation.isError ? String(invocation.result ?? "Tool error") : "")
    const part: Record<string, unknown> = {
      type: `tool-${toolName}`,
      toolCallId:
        textOf(invocation.toolCallId) || textOf(record.toolCallId) || toolName,
      state,
      input,
    }
    if (output !== undefined) part.output = output
    if (errorText) part.errorText = errorText
    if (invocation.approval && typeof invocation.approval === "object") {
      part.approval = invocation.approval
    }
    if (typeof record.providerExecuted === "boolean") {
      part.providerExecuted = record.providerExecuted
    }
    if (typeof record.title === "string") part.title = record.title
    if (typeof invocation.rawInput !== "undefined") {
      part.rawInput = invocation.rawInput
    }
    return part as UIMessage["parts"][number]
  }

  if (typeof record.type === "string" && record.type.startsWith("tool-")) {
    if (record.input === undefined && record.args !== undefined) {
      return { ...record, input: record.args } as UIMessage["parts"][number]
    }
    return record as UIMessage["parts"][number]
  }

  return null
}

function sourceFields(record: Record<string, unknown>) {
  const nested = recordFromUnknown(record.source)
  return {
    sourceType: textOf(record.sourceType) || textOf(nested.sourceType),
    sourceId:
      textOf(record.sourceId) ||
      textOf(record.id) ||
      textOf(nested.id) ||
      textOf(nested.sourceId),
    url: textOf(record.url) || textOf(nested.url),
    title: textOf(record.title) || textOf(nested.title),
    mediaType:
      textOf(record.mediaType) ||
      textOf(record.mimeType) ||
      textOf(nested.mediaType) ||
      textOf(nested.mimeType),
    filename: textOf(record.filename) || textOf(nested.filename),
  }
}

function sourcePartFromRecord(
  record: Record<string, unknown>
): UIMessage["parts"][number] | null {
  const fields = sourceFields(record)
  const isDocument =
    record.type === "source-document" || fields.sourceType === "document"
  if (isDocument) {
    return {
      type: "source-document",
      sourceId: fields.sourceId || fields.title || "source",
      mediaType: fields.mediaType || "application/octet-stream",
      title: fields.title || "source",
      ...(fields.filename ? { filename: fields.filename } : {}),
    }
  }
  if (!fields.url) return null
  return {
    type: "source-url",
    sourceId: fields.sourceId || fields.url,
    url: fields.url,
    title: fields.title || undefined,
  }
}

function sourceChunksFromRecord(
  record: Record<string, unknown>
): UIMessageChunk[] {
  const part = sourcePartFromRecord(record)
  if (!part) return []
  if (part.type === "source-url") {
    return [
      {
        type: "source-url",
        sourceId: part.sourceId,
        url: part.url,
        title: part.title,
      } as UIMessageChunk,
    ]
  }
  if (part.type !== "source-document") return []
  return [
    {
      type: "source-document",
      sourceId: part.sourceId,
      mediaType: part.mediaType,
      title: part.title,
      ...(part.filename ? { filename: part.filename } : {}),
    } as UIMessageChunk,
  ]
}

function usageFromMetadata(value: unknown): TokenUsage | undefined {
  const metadata = recordFromUnknown(value)
  return (
    tokenUsageFromUnknown(metadata.totalUsage) ??
    tokenUsageFromUnknown(metadata.usage)
  )
}

function metadataFromStoredMessage(msg: Record<string, unknown>) {
  const metadata = { ...recordFromUnknown(msg.metadata) }
  const content = recordFromUnknown(msg.content)
  const nested = recordFromUnknown(content.metadata)
  const usage =
    tokenUsageFromUnknown(metadata.totalUsage) ??
    tokenUsageFromUnknown(metadata.usage) ??
    tokenUsageFromUnknown(nested.totalUsage) ??
    tokenUsageFromUnknown(nested.usage) ??
    tokenUsageFromUnknown(content.usage)
  const totalUsage =
    tokenUsageFromUnknown(metadata.totalUsage) ??
    tokenUsageFromUnknown(nested.totalUsage) ??
    usage
  const modelId =
    textOf(metadata.modelId) ||
    textOf(nested.modelId) ||
    textOf(content.modelId)
  if (usage) metadata.usage = usage
  if (totalUsage) metadata.totalUsage = totalUsage
  if (modelId) metadata.modelId = modelId
  return metadata
}

function finishReasonFromPayload(
  chunk: MastraChunk,
  data: Record<string, unknown>
): FinishReason | undefined {
  const stepResult = recordFromUnknown(data.stepResult)
  const reason =
    textOf(stepResult.reason) ||
    textOf(data.finishReason) ||
    textOf(chunk.finishReason)
  if (!reason) return undefined
  return FINISH_REASONS.has(reason as FinishReason)
    ? (reason as FinishReason)
    : "other"
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

export function mastraChunkToUiChunks(chunk: MastraChunk): UIMessageChunk[] {
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
    case "tool-call-input-streaming-start": {
      const tool = toolCallFields(chunk, data)
      if (!tool.toolCallId) return []
      return [
        {
          type: "tool-input-start",
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          ...(tool.dynamic ? { dynamic: true } : {}),
        },
      ]
    }
    case "tool-call-delta": {
      const tool = toolCallFields(chunk, data)
      const inputTextDelta = toolInputDelta(chunk, data)
      if (!tool.toolCallId || !inputTextDelta) return []
      return [
        {
          type: "tool-input-delta",
          toolCallId: tool.toolCallId,
          inputTextDelta,
        },
      ]
    }
    case "tool-call-input-streaming-end":
      // Streaming-end has no args. Publishing tool-input-available here would
      // overwrite streamed input with null in the AI SDK UI message.
      return []
    case "tool-call": {
      const tool = toolCallFields(chunk, data)
      if (!tool.toolCallId || !tool.toolName) return []
      return [
        {
          type: "tool-input-available",
          toolCallId: tool.toolCallId,
          toolName: tool.toolName,
          input: tool.input,
          ...(tool.dynamic ? { dynamic: true } : {}),
        } as UIMessageChunk,
      ]
    }
    case "tool-result": {
      const tool = toolCallFields(chunk, data)
      if (!tool.toolCallId) return []
      return [
        {
          type: "tool-output-available",
          toolCallId: tool.toolCallId,
          output: data.result ?? data.output,
        } as UIMessageChunk,
      ]
    }
    case "tool-error": {
      const tool = toolCallFields(chunk, data)
      if (!tool.toolCallId) return []
      return [
        {
          type: "tool-output-error",
          toolCallId: tool.toolCallId,
          errorText: String(data.error ?? "Tool error"),
        } as UIMessageChunk,
      ]
    }
    case "tool-call-approval":
      return [
        {
          type: "tool-approval-request",
          approvalId: textOf(data.toolCallId),
          toolCallId: textOf(data.toolCallId),
        },
      ]
    case "source":
    case "source-url":
    case "source-document":
      return sourceChunksFromRecord({ ...data, type: chunk.type })
    case "step-finish": {
      const metadata = usageMetadataFromPayload(data)
      return [
        { type: "finish-step" },
        ...(metadata
          ? [{ type: "message-metadata" as const, messageMetadata: metadata }]
          : []),
      ]
    }
    case "finish": {
      const finishReason = finishReasonFromPayload(chunk, data)
      const messageMetadata = usageMetadataFromPayload(data)
      return [
        {
          type: "finish",
          ...(finishReason ? { finishReason } : {}),
          ...(messageMetadata ? { messageMetadata } : {}),
        },
      ]
    }
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
      record.type === "dynamic-tool" ||
      (typeof record.type === "string" && record.type.startsWith("tool-"))
    ) {
      const toolPart = toolPartFromRecord(record)
      if (toolPart) parts.push(toolPart)
    } else if (
      record.type === "source" ||
      record.type === "source-url" ||
      record.type === "source-document"
    ) {
      const sourcePart = sourcePartFromRecord(record)
      if (sourcePart) parts.push(sourcePart)
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
    const metadata = metadataFromStoredMessage(msg)
    return [
      {
        id: String(msg.id ?? crypto.randomUUID()),
        role,
        parts,
        ...(Object.keys(metadata).length ? { metadata } : {}),
      } satisfies UIMessage,
    ]
  })
}
