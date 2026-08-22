export const PROMPT_COMPLETION_MIN_CHARS = 3
export const PROMPT_COMPLETION_LIMIT = 4

export type PromptCompletion = {
  phrase: string
  prefix: string
  remainder: string
}

export type MatchPromptCompletionsOptions = {
  minChars?: number
  limit?: number
}

export function matchPromptCompletions(
  input: string,
  phrases: readonly string[],
  options: MatchPromptCompletionsOptions = {}
): PromptCompletion[] {
  const minChars = options.minChars ?? PROMPT_COMPLETION_MIN_CHARS
  const limit = options.limit ?? PROMPT_COMPLETION_LIMIT

  if (input.includes("\n") || input.trim().length < minChars) {
    return []
  }

  const needle = input.toLowerCase()
  const results: PromptCompletion[] = []

  for (const phrase of phrases) {
    if (results.length >= limit) break
    const haystack = phrase.toLowerCase()
    if (haystack === needle) continue
    if (!haystack.startsWith(needle)) continue
    results.push({
      phrase,
      prefix: input,
      remainder: phrase.slice(input.length),
    })
  }

  return results
}

export function isCaretAtEnd(
  target: Pick<HTMLTextAreaElement, "selectionStart" | "selectionEnd" | "value">
) {
  return (
    target.selectionStart === target.value.length &&
    target.selectionEnd === target.value.length
  )
}

export function handlePromptCompletionKeyDown(
  event: {
    key: string
    shiftKey: boolean
    nativeEvent: { isComposing?: boolean }
    preventDefault: () => void
    currentTarget: Pick<
      HTMLTextAreaElement,
      "selectionStart" | "selectionEnd" | "value"
    >
  },
  input: {
    open: boolean
    matches: PromptCompletion[]
    highlight: number
    onHighlight: (index: number) => void
    onFill: (phrase: string) => void
    onDismiss: () => void
  }
): boolean {
  if (event.nativeEvent.isComposing) return false
  if (!input.open || input.matches.length === 0) return false

  const highlighted = input.matches[input.highlight] ?? input.matches[0]
  if (!highlighted) return false

  if (event.key === "ArrowDown") {
    event.preventDefault()
    const next = Math.min(input.highlight + 1, input.matches.length - 1)
    input.onHighlight(next)
    return true
  }

  if (event.key === "ArrowUp") {
    event.preventDefault()
    input.onHighlight(Math.max(input.highlight - 1, 0))
    return true
  }

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    input.onFill(highlighted.phrase)
    return true
  }

  if (event.key === "Tab") {
    event.preventDefault()
    input.onFill(highlighted.phrase)
    return true
  }

  if (event.key === "Escape") {
    event.preventDefault()
    input.onDismiss()
    return true
  }

  if (event.key === "ArrowRight" && isCaretAtEnd(event.currentTarget)) {
    event.preventDefault()
    input.onFill(highlighted.phrase)
    return true
  }

  return false
}
