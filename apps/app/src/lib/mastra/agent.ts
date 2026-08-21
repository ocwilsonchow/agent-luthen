import type { GetAgentResponse } from "@mastra/client-js"

export function agentHttpId(agent: GetAgentResponse) {
  return agent.id
}

export function suggestedPromptsFromAgent(agent: GetAgentResponse | undefined) {
  const raw = agent?.metadata?.suggestedPrompts
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === "string")
}
