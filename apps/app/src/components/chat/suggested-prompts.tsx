"use client"

import type { GetAgentResponse } from "@mastra/client-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCwIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { FollowUpList } from "@/components/chat/follow-up-list"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AppLocale } from "@/i18n/routing"
import { SUGGESTED_PROMPT_COUNT } from "@/lib/mastra/suggested-prompts"
import {
  generateSuggestedPromptsMutationOptions,
  suggestedPromptsQueryKey,
  suggestedPromptsQueryOptions,
} from "@/lib/queries/suggested-prompts"
import { cn } from "@/lib/utils"

export function SuggestedPrompts({
  agentId,
  agent,
  disabled,
  onSelect,
}: {
  agentId: string
  agent: GetAgentResponse | undefined
  disabled?: boolean
  onSelect: (prompt: string) => void | Promise<void>
}) {
  const t = useTranslations("thread")
  const locale = useLocale() as AppLocale
  const queryClient = useQueryClient()
  const promptsQuery = useQuery(
    suggestedPromptsQueryOptions({
      agentId,
      agentName: agent?.name,
      agentDescription: agent?.description,
      locale,
      enabled: Boolean(agent),
    })
  )
  const refresh = useMutation({
    ...generateSuggestedPromptsMutationOptions,
    onSuccess: (prompts) => {
      queryClient.setQueryData(
        suggestedPromptsQueryKey(agentId, locale),
        prompts
      )
    },
    onError: () => {
      toast.error(t("refreshPromptsError"))
    },
  })
  const prompts = promptsQuery.data ?? []
  const pending = promptsQuery.isPending || refresh.isPending

  if (promptsQuery.isError && prompts.length === 0) return null

  return (
    <FollowUpList
      className="max-w-xl"
      disabled={disabled}
      items={prompts}
      pending={pending}
      skeletonCount={SUGGESTED_PROMPT_COUNT}
      title={t("followUps")}
      headerAction={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={t("refreshPrompts")}
              disabled={disabled || pending || !agent}
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={() =>
                refresh.mutate({
                  agentId,
                  exclude: prompts,
                  agentName: agent?.name,
                  agentDescription: agent?.description,
                  locale,
                })
              }
            >
              <RefreshCwIcon
                className={cn(refresh.isPending && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("refreshPrompts")}</TooltipContent>
        </Tooltip>
      }
      onSelect={(prompt) => void onSelect(prompt)}
    />
  )
}
