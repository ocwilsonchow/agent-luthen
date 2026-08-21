import { describe, expect, test } from "bun:test"
import { getToolName, isToolUIPart } from "ai"
import { mastraChunkToUiChunks, toUiMessages } from "./mastra-chunks"

describe("toUiMessages tool parts", () => {
  test("converts Mastra tool-invocation parts into AI SDK tool parts with args", () => {
    const messages = toUiMessages([
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
                args: { query: "metformin combination therapy" },
                state: "result",
                result: { results: [{ title: "NICE" }] },
              },
            },
          ],
        },
      },
    ])

    const part = messages[0]?.parts[0]
    expect(part).toBeDefined()
    expect(isToolUIPart(part!)).toBe(true)
    expect(getToolName(part as never)).toBe("tavily-search")
    expect(part).toMatchObject({
      type: "tool-tavily-search",
      toolCallId: "call_search",
      state: "output-available",
      input: { query: "metformin combination therapy" },
      output: { results: [{ title: "NICE" }] },
    })
  })

  test("does not leave a tool named invocation with null input", () => {
    const messages = toUiMessages([
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-invocation",
            toolInvocation: {
              toolCallId: "call_1",
              toolName: "tavily-extract",
              args: { urls: ["https://example.com"] },
              state: "call",
            },
          },
        ],
      },
    ])

    const part = messages[0]?.parts[0]
    expect(part && "type" in part ? part.type : undefined).not.toBe(
      "tool-invocation"
    )
    expect(getToolName(part as never)).toBe("tavily-extract")
    expect(part && "input" in part ? part.input : undefined).toEqual({
      urls: ["https://example.com"],
    })
  })
})

describe("mastraChunkToUiChunks tool calls", () => {
  test("maps tool-call payload.args to tool-input-available input", () => {
    const chunks = mastraChunkToUiChunks({
      type: "tool-call",
      payload: {
        toolCallId: "call_search",
        toolName: "tavily-search",
        args: { query: "metformin" },
      },
    })

    expect(chunks).toEqual([
      {
        type: "tool-input-available",
        toolCallId: "call_search",
        toolName: "tavily-search",
        input: { query: "metformin" },
      },
    ])
  })

  test("maps tool-call input when Mastra uses AI SDK field names", () => {
    const chunks = mastraChunkToUiChunks({
      type: "tool-call",
      toolCallId: "call_search",
      toolName: "tavily-search",
      input: { query: "metformin" },
    } as never)

    expect(chunks[0]).toMatchObject({
      type: "tool-input-available",
      toolCallId: "call_search",
      toolName: "tavily-search",
      input: { query: "metformin" },
    })
  })

  test("does not publish empty args when tool input streaming ends", () => {
    const chunks = mastraChunkToUiChunks({
      type: "tool-call-input-streaming-end",
      payload: { toolCallId: "call_search" },
    })

    expect(chunks).toEqual([])
  })

  test("maps nested toolInvocation args on a tool-call chunk", () => {
    const chunks = mastraChunkToUiChunks({
      type: "tool-call",
      payload: {
        toolCallId: "call_search",
        toolInvocation: {
          toolName: "tavily-search",
          args: { query: "metformin" },
        },
      },
    })

    expect(chunks[0]).toMatchObject({
      type: "tool-input-available",
      toolCallId: "call_search",
      toolName: "tavily-search",
      input: { query: "metformin" },
    })
  })
})

describe("source parts", () => {
  test("maps nested Mastra source parts into source-url UI parts", () => {
    const messages = toUiMessages([
      {
        id: "a1",
        role: "assistant",
        content: {
          format: 2,
          parts: [
            {
              type: "source",
              source: {
                sourceType: "url",
                id: "s1",
                url: "https://nice.org.uk/metformin",
                title: "NICE",
              },
            },
          ],
        },
      },
    ])

    expect(messages[0]?.parts[0]).toEqual({
      type: "source-url",
      sourceId: "s1",
      url: "https://nice.org.uk/metformin",
      title: "NICE",
    })
  })

  test("maps source chunks with nested payload.source", () => {
    const chunks = mastraChunkToUiChunks({
      type: "source",
      payload: {
        source: {
          sourceType: "url",
          id: "s1",
          url: "https://nice.org.uk/metformin",
          title: "NICE",
        },
      },
    })

    expect(chunks).toEqual([
      {
        type: "source-url",
        sourceId: "s1",
        url: "https://nice.org.uk/metformin",
        title: "NICE",
      },
    ])
  })
})
