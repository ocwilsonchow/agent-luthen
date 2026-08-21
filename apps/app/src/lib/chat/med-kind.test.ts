import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Streamdown } from "streamdown"
import {
  closeIncompleteMedTag,
  MED_ALLOWED_TAGS,
  MED_KINDS,
  MED_LITERAL_TAG_CONTENT,
  parseMedKind,
} from "./med-kind"

describe("parseMedKind", () => {
  test("accepts each closed kind", () => {
    for (const kind of MED_KINDS) {
      expect(parseMedKind(kind)).toBe(kind)
    }
  })

  test("rejects missing and invalid kinds", () => {
    expect(parseMedKind(undefined)).toBeUndefined()
    expect(parseMedKind(null)).toBeUndefined()
    expect(parseMedKind("")).toBeUndefined()
    expect(parseMedKind("drug")).toBeUndefined()
    expect(parseMedKind("GENERIC")).toBeUndefined()
  })
})

describe("closeIncompleteMedTag", () => {
  test("leaves complete tags unchanged", () => {
    const markdown = `Take <med kind="generic">metformin</med> daily.`
    expect(closeIncompleteMedTag(markdown)).toBe(markdown)
  })

  test("closes a truncated tag body", () => {
    expect(closeIncompleteMedTag(`Take <med kind="brand">Gluci`)).toBe(
      `Take <med kind="brand">Gluci</med>`
    )
  })

  test("drops an unclosed opening tag still being typed", () => {
    expect(closeIncompleteMedTag(`Take <med kind="bra`)).toBe("Take ")
  })
})

describe("med mention prompt", () => {
  test("lists every closed kind", () => {
    const prompt = readFileSync(
      join(
        import.meta.dir,
        "../../../../../packages/mastra/src/mastra/agents/research/prompts.ts"
      ),
      "utf8"
    )
    for (const kind of MED_KINDS) {
      expect(prompt).toContain(kind)
    }
  })
})

function MedProbe({ kind, children }: { kind?: string; children?: ReactNode }) {
  return createElement("span", { "data-med-kind": kind ?? "unknown" }, children)
}

describe("Streamdown med allowlist", () => {
  test("renders <med kind> through the custom tag allowlist", () => {
    const html = renderToStaticMarkup(
      createElement(Streamdown, {
        allowedTags: MED_ALLOWED_TAGS,
        literalTagContent: MED_LITERAL_TAG_CONTENT,
        components: { med: MedProbe },
        children: `Take <med kind="generic">metformin</med> daily.`,
      })
    )
    expect(html).toContain('data-med-kind="generic"')
    expect(html).toContain("metformin")
  })

  test("strips <med> when the allowlist is absent", () => {
    const html = renderToStaticMarkup(
      createElement(Streamdown, {
        components: { med: MedProbe },
        children: `Take <med kind="generic">metformin</med> daily.`,
      })
    )
    expect(html).not.toContain("data-med-kind")
    expect(html).toContain("metformin")
  })
})
