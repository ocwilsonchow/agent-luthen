import { mutationOptions } from "@tanstack/react-query"
import { getMastraClient } from "@/lib/mastra/client"

export const abortThreadMutationOptions = mutationOptions({
  mutationFn: async (input: {
    agentId: string
    threadId: string
    resourceId?: string
  }) => {
    return getMastraClient()
      .getAgent(input.agentId)
      .abortThread({
        threadId: input.threadId,
        resourceId: input.resourceId,
      })
  },
})

export const toolApprovalMutationOptions = mutationOptions({
  mutationFn: async (input: {
    agentId: string
    threadId: string
    resourceId: string
    toolCallId: string
    approved: boolean
  }) => {
    return getMastraClient().getAgent(input.agentId).sendToolApproval(input)
  },
})
