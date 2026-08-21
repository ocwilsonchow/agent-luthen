import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Streamdown } from "streamdown"
import {
  CLINICAL_ALLOWED_TAGS,
  CLINICAL_CALLOUT_TAGS,
  CLINICAL_LITERAL_TAG_CONTENT,
  calloutInnerMarkdown,
  closeIncompleteClinicalTags,
  hasCalloutContent,
} from "./clinical-tags"

describe("closeIncompleteClinicalTags", () => {
  test("leaves complete med and callout tags unchanged", () => {
    const markdown = [
      "<keypoints>",
      '- Use <med kind="generic">metformin</med>.',
      "</keypoints>",
      "<safetynotes>",
      "- Check renal function.",
      "</safetynotes>",
    ].join("\n")
    expect(closeIncompleteClinicalTags(markdown)).toBe(markdown)
  })

  test("closes a truncated keypoints body", () => {
    expect(closeIncompleteClinicalTags(`<keypoints>\n- SABA first`)).toBe(
      `<keypoints>\n- SABA first</keypoints>`
    )
  })

  test("closes a truncated safetynotes body", () => {
    expect(closeIncompleteClinicalTags(`<safetynotes>\n- Target SpO2 88`)).toBe(
      `<safetynotes>\n- Target SpO2 88</safetynotes>`
    )
  })

  test("closes a nested truncated med inside keypoints", () => {
    expect(
      closeIncompleteClinicalTags(
        `<keypoints>\n- Use <med kind="generic">metform`
      )
    ).toBe(`<keypoints>\n- Use <med kind="generic">metform</med>`)
  })

  test("drops an unclosed opening tag still being typed", () => {
    expect(closeIncompleteClinicalTags(`Intro <keypoints`)).toBe("Intro ")
    expect(closeIncompleteClinicalTags(`Intro <safetynotes`)).toBe("Intro ")
    expect(closeIncompleteClinicalTags(`Take <med kind="bra`)).toBe("Take ")
  })
})

describe("hasCalloutContent", () => {
  test("treats empty and whitespace as missing", () => {
    expect(hasCalloutContent(null)).toBe(false)
    expect(hasCalloutContent(undefined)).toBe(false)
    expect(hasCalloutContent(false)).toBe(false)
    expect(hasCalloutContent("")).toBe(false)
    expect(hasCalloutContent("   ")).toBe(false)
    expect(hasCalloutContent(["", "  "])).toBe(false)
  })

  test("treats text and elements as present", () => {
    expect(hasCalloutContent("Keep this")).toBe(true)
    expect(hasCalloutContent(0)).toBe(true)
    expect(hasCalloutContent(createElement("ul", null, "item"))).toBe(true)
  })
})

describe("calloutInnerMarkdown", () => {
  test("serializes text and nested med tags", () => {
    expect(
      calloutInnerMarkdown({
        type: "element",
        tagName: "keypoints",
        children: [
          { type: "text", value: "\n- Use " },
          {
            type: "element",
            tagName: "med",
            properties: { kind: "generic" },
            children: [{ type: "text", value: "metformin" }],
          },
          { type: "text", value: ".\n" },
        ],
      })
    ).toBe('- Use <med kind="generic">metformin</med>.')
  })
})

function CalloutProbe({ children }: { children?: ReactNode }) {
  return createElement("section", { "data-callout": "keypoints" }, children)
}

function CalloutListProbe({ node }: { node?: unknown }) {
  return createElement(
    Streamdown,
    { mode: "static" },
    calloutInnerMarkdown(node)
  )
}

describe("Streamdown callout allowlist", () => {
  test("renders keypoints through the custom tag allowlist", () => {
    const html = renderToStaticMarkup(
      createElement(
        Streamdown,
        {
          allowedTags: CLINICAL_ALLOWED_TAGS,
          literalTagContent: CLINICAL_LITERAL_TAG_CONTENT,
          components: { keypoints: CalloutProbe },
        },
        `<keypoints>\n- SABA first\n</keypoints>`
      )
    )
    expect(html).toContain('data-callout="keypoints"')
    expect(html).toContain("SABA first")
  })

  test("parses callout bullets into ul and li", () => {
    const html = renderToStaticMarkup(
      createElement(
        Streamdown,
        {
          allowedTags: CLINICAL_ALLOWED_TAGS,
          literalTagContent: CLINICAL_LITERAL_TAG_CONTENT,
          components: { keypoints: CalloutListProbe },
        },
        `<keypoints>\n- SABA first\n- Oxygen target\n</keypoints>`
      )
    )
    expect(html).toContain("<ul")
    expect(html).toContain("<li")
    expect(html).toContain("SABA first")
    expect(html).toContain("Oxygen target")
  })
})

describe("clinical callout prompt", () => {
  test("documents both callout tags", () => {
    const prompt = readFileSync(
      join(
        import.meta.dir,
        "../../../../../packages/mastra/src/mastra/agents/research/prompts.ts"
      ),
      "utf8"
    )
    for (const tag of CLINICAL_CALLOUT_TAGS) {
      expect(prompt).toContain(`<${tag}>`)
    }
  })
})
