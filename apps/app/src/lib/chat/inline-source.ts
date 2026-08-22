export const REF_ALLOWED_TAGS: Record<string, string[]> = { ref: ["url"] }
export const REF_LITERAL_TAG_CONTENT: string[] = ["ref"]

export function parseRefUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const href = value.trim()
  if (!/^https?:\/\//i.test(href)) return undefined
  return href
}

export function faviconSrc(hostname: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`
}
