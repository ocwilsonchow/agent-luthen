export const MED_KINDS = [
  "generic",
  "brand",
  "class",
  "supplement",
  "vaccine",
  "tcm",
  "device",
] as const

export type MedKind = (typeof MED_KINDS)[number]

export const MED_ALLOWED_TAGS: Record<string, string[]> = { med: ["kind"] }
export const MED_LITERAL_TAG_CONTENT: string[] = ["med"]

const MED_KIND_SET = new Set<string>(MED_KINDS)

export function parseMedKind(value: unknown): MedKind | undefined {
  if (typeof value !== "string") return undefined
  return MED_KIND_SET.has(value) ? (value as MedKind) : undefined
}

/** Close a trailing unclosed <med> so Streamdown does not flash raw markup mid-stream. */
export function closeIncompleteMedTag(markdown: string): string {
  const open = markdown.lastIndexOf("<med")
  if (open === -1) return markdown
  if (markdown.indexOf("</med>", open) !== -1) return markdown
  if (markdown.indexOf(">", open) === -1) return markdown.slice(0, open)
  return `${markdown}</med>`
}
