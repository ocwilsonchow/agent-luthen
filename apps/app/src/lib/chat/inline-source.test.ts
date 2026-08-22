import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Streamdown } from "streamdown"
import {
  faviconSrc,
  parseRefUrl,
  REF_ALLOWED_TAGS,
  REF_LITERAL_TAG_CONTENT,
} from "./inline-source"
import {
  CLINICAL_ALLOWED_TAGS,
  CLINICAL_LITERAL_TAG_CONTENT,
} from "./clinical-tags"

describe("parseRefUrl", () => {
  test("accepts http(s) urls", () => {
    expect(parseRefUrl("https://nice.org.uk/metformin")).toBe(
      "https://nice.org.uk/metformin"
    )
    expect(parseRefUrl("  http://example.com/a  ")).toBe("http://example.com/a")
  })

  test("rejects missing and non-http values", () => {
    expect(parseRefUrl(undefined)).toBeUndefined()
    expect(parseRefUrl("")).toBeUndefined()
    expect(parseRefUrl("nice.org.uk/metformin")).toBeUndefined()
    expect(parseRefUrl("javascript:alert(1)")).toBeUndefined()
  })
})

describe("faviconSrc", () => {
  test("points at the google favicon service", () => {
    expect(faviconSrc("bestpractice.bmj.com")).toBe(
      "https://www.google.com/s2/favicons?domain=bestpractice.bmj.com&sz=32"
    )
  })
})

function RefProbe({ url, children }: { url?: string; children?: ReactNode }) {
  return createElement("span", { "data-ref-url": url ?? "" }, children)
}

describe("Streamdown ref allowlist", () => {
  test("renders <ref url> through the custom tag allowlist", () => {
    const html = renderToStaticMarkup(
      createElement(Streamdown, {
        allowedTags: REF_ALLOWED_TAGS,
        literalTagContent: REF_LITERAL_TAG_CONTENT,
        components: { ref: RefProbe },
        children: `Duration: 5–7 days. <ref url="https://nice.org.uk/metformin">NICE</ref>`,
      })
    )
    expect(html).toContain('data-ref-url="https://nice.org.uk/metformin"')
    expect(html).toContain("NICE")
  })

  test("renders <ref> on the clinical allowlist", () => {
    const html = renderToStaticMarkup(
      createElement(Streamdown, {
        allowedTags: CLINICAL_ALLOWED_TAGS,
        literalTagContent: CLINICAL_LITERAL_TAG_CONTENT,
        components: { ref: RefProbe },
        children: `<ref url="https://goldcopd.org/">GOLD</ref>`,
      })
    )
    expect(html).toContain('data-ref-url="https://goldcopd.org/"')
    expect(html).toContain("GOLD")
  })

  test("strips <ref> when the allowlist is absent", () => {
    const html = renderToStaticMarkup(
      createElement(Streamdown, {
        components: { ref: RefProbe },
        children: `Duration: 5–7 days. <ref url="https://nice.org.uk/metformin">NICE</ref>`,
      })
    )
    expect(html).not.toContain("data-ref-url")
    expect(html).toContain("NICE")
  })
})

describe("inline source prompt", () => {
  test("documents the ref tag", () => {
    const prompt = readFileSync(
      join(
        import.meta.dir,
        "../../../../../packages/mastra/src/mastra/agents/research/prompts.ts"
      ),
      "utf8"
    )
    expect(prompt).toContain("<ref url=")
  })
})
