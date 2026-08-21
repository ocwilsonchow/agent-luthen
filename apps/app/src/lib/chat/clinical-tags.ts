import {
  REF_ALLOWED_TAGS,
  REF_LITERAL_TAG_CONTENT,
} from "@/lib/chat/inline-source"
import { MED_ALLOWED_TAGS, MED_LITERAL_TAG_CONTENT } from "@/lib/chat/med-kind"
import type { ReactNode } from "react"

export const CLINICAL_CALLOUT_TAGS = ["keypoints", "safetynotes"] as const

export type ClinicalCalloutTag = (typeof CLINICAL_CALLOUT_TAGS)[number]

const STREAM_TAGS = ["keypoints", "safetynotes", "med", "ref"] as const

export const CALLOUT_INNER_ALLOWED_TAGS: Record<string, string[]> = {
  ...MED_ALLOWED_TAGS,
  ...REF_ALLOWED_TAGS,
}

export const CALLOUT_INNER_LITERAL_TAG_CONTENT = [
  ...MED_LITERAL_TAG_CONTENT,
  ...REF_LITERAL_TAG_CONTENT,
]

export const CLINICAL_ALLOWED_TAGS: Record<string, string[]> = {
  ...CALLOUT_INNER_ALLOWED_TAGS,
  keypoints: [],
  safetynotes: [],
}

export const CLINICAL_LITERAL_TAG_CONTENT = CALLOUT_INNER_LITERAL_TAG_CONTENT

function isTagBoundary(char: string | undefined) {
  return (
    char === undefined ||
    char === ">" ||
    char === "/" ||
    char === " " ||
    char === "\n" ||
    char === "\t" ||
    char === "\r"
  )
}

/** Close a trailing unclosed clinical tag so Streamdown does not flash raw markup mid-stream. */
export function closeIncompleteClinicalTags(markdown: string): string {
  let lastName: (typeof STREAM_TAGS)[number] | undefined
  let lastIndex = -1

  for (const name of STREAM_TAGS) {
    const token = `<${name}`
    const index = markdown.lastIndexOf(token)
    if (index < lastIndex) continue
    if (!isTagBoundary(markdown[index + token.length])) continue
    lastIndex = index
    lastName = name
  }

  if (!lastName || lastIndex === -1) return markdown
  if (markdown.indexOf(`</${lastName}>`, lastIndex) !== -1) return markdown
  if (markdown.indexOf(">", lastIndex) === -1)
    return markdown.slice(0, lastIndex)
  return `${markdown}</${lastName}>`
}

export function hasCalloutContent(children: ReactNode): boolean {
  if (children == null || children === false || children === true) return false
  if (typeof children === "string") return children.trim().length > 0
  if (typeof children === "number") return true
  if (Array.isArray(children)) return children.some(hasCalloutContent)
  return true
}

type HastLike = {
  type?: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastLike[]
}

/** Reconstruct inner markdown/HTML so a nested Streamdown can parse lists, `<med>`, and `<ref>`. */
export function calloutInnerMarkdown(node: unknown): string {
  if (!node || typeof node !== "object" || !("children" in node)) return ""
  const children = (node as HastLike).children
  if (!Array.isArray(children)) return ""
  return children.map(serializeHastNode).join("").trim()
}

function serializeHastNode(node: HastLike): string {
  if (node.type === "text") return node.value ?? ""
  if (node.type !== "element" || !node.tagName) return ""
  const inner = (node.children ?? []).map(serializeHastNode).join("")
  const attrs = serializeHastAttrs(node.properties)
  return attrs
    ? `<${node.tagName} ${attrs}>${inner}</${node.tagName}>`
    : `<${node.tagName}>${inner}</${node.tagName}>`
}

function serializeHastAttrs(properties: Record<string, unknown> | undefined) {
  if (!properties) return ""
  const parts: string[] = []
  for (const [name, value] of Object.entries(properties)) {
    if (value == null || value === false) continue
    if (name === "className" && Array.isArray(value)) {
      const className = value.filter(Boolean).join(" ")
      if (className) parts.push(`class="${className}"`)
      continue
    }
    if (value === true) {
      parts.push(name)
      continue
    }
    parts.push(`${name}="${String(value)}"`)
  }
  return parts.join(" ")
}
