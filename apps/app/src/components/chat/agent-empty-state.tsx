"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ConversationEmptyState } from "@/components/ai-elements/conversation"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { suggestedPromptsFromAgent } from "@/lib/mastra/agent"
import { agentQueryOptions } from "@/lib/queries/agents"
import { sessionQueryOptions } from "@/lib/queries/session"
import {
  createThreadMutationOptions,
  threadsQueryKey,
} from "@/lib/queries/threads"

export function AgentEmptyState({ agentId }: { agentId: string }) {
  const t = useTranslations("thread")
  const router = useRouter()
  const queryClient = useQueryClient()
  const agentQuery = useQuery(agentQueryOptions(agentId))
  const sessionQuery = useQuery(sessionQueryOptions)
  const resourceId = sessionQuery.data?.user?.id
  const prompts = suggestedPromptsFromAgent(agentQuery.data)
  const createThread = useMutation(createThreadMutationOptions)

  return (
    <ConversationEmptyState
      className="flex-1"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    >
      {prompts.length > 0 && resourceId ? (
        <div className="flex flex-wrap justify-center gap-2">
          {prompts.map((prompt) => (
            <Button
              key={prompt}
              disabled={createThread.isPending}
              size="sm"
              variant="outline"
              onClick={async () => {
                const thread = await createThread.mutateAsync({
                  agentId,
                  resourceId,
                })
                await queryClient.invalidateQueries({
                  queryKey: threadsQueryKey(agentId),
                })
                router.push(
                  `/agents/${agentId}/${thread.id}?prompt=${encodeURIComponent(prompt)}`
                )
              }}
            >
              {prompt}
            </Button>
          ))}
        </div>
      ) : null}
    </ConversationEmptyState>
  )
}
