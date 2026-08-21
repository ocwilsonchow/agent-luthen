"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  MED_ALLOWED_TAGS,
  MED_LITERAL_TAG_CONTENT,
  parseMedKind,
} from "@/lib/chat/med-kind"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import type { ExtraProps, StreamdownProps } from "streamdown"

export function MedChip({
  kind,
  children,
}: Record<string, unknown> &
  ExtraProps & {
    kind?: string
    children?: ReactNode
  }) {
  const t = useTranslations("chat.medKind")
  const parsed = parseMedKind(kind)
  const label = parsed ? t(parsed) : t("unknown")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "mx-[0.12em] inline-flex cursor-help items-center gap-[0.35em] rounded-[0.4em] px-[0.4em] py-[0.14em] align-baseline font-medium leading-none",
            "bg-muted/75 text-[0.92em] text-foreground whitespace-nowrap",
            "shadow-[inset_0_0_0_1px] shadow-border/70",
            "transition-colors hover:bg-muted hover:shadow-border",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
        >
          <span
            aria-hidden
            className="size-[0.35em] shrink-0 rounded-full bg-foreground/35"
          />
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        className="px-2 py-1 font-medium text-[11px] tracking-wide"
        side="top"
        sideOffset={6}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export const assistantMedMarkdown = {
  allowedTags: MED_ALLOWED_TAGS,
  literalTagContent: MED_LITERAL_TAG_CONTENT,
  components: { med: MedChip },
} satisfies Pick<
  StreamdownProps,
  "allowedTags" | "literalTagContent" | "components"
>
