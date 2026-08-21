"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ConversationEmptyState } from "@/components/ai-elements/conversation"
import { SuggestedPrompts } from "@/components/chat/suggested-prompts"
import { useRouter } from "@/i18n/navigation"
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
  const createThread = useMutation(createThreadMutationOptions)

  return (
    <ConversationEmptyState
      className="flex-1"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    >
      {resourceId ? (
        <SuggestedPrompts
          agentId={agentId}
          agent={agentQuery.data}
          disabled={createThread.isPending}
          onSelect={async (prompt) => {
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
        />
      ) : null}
    </ConversationEmptyState>
  )
}
