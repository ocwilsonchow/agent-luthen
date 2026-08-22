"use client"

import { useQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { FollowUpList } from "@/components/chat/follow-up-list"
import type { AppLocale } from "@/i18n/routing"
import { followUpsQueryOptions } from "@/lib/queries/suggested-prompts"

export function MessageFollowUps({
  threadId,
  messageId,
  userText,
  assistantText,
  disabled,
  onSelect,
}: {
  threadId: string
  messageId: string
  userText: string
  assistantText: string
  disabled?: boolean
  onSelect: (prompt: string) => void | Promise<void>
}) {
  const t = useTranslations("thread")
  const locale = useLocale() as AppLocale
  const followUps = useQuery(
    followUpsQueryOptions({
      threadId,
      messageId,
      userText,
      assistantText,
      locale,
      enabled: assistantText.trim().length > 0,
    })
  )

  return (
    <FollowUpList
      className="mt-6"
      disabled={disabled}
      items={followUps.data ?? []}
      pending={followUps.isPending}
      title={t("followUps")}
      onSelect={(prompt) => void onSelect(prompt)}
    />
  )
}
