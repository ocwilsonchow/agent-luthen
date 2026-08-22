import { isToolUIPart, type UIMessage } from "ai"
import { isTaskToolPart } from "@/lib/chat/agent-tasks"

export type ChatSource = {
  id: string
  href: string
  title: string
  snippet?: string
}

export function hostnameFromHref(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./i, "")
  } catch {
    return href
  }
}

function titleLooksLikeUrl(title: string, href: string) {
  return !title || title === href || /^https?:\/\//i.test(title)
}

export function sourceDisplay(source: ChatSource) {
  const hostname = hostnameFromHref(source.href)
  return {
    title: titleLooksLikeUrl(source.title, source.href)
      ? hostname
      : source.title,
    hostname,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function resultItems(output: unknown): unknown[] {
  const parsed = parseJson(output)
  if (!isRecord(parsed)) return []
  if (Array.isArray(parsed.results)) return parsed.results
  const nested = isRecord(parsed.result)
    ? parsed.result
    : isRecord(parsed.data)
      ? parsed.data
      : null
  if (nested && Array.isArray(nested.results)) return nested.results
  return []
}

function snippetFromUnknown(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function sourceFromUrl(
  url: unknown,
  title: unknown,
  snippet?: unknown
): ChatSource | null {
  if (typeof url !== "string") return null
  const href = url.trim()
  if (!/^https?:\/\//i.test(href)) return null
  const label = typeof title === "string" && title.trim() ? title.trim() : href
  const text = snippetFromUnknown(snippet)
  return text
    ? { id: href, href, title: label, snippet: text }
    : { id: href, href, title: label }
}

function mergeSource(existing: ChatSource, incoming: ChatSource): ChatSource {
  const existingTitleWeak = titleLooksLikeUrl(existing.title, existing.href)
  const incomingTitleStrong = !titleLooksLikeUrl(incoming.title, incoming.href)
  return {
    id: existing.id,
    href: existing.href,
    title:
      existingTitleWeak && incomingTitleStrong
        ? incoming.title
        : existing.title,
    snippet: existing.snippet ?? incoming.snippet,
  }
}

function sourcesFromOutput(output: unknown): ChatSource[] {
  return resultItems(output).flatMap((item) => {
    if (!isRecord(item)) return []
    const source = sourceFromUrl(
      item.url,
      item.title,
      item.content ?? item.rawContent
    )
    return source ? [source] : []
  })
}

export function sourcesFromMessage(message: UIMessage): ChatSource[] {
  const byHref = new Map<string, ChatSource>()

  const add = (source: ChatSource) => {
    const existing = byHref.get(source.href)
    byHref.set(source.href, existing ? mergeSource(existing, source) : source)
  }

  for (const part of message.parts) {
    if (part.type === "source-url") {
      const source = sourceFromUrl(part.url, part.title)
      if (source) add(source)
    }
    if (!isToolUIPart(part) || isTaskToolPart(part)) continue
    if (!("output" in part) || part.output === undefined) continue
    for (const source of sourcesFromOutput(part.output)) add(source)
  }

  return [...byHref.values()]
}
