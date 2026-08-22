"use client"

import type { ChatStatus } from "ai"
import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input"
import type { AppLocale } from "@/i18n/routing"
import { PROMPT_COMPLETION_PHRASES } from "@/lib/chat/prompt-completion-phrases"
import {
  handlePromptCompletionKeyDown,
  isCaretAtEnd,
  matchPromptCompletions,
  type PromptCompletion,
} from "@/lib/chat/prompt-completions"
import { cn } from "@/lib/utils"

const LIST_ID = "prompt-completions"

function optionId(index: number) {
  return `prompt-completion-${index}`
}

export function PromptComposer({
  className,
  placeholder,
  status,
  onStop,
  onSubmit,
}: {
  className?: string
  placeholder: string
  status: ChatStatus
  onStop: () => void
  onSubmit: (text: string) => void | Promise<void>
}) {
  return (
    <PromptInputProvider>
      <PromptComposerFields
        className={className}
        placeholder={placeholder}
        status={status}
        onStop={onStop}
        onSubmit={onSubmit}
      />
    </PromptInputProvider>
  )
}

function PromptComposerFields({
  className,
  placeholder,
  status,
  onStop,
  onSubmit,
}: {
  className?: string
  placeholder: string
  status: ChatStatus
  onStop: () => void
  onSubmit: (text: string) => void | Promise<void>
}) {
  const t = useTranslations("chat")
  const locale = useLocale() as AppLocale
  const controller = usePromptInputController()
  const input = controller.textInput.value
  const phrases =
    PROMPT_COMPLETION_PHRASES[locale] ?? PROMPT_COMPLETION_PHRASES.en
  const matches = useMemo(
    () => matchPromptCompletions(input, phrases),
    [input, phrases]
  )
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const [highlightFor, setHighlightFor] = useState({ value: "", index: 0 })
  const [caretAtEnd, setCaretAtEnd] = useState(true)

  const dismissed = dismissedFor === input
  const rawHighlight = highlightFor.value === input ? highlightFor.index : 0
  const highlight =
    matches.length === 0 ? 0 : Math.min(rawHighlight, matches.length - 1)
  const open = !dismissed && matches.length > 0
  const highlighted = matches[highlight] ?? matches[0]
  const showGhost =
    open &&
    caretAtEnd &&
    !input.includes("\n") &&
    Boolean(highlighted?.remainder)

  const fill = (phrase: string) => {
    controller.textInput.setInput(phrase)
  }

  const syncCaret = (target: HTMLTextAreaElement) => {
    setCaretAtEnd(isCaretAtEnd(target))
  }

  return (
    <>
      {open ? (
        <PromptCompletionList
          highlight={highlight}
          label={t("completionsLabel")}
          matches={matches}
          onFill={fill}
          onHighlight={(index) => setHighlightFor({ value: input, index })}
        />
      ) : null}
      <PromptInput
        className={className}
        onSubmit={async ({ text }) => {
          if (!text?.trim()) return
          await onSubmit(text)
        }}
      >
        <PromptInputBody>
          <div className="relative min-h-16 w-full min-w-0 flex-1">
            {showGhost && highlighted ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden px-2.5 py-2 font-sans text-base break-words whitespace-pre-wrap md:text-sm"
              >
                <span className="text-transparent">{highlighted.prefix}</span>
                <span className="text-muted-foreground">
                  {highlighted.remainder}
                </span>
              </div>
            ) : null}
            <PromptInputTextarea
              aria-activedescendant={
                open && highlighted ? optionId(highlight) : undefined
              }
              aria-autocomplete="both"
              aria-controls={LIST_ID}
              aria-expanded={open}
              aria-haspopup="listbox"
              placeholder={placeholder}
              role="combobox"
              onClick={(event) => syncCaret(event.currentTarget)}
              onKeyDown={(event) => {
                handlePromptCompletionKeyDown(event, {
                  open,
                  matches,
                  highlight,
                  onHighlight: (index) =>
                    setHighlightFor({ value: input, index }),
                  onFill: fill,
                  onDismiss: () => setDismissedFor(input),
                })
                syncCaret(event.currentTarget)
              }}
              onKeyUp={(event) => syncCaret(event.currentTarget)}
              onSelect={(event) => syncCaret(event.currentTarget)}
            />
          </div>
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputSubmit onStop={onStop} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </>
  )
}

export function PromptCompletionList({
  matches,
  highlight,
  label,
  onHighlight,
  onFill,
}: {
  matches: PromptCompletion[]
  highlight: number
  label: string
  onHighlight: (index: number) => void
  onFill: (phrase: string) => void
}) {
  return (
    <ul
      aria-label={label}
      className="mb-2 rounded-xl border bg-card p-1 shadow-sm"
      id={LIST_ID}
      role="listbox"
    >
      {matches.map((match, index) => {
        const selected = index === highlight
        return (
          <li
            aria-selected={selected}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              selected && "bg-muted"
            )}
            id={optionId(index)}
            key={match.phrase}
            role="option"
          >
            <button
              className="w-full text-left"
              type="button"
              onClick={() => onFill(match.phrase)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
            >
              <span className="text-muted-foreground">{match.prefix}</span>
              <span className="font-medium text-foreground">
                {match.remainder}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
