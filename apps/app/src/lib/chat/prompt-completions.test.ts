import { describe, expect, test } from "bun:test"
import { PROMPT_COMPLETION_PHRASES } from "./prompt-completion-phrases"
import {
  handlePromptCompletionKeyDown,
  isCaretAtEnd,
  matchPromptCompletions,
} from "./prompt-completions"

const phrases = [
  "Best treatment for acute pancreatitis based on severity",
  "Best treatment for acute exacerbation of COPD",
  "Best treatment for acute bacterial sinusitis",
  "Best treatment for acute otitis media",
  "Best treatment for community-acquired pneumonia",
  "Management of sepsis and septic shock",
]

describe("matchPromptCompletions", () => {
  test("returns prefix completions in bank order, capped at 4", () => {
    const matches = matchPromptCompletions("Best treatment for acute", phrases)
    expect(matches.map((match) => match.phrase)).toEqual([
      "Best treatment for acute pancreatitis based on severity",
      "Best treatment for acute exacerbation of COPD",
      "Best treatment for acute bacterial sinusitis",
      "Best treatment for acute otitis media",
    ])
  })

  test("keeps the typed casing in prefix and the bank remainder", () => {
    const [match] = matchPromptCompletions("best treatment for acute", phrases)
    expect(match).toEqual({
      phrase: "Best treatment for acute pancreatitis based on severity",
      prefix: "best treatment for acute",
      remainder: " pancreatitis based on severity",
    })
  })

  test("ignores input shorter than 3 trimmed characters", () => {
    expect(matchPromptCompletions("Be", phrases)).toEqual([])
    expect(matchPromptCompletions("  Be  ", phrases)).toEqual([])
    expect(
      matchPromptCompletions("Bes", phrases).map((match) => match.phrase)
    ).toEqual(phrases.slice(0, 4))
  })

  test("hides when the input contains a newline", () => {
    expect(matchPromptCompletions("Best\ntreatment", phrases)).toEqual([])
  })

  test("skips an exact match but still offers longer prefixes", () => {
    const matches = matchPromptCompletions(
      "Best treatment for acute pancreatitis based on severity",
      [
        ...phrases,
        "Best treatment for acute pancreatitis based on severity and etiology",
      ]
    )
    expect(matches.map((match) => match.phrase)).toEqual([
      "Best treatment for acute pancreatitis based on severity and etiology",
    ])
  })

  test("hides when the input exactly matches a phrase with no longer prefix", () => {
    expect(
      matchPromptCompletions("Management of sepsis and septic shock", phrases)
    ).toEqual([])
  })

  test("matches case-insensitively", () => {
    expect(
      matchPromptCompletions("BEST TREATMENT FOR ACUTE OTITIS", phrases).map(
        (match) => match.phrase
      )
    ).toEqual(["Best treatment for acute otitis media"])
  })

  test("screenshot stem yields four same-stem rows from the English bank", () => {
    const matches = matchPromptCompletions(
      "Best treatment for acute",
      PROMPT_COMPLETION_PHRASES.en
    )
    expect(matches.map((match) => match.phrase)).toEqual([
      "Best treatment for acute pancreatitis based on severity",
      "Best treatment for acute exacerbation of COPD",
      "Best treatment for acute bacterial sinusitis",
      "Best treatment for acute otitis media",
    ])
  })

  test("each locale bank has 40 phrases", () => {
    expect(PROMPT_COMPLETION_PHRASES.en).toHaveLength(40)
    expect(PROMPT_COMPLETION_PHRASES["zh-cn"]).toHaveLength(40)
    expect(PROMPT_COMPLETION_PHRASES["zh-hk"]).toHaveLength(40)
  })
})

describe("isCaretAtEnd", () => {
  test("is true only when the caret is at the end with no selection", () => {
    expect(
      isCaretAtEnd({ value: "acute", selectionStart: 5, selectionEnd: 5 })
    ).toBe(true)
    expect(
      isCaretAtEnd({ value: "acute", selectionStart: 3, selectionEnd: 3 })
    ).toBe(false)
    expect(
      isCaretAtEnd({ value: "acute", selectionStart: 0, selectionEnd: 5 })
    ).toBe(false)
  })
})

describe("handlePromptCompletionKeyDown", () => {
  const matches = matchPromptCompletions("Best treatment for acute", phrases)

  function event(
    key: string,
    extra: { shiftKey?: boolean; composing?: boolean; caret?: number } = {}
  ) {
    let prevented = false
    const value = "Best treatment for acute"
    const caret = extra.caret ?? value.length
    return {
      key,
      shiftKey: extra.shiftKey ?? false,
      nativeEvent: { isComposing: extra.composing ?? false },
      preventDefault() {
        prevented = true
      },
      currentTarget: {
        value,
        selectionStart: caret,
        selectionEnd: caret,
      },
      wasPrevented() {
        return prevented
      },
    }
  }

  test("Enter, Tab, and Right-at-end fill the highlighted phrase", () => {
    for (const key of ["Enter", "Tab", "ArrowRight"]) {
      const calls: string[] = []
      const ev = event(key)
      const handled = handlePromptCompletionKeyDown(ev, {
        open: true,
        matches,
        highlight: 0,
        onHighlight() {},
        onFill: (phrase) => calls.push(phrase),
        onDismiss() {},
      })
      expect(handled).toBe(true)
      expect(ev.wasPrevented()).toBe(true)
      expect(calls).toEqual([
        "Best treatment for acute pancreatitis based on severity",
      ])
    }
  })

  test("ArrowDown and ArrowUp move the highlight without wrapping", () => {
    const highlights: number[] = []
    handlePromptCompletionKeyDown(event("ArrowDown"), {
      open: true,
      matches,
      highlight: 0,
      onHighlight: (index) => highlights.push(index),
      onFill() {},
      onDismiss() {},
    })
    handlePromptCompletionKeyDown(event("ArrowDown"), {
      open: true,
      matches,
      highlight: 3,
      onHighlight: (index) => highlights.push(index),
      onFill() {},
      onDismiss() {},
    })
    handlePromptCompletionKeyDown(event("ArrowUp"), {
      open: true,
      matches,
      highlight: 0,
      onHighlight: (index) => highlights.push(index),
      onFill() {},
      onDismiss() {},
    })
    expect(highlights).toEqual([1, 3, 0])
  })

  test("Escape dismisses", () => {
    let dismissed = false
    const ev = event("Escape")
    handlePromptCompletionKeyDown(ev, {
      open: true,
      matches,
      highlight: 0,
      onHighlight() {},
      onFill() {},
      onDismiss() {
        dismissed = true
      },
    })
    expect(dismissed).toBe(true)
    expect(ev.wasPrevented()).toBe(true)
  })

  test("does not intercept when the list is closed, composing, or Shift+Enter", () => {
    const onFill = () => {
      throw new Error("should not fill")
    }
    expect(
      handlePromptCompletionKeyDown(event("Enter"), {
        open: false,
        matches,
        highlight: 0,
        onHighlight() {},
        onFill,
        onDismiss() {},
      })
    ).toBe(false)
    expect(
      handlePromptCompletionKeyDown(event("Enter", { composing: true }), {
        open: true,
        matches,
        highlight: 0,
        onHighlight() {},
        onFill,
        onDismiss() {},
      })
    ).toBe(false)
    expect(
      handlePromptCompletionKeyDown(event("Enter", { shiftKey: true }), {
        open: true,
        matches,
        highlight: 0,
        onHighlight() {},
        onFill,
        onDismiss() {},
      })
    ).toBe(false)
    expect(
      handlePromptCompletionKeyDown(event("ArrowRight", { caret: 2 }), {
        open: true,
        matches,
        highlight: 0,
        onHighlight() {},
        onFill,
        onDismiss() {},
      })
    ).toBe(false)
  })
})
