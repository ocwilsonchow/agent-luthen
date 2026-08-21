"use client"

import { Message } from "@/components/ai-elements/message"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { useTranslations } from "next-intl"

export function ThinkingIndicator() {
  const t = useTranslations("chat")

  return (
    <Message from="assistant" aria-live="polite">
      <Shimmer className="text-sm" duration={1}>
        {t("thinking")}
      </Shimmer>
    </Message>
  )
}
