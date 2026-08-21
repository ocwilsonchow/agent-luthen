"use client"

import { useTranslations } from "next-intl"
import { ConversationEmptyState } from "@/components/ai-elements/conversation"

export function AgentEmptyState() {
  const t = useTranslations("thread")

  return (
    <ConversationEmptyState
      className="flex-1"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  )
}
