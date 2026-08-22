import { describe, expect, test } from "bun:test"
import type { UIMessage } from "ai"
import {
  hostnameFromHref,
  sourceDisplay,
  sourcesFromMessage,
} from "./message-sources"
import { toUiMessages } from "./mastra-chunks"

describe("sourcesFromMessage", () => {
  test("collects native source-url parts", () => {
    const message: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "source-url",
          sourceId: "s1",
          url: "https://nice.org.uk/metformin",
          title: "NICE",
        },
        { type: "text", text: "Metformin is first-line." },
      ],
    }

    expect(sourcesFromMessage(message)).toEqual([
      {
        id: "https://nice.org.uk/metformin",
        href: "https://nice.org.uk/metformin",
        title: "NICE",
      },
    ])
  })

  test("collects tavily search results from stored tool output", () => {
    const [message] = toUiMessages([
      {
        id: "a1",
        role: "assistant",
        content: {
          format: 2,
          parts: [
            {
              type: "tool-invocation",
              toolInvocation: {
                toolCallId: "call_search",
                toolName: "tavily-search",
                args: { query: "metformin" },
                state: "result",
                result: {
                  results: [
                    {
                      title: "NICE",
                      url: "https://nice.org.uk/metformin",
                      content: "Metformin is first-line for type 2 diabetes.",
                    },
                    {
                      title: "ADA",
                      url: "https://diabetes.org/metformin",
                    },
                  ],
                },
              },
            },
            { type: "text", text: "Metformin is first-line." },
          ],
        },
      },
    ])

    expect(sourcesFromMessage(message!)).toEqual([
      {
        id: "https://nice.org.uk/metformin",
        href: "https://nice.org.uk/metformin",
        title: "NICE",
        snippet: "Metformin is first-line for type 2 diabetes.",
      },
      {
        id: "https://diabetes.org/metformin",
        href: "https://diabetes.org/metformin",
        title: "ADA",
      },
    ])
  })

  test("dedupes urls and ignores image urls and tool input", () => {
    const message: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "tool-tavily-extract",
          toolCallId: "call_extract",
          state: "output-available",
          input: { urls: ["https://example.com/skip-input"] },
          output: {
            results: [
              { url: "https://nice.org.uk/metformin", title: "NICE" },
              { url: "https://nice.org.uk/metformin", title: "NICE duplicate" },
            ],
            images: [{ url: "https://cdn.example.com/photo.png" }],
          },
        },
        {
          type: "source-url",
          sourceId: "s1",
          url: "https://nice.org.uk/metformin",
          title: "NICE guidelines",
        },
      ],
    }

    expect(sourcesFromMessage(message)).toEqual([
      {
        id: "https://nice.org.uk/metformin",
        href: "https://nice.org.uk/metformin",
        title: "NICE",
      },
    ])
  })

  test("fills in a snippet when a later part repeats the url", () => {
    const message: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        {
          type: "source-url",
          sourceId: "s1",
          url: "https://nice.org.uk/metformin",
          title: "https://nice.org.uk/metformin",
        },
        {
          type: "tool-tavily-search",
          toolCallId: "call_search",
          state: "output-available",
          input: { query: "metformin" },
          output: {
            results: [
              {
                title: "NICE NG28",
                url: "https://nice.org.uk/metformin",
                rawContent: "Offer metformin as first-line drug treatment.",
              },
            ],
          },
        },
      ],
    }

    expect(sourcesFromMessage(message)).toEqual([
      {
        id: "https://nice.org.uk/metformin",
        href: "https://nice.org.uk/metformin",
        title: "NICE NG28",
        snippet: "Offer metformin as first-line drug treatment.",
      },
    ])
  })
})

describe("sourceDisplay", () => {
  test("strips www and uses hostname when the title is a url", () => {
    expect(hostnameFromHref("https://www.nice.org.uk/metformin")).toBe(
      "nice.org.uk"
    )
    expect(
      sourceDisplay({
        id: "1",
        href: "https://www.nice.org.uk/metformin",
        title: "https://www.nice.org.uk/metformin",
      })
    ).toEqual({ title: "nice.org.uk", hostname: "nice.org.uk" })
  })

  test("keeps a human title next to the hostname", () => {
    expect(
      sourceDisplay({
        id: "1",
        href: "https://diabetes.org/metformin",
        title: "ADA Standards",
      })
    ).toEqual({ title: "ADA Standards", hostname: "diabetes.org" })
  })
})
