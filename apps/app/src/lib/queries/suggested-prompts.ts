import { mutationOptions, queryOptions } from "@tanstack/react-query"
import type { AppLocale } from "@/i18n/routing"
import {
  generateFollowUps,
  generateSuggestedPrompts,
} from "@/lib/mastra/suggested-prompts"

export const suggestedPromptsQueryKey = (agentId: string, locale: AppLocale) =>
  ["suggested-prompts", agentId, locale] as const

export const suggestedPromptsQueryOptions = (input: {
  agentId: string
  agentName?: string
  agentDescription?: string
  locale: AppLocale
  enabled: boolean
}) =>
  queryOptions({
    queryKey: suggestedPromptsQueryKey(input.agentId, input.locale),
    queryFn: () =>
      generateSuggestedPrompts({
        agentId: input.agentId,
        agentName: input.agentName,
        agentDescription: input.agentDescription,
        locale: input.locale,
      }),
    enabled: input.enabled,
    staleTime: Infinity,
    retry: 1,
  })

export const generateSuggestedPromptsMutationOptions = mutationOptions({
  mutationFn: generateSuggestedPrompts,
})

export const followUpsQueryKey = (threadId: string, messageId: string) =>
  ["follow-ups", threadId, messageId] as const

export const followUpsQueryOptions = (input: {
  agentId: string
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
        agentId: input.agentId,
        userText: input.userText,
        assistantText: input.assistantText,
        locale: input.locale,
      }),
    enabled: input.enabled,
    staleTime: Infinity,
    retry: false,
  })
