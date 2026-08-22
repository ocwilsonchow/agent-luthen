import type { GetAgentResponse } from "@mastra/client-js"

export function agentHttpId(agent: GetAgentResponse) {
  return agent.id
}
