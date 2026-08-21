import { Agent } from "@mastra/core/agent"
import { TaskSignalProvider } from "@mastra/core/signals"
import { Memory } from "@mastra/memory"
import {
  createDurableAgent,
  createEventedAgent,
} from "@mastra/core/agent/durable"
import { vercelModels } from "../../models"
import { tavilyExtractTool, tavilySearchTool } from "../../tools/tavily-tools"
import { description, instructions } from "./prompts"

export const clinicalResearchAgent = new Agent({
  id: "clinical-research-agent",
  name: "Clinical Guidelines Researcher",
  description,
  metadata: {
    suggestedPrompts: [
      "Summarize the latest hypertension guidelines for adults.",
      "Compare first-line treatments for type 2 diabetes.",
      "What are current screening recommendations for colorectal cancer?",
    ],
  },
  instructions,
  model: vercelModels.base,
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
  memory: new Memory({
    options: {
      generateTitle: true,
      // observationalMemory: {
      //   model: vercelModels.observation,
      // },
    },
  }),
  tools: { tavilySearchTool, tavilyExtractTool },
  signals: [new TaskSignalProvider()],
})

export const durableClinicalResearchAgent = createDurableAgent({
  agent: clinicalResearchAgent,
})
export const eventedClinicalResearchAgent = createEventedAgent({
  agent: clinicalResearchAgent,
})
