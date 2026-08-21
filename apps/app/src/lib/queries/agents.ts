import { queryOptions } from "@tanstack/react-query"
import { getMastraClient } from "@/lib/mastra/client"

export const agentsQueryKey = ["agents"] as const

export const agentsQueryOptions = queryOptions({
  queryKey: agentsQueryKey,
  queryFn: async () => {
    const record = await getMastraClient().listAgents()
    return Object.values(record)
  },
})

export const agentQueryOptions = (agentId: string) =>
  queryOptions({
    queryKey: ["agent", agentId] as const,
    queryFn: async () => getMastraClient().getAgent(agentId).details(),
    enabled: agentId.length > 0,
  })
