import { Agent } from "@mastra/core/agent"
import { TaskSignalProvider } from "@mastra/core/signals"
import { Memory } from "@mastra/memory"
import {
  createDurableAgent,
  createEventedAgent,
} from "@mastra/core/agent/durable"
import { FAST_MODEL_REQUEST_KEY, vercelModels } from "../../models"
import {
  AUDIENCE_REQUEST_KEY,
  LOCALE_REQUEST_KEY,
  parseAppLocale,
  parseChatAudience,
} from "../../request-context"
import { getDrugProfile } from "../../tools/drug-profile"
import { tavilyExtractTool, tavilySearchTool } from "../../tools/tavily"
import { description, instructionsFor } from "./prompts"

export const clinicalResearchAgent = new Agent({
  id: "clinical-research-agent",
  name: "Clinical Guidelines Researcher",
  description,
  instructions: ({ requestContext }) =>
    instructionsFor(
      parseChatAudience(requestContext.get(AUDIENCE_REQUEST_KEY)),
      parseAppLocale(requestContext.get(LOCALE_REQUEST_KEY))
    ),
  model: ({ requestContext }) =>
    requestContext.get(FAST_MODEL_REQUEST_KEY)
      ? vercelModels.fast
      : vercelModels.base,
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
  memory: new Memory({
    options: {
      generateTitle: true,
      observationalMemory: {
        model: vercelModels.observation,
        observation: {
          // DeepSeek observation models can reject multimodal payloads.
          observeAttachments: "auto",
        },
      },
    },
  }),
  tools: { tavilySearchTool, tavilyExtractTool, getDrugProfile },
  signals: [new TaskSignalProvider()],
})

export const durableClinicalResearchAgent = createDurableAgent({
  agent: clinicalResearchAgent,
})
export const eventedClinicalResearchAgent = createEventedAgent({
  agent: clinicalResearchAgent,
})
