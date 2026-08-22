import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { getMastraClient } from "@/lib/mastra/client"

export type MemoryThread = {
  id: string
  title?: string
  resourceId: string
  metadata?: Record<string, unknown>
}

function memoryThreadFromUnknown(value: {
  id: string
  title?: string
  resourceId: string
  metadata?: Record<string, unknown>
}): MemoryThread {
  return {
    id: value.id,
    title: value.title,
    resourceId: value.resourceId,
    metadata: value.metadata,
  }
}

export const threadsQueryKey = (agentId: string) =>
  ["threads", agentId] as const

export const threadQueryKey = (agentId: string, threadId: string) =>
  ["thread", agentId, threadId] as const

export const threadQueryOptions = (agentId: string, threadId: string) =>
  queryOptions({
    queryKey: threadQueryKey(agentId, threadId),
    queryFn: async (): Promise<MemoryThread> =>
      memoryThreadFromUnknown(
        await getMastraClient().getMemoryThread({ threadId, agentId }).get()
      ),
    enabled: agentId.length > 0 && threadId.length > 0,
  })

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

export const updateThreadMetadataMutationOptions = mutationOptions({
  mutationFn: async (input: {
    agentId: string
    threadId: string
    resourceId: string
    metadata: Record<string, unknown>
  }) => {
    const threadApi = getMastraClient().getMemoryThread({
      threadId: input.threadId,
      agentId: input.agentId,
    })
    const current = await threadApi.get()
    return memoryThreadFromUnknown(
      await threadApi.update({
        title: current.title ?? "",
        resourceId: input.resourceId,
        metadata: { ...current.metadata, ...input.metadata },
        agentId: input.agentId,
      })
    )
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
