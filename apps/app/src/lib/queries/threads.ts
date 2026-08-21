import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { getMastraClient } from "@/lib/mastra/client"

export const threadsQueryKey = (agentId: string) =>
  ["threads", agentId] as const

export const threadsQueryOptions = (agentId: string) =>
  queryOptions({
    queryKey: threadsQueryKey(agentId),
    queryFn: async () => {
      const result = await getMastraClient().listMemoryThreads({
        agentId,
        orderBy: { field: "updatedAt", direction: "DESC" },
        perPage: 50,
      })
      return result.threads
    },
    enabled: agentId.length > 0,
  })

export const threadMessagesQueryOptions = (agentId: string, threadId: string) =>
  queryOptions({
    queryKey: ["thread-messages", agentId, threadId] as const,
    queryFn: async () => {
      const thread = getMastraClient().getMemoryThread({ threadId, agentId })
      return thread.listMessages({ perPage: 100 })
    },
    enabled: agentId.length > 0 && threadId.length > 0,
  })

export const createThreadMutationOptions = mutationOptions({
  mutationFn: async (input: {
    agentId: string
    resourceId: string
    title?: string
  }) => {
    return getMastraClient().createMemoryThread({
      agentId: input.agentId,
      resourceId: input.resourceId,
      title: input.title,
    })
  },
})

export const renameThreadMutationOptions = mutationOptions({
  mutationFn: async (input: {
    agentId: string
    threadId: string
    title: string
    resourceId: string
    metadata?: Record<string, unknown>
  }): Promise<unknown> => {
    return getMastraClient()
      .getMemoryThread({ threadId: input.threadId, agentId: input.agentId })
      .update({
        title: input.title,
        resourceId: input.resourceId,
        metadata: input.metadata ?? {},
        agentId: input.agentId,
      })
  },
})

export const deleteThreadMutationOptions = mutationOptions({
  mutationFn: async (input: { agentId: string; threadId: string }) => {
    return getMastraClient()
      .getMemoryThread({ threadId: input.threadId, agentId: input.agentId })
      .delete({ agentId: input.agentId })
  },
})

export const cloneThreadMutationOptions = mutationOptions({
  mutationFn: async (input: { agentId: string; threadId: string }) => {
    return getMastraClient()
      .getMemoryThread({ threadId: input.threadId, agentId: input.agentId })
      .clone({ agentId: input.agentId })
  },
})
