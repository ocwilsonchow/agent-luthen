"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import {
  audienceFromThreadMetadata,
  CHAT_AUDIENCES,
  type ChatAudience,
  THREAD_AUDIENCE_METADATA_KEY,
} from "@/lib/chat/audience"
import { sessionQueryOptions } from "@/lib/queries/session"
import {
  threadQueryKey,
  threadQueryOptions,
  threadsQueryKey,
  updateThreadMetadataMutationOptions,
  type MemoryThread,
} from "@/lib/queries/threads"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AudienceToggle({
  agentId,
  threadId,
}: {
  agentId: string
  threadId: string
}) {
  const t = useTranslations("thread")
  const queryClient = useQueryClient()
  const sessionQuery = useQuery(sessionQueryOptions)
  const threadQuery = useQuery(threadQueryOptions(agentId, threadId))
  const resourceId = sessionQuery.data?.user?.id
  const audience = audienceFromThreadMetadata(threadQuery.data?.metadata)

  const update = useMutation({
    ...updateThreadMetadataMutationOptions,
    onMutate: async (input) => {
      const key = threadQueryKey(agentId, threadId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<MemoryThread>(key)
      queryClient.setQueryData<MemoryThread>(key, (current) =>
        current
          ? {
              ...current,
              metadata: { ...current.metadata, ...input.metadata },
            }
          : current
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          threadQueryKey(agentId, threadId),
          context.previous
        )
      }
    },
    onSuccess: async (thread) => {
      queryClient.setQueryData(threadQueryKey(agentId, threadId), thread)
      await queryClient.invalidateQueries({
        queryKey: threadsQueryKey(agentId),
      })
    },
  })

  return (
    <Select
      value={audience}
      disabled={!resourceId || threadQuery.isLoading || update.isPending}
      onValueChange={(next) => {
        if (!resourceId) return
        update.mutate({
          agentId,
          threadId,
          resourceId,
          metadata: { [THREAD_AUDIENCE_METADATA_KEY]: next as ChatAudience },
        })
      }}
    >
      <SelectTrigger aria-label={t("audience")} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHAT_AUDIENCES.map((item) => (
          <SelectItem key={item} value={item}>
            {item === "professional"
              ? t("audienceProfessional")
              : t("audiencePublic")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
