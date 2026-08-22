import { queryOptions } from "@tanstack/react-query"
import type { AppLocale } from "@/i18n/routing"
import { generateFollowUps } from "@/lib/mastra/suggested-prompts"

export const followUpsQueryKey = (threadId: string, messageId: string) =>
  ["follow-ups", threadId, messageId] as const

export const followUpsQueryOptions = (input: {
  threadId: string
  messageId: string
  userText: string
  assistantText: string
  locale: AppLocale
  enabled: boolean
}) =>
  queryOptions({
    queryKey: followUpsQueryKey(input.threadId, input.messageId),
    queryFn: () =>
      generateFollowUps({
        userText: input.userText,
        assistantText: input.assistantText,
        locale: input.locale,
      }),
    enabled: input.enabled,
    staleTime: Infinity,
    retry: false,
  })
