import { Agent } from "@mastra/core/agent"
import { TaskSignalProvider } from "@mastra/core/signals"
import { Memory } from "@mastra/memory"
import {
  createDurableAgent,
  createEventedAgent,
} from "@mastra/core/agent/durable"

export const agent = new Agent({
  id: "agent",
  name: "Agent",
  description: "",
  metadata: {
    suggestedPrompts: [],
  },
  instructions: "",
  model: "openai/gpt-5.6-terra",
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
  memory: new Memory({
    options: {
      generateTitle: true,
      observationalMemory: {
        model: "openai/gpt-5-mini",
      },
    },
  }),
  tools: {},
  signals: [new TaskSignalProvider()],
})

export const durableAgent = createDurableAgent({ agent })
export const eventedAgent = createEventedAgent({ agent })
