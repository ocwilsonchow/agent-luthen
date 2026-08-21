"use client"

import { MedChip } from "@/components/chat/med-chip"
import {
  CLINICAL_ALLOWED_TAGS,
  CLINICAL_LITERAL_TAG_CONTENT,
  calloutInnerMarkdown,
} from "@/lib/chat/clinical-tags"
import { MED_ALLOWED_TAGS, MED_LITERAL_TAG_CONTENT } from "@/lib/chat/med-kind"
import { cn } from "@/lib/utils"
import { ShieldCheckIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { Streamdown, type ExtraProps, type StreamdownProps } from "streamdown"

type CalloutProps = Record<string, unknown> &
  ExtraProps & {
    children?: ReactNode
  }

function CalloutMarkdown({ markdown }: { markdown: string }) {
  return (
    <Streamdown
      allowedTags={MED_ALLOWED_TAGS}
      className="space-y-0 [&_ul]:my-0 [&_ol]:my-0"
      components={{ med: MedChip }}
      literalTagContent={MED_LITERAL_TAG_CONTENT}
      mode="static"
    >
      {markdown}
    </Streamdown>
  )
}

function CalloutShell({
  className,
  icon,
  title,
  footer,
  children,
}: {
  className: string
  icon: ReactNode
  title: string
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <aside
      className={cn(
        "not-prose my-4 w-full rounded-xl border px-4 py-3 text-sm",
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-medium">
        {icon}
        <span>{title}</span>
      </div>
      {children}
      {footer}
    </aside>
  )
}

export function KeyPointsCard({ children, node }: CalloutProps) {
  const t = useTranslations("chat")
  const markdown =
    calloutInnerMarkdown(node) ||
    (typeof children === "string" ? children.trim() : "")
  if (!markdown) return null

  return (
    <CalloutShell
      className="border-border bg-muted/50 text-foreground"
      icon={<SparklesIcon className="size-4 shrink-0 text-muted-foreground" />}
      title={t("keyPoints")}
    >
      <CalloutMarkdown markdown={markdown} />
    </CalloutShell>
  )
}

export function SafetyNotesCard({ children, node }: CalloutProps) {
  const t = useTranslations("chat")
  const markdown =
    calloutInnerMarkdown(node) ||
    (typeof children === "string" ? children.trim() : "")
  if (!markdown) return null

  return (
    <CalloutShell
      className="border-destructive/20 bg-destructive/10 text-foreground"
      icon={<ShieldCheckIcon className="size-4 shrink-0 text-destructive" />}
      title={t("keySafetyNotes")}
      footer={
        <p className="mt-3 flex items-start gap-2 border-destructive/20 border-t pt-3 text-muted-foreground text-xs leading-relaxed">
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <span>{t("safetyDisclaimer")}</span>
        </p>
      }
    >
      <CalloutMarkdown markdown={markdown} />
    </CalloutShell>
  )
}

export const assistantMedMarkdown = {
  allowedTags: CLINICAL_ALLOWED_TAGS,
  literalTagContent: CLINICAL_LITERAL_TAG_CONTENT,
  components: {
    med: MedChip,
    keypoints: KeyPointsCard,
    safetynotes: SafetyNotesCard,
  },
} satisfies Pick<
  StreamdownProps,
  "allowedTags" | "literalTagContent" | "components"
>
