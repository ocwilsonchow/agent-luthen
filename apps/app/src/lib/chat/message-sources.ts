import { isToolUIPart, type UIMessage } from "ai"
import { isTaskToolPart } from "@/lib/chat/agent-tasks"

export type ChatSource = {
  id: string
  href: string
  title: string
}

export function hostnameFromHref(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./i, "")
  } catch {
    return href
  }
}

export function sourceDisplay(source: ChatSource) {
  const hostname = hostnameFromHref(source.href)
  const titleLooksLikeUrl =
    !source.title ||
    source.title === source.href ||
    /^https?:\/\//i.test(source.title)
  return {
    title: titleLooksLikeUrl ? hostname : source.title,
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

function sourceFromUrl(url: unknown, title: unknown): ChatSource | null {
  if (typeof url !== "string") return null
  const href = url.trim()
  if (!/^https?:\/\//i.test(href)) return null
  const label =
    typeof title === "string" && title.trim() ? title.trim() : href
  return { id: href, href, title: label }
}

function sourcesFromOutput(output: unknown): ChatSource[] {
  return resultItems(output).flatMap((item) => {
    if (!isRecord(item)) return []
    const source = sourceFromUrl(item.url, item.title)
    return source ? [source] : []
  })
}

export function sourcesFromMessage(message: UIMessage): ChatSource[] {
  const seen = new Set<string>()
  const sources: ChatSource[] = []

  const add = (source: ChatSource) => {
    if (seen.has(source.href)) return
    seen.add(source.href)
    sources.push(source)
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

  return sources
}
