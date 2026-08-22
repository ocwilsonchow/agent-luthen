import { Agent } from "@mastra/core/agent"
import { createStep, createWorkflow } from "@mastra/core/workflows"
import { vercelModels } from "../models"
import {
  GENERATE_FOLLOW_UPS_WORKFLOW_ID,
  generateFollowUpPrompt,
  generateFollowUpsInputSchema,
  generateFollowUpsOutputSchema,
} from "./generate-follow-ups-prompt"

export {
  GENERATE_FOLLOW_UPS_WORKFLOW_ID,
  generateFollowUpPrompt,
  generateFollowUpsInputSchema,
  generateFollowUpsOutputSchema,
} from "./generate-follow-ups-prompt"

const followUpGenerator = new Agent({
  id: "follow-up-generator",
  name: "Follow-up generator",
  instructions:
    "You write short follow-up questions. Do not call tools. Do not wrap text in tags. Return only the structured prompts.",
  model: vercelModels.fast,
})

const generateFollowUpsStep = createStep({
  id: "generate-follow-ups",
  inputSchema: generateFollowUpsInputSchema,
  outputSchema: generateFollowUpsOutputSchema,
  execute: async ({ inputData }) => {
    const result = await followUpGenerator.generate(
      generateFollowUpPrompt(inputData),
      {
        structuredOutput: {
          schema: generateFollowUpsOutputSchema,
          jsonPromptInjection: true,
        },
        modelSettings: {
          temperature: 1.1,
        },
      }
    )
    if (!result.object) {
      throw new Error("Follow-up generate returned no object.")
    }
    return result.object
  },
})

export const generateFollowUpsWorkflow = createWorkflow({
  id: GENERATE_FOLLOW_UPS_WORKFLOW_ID,
  inputSchema: generateFollowUpsInputSchema,
  outputSchema: generateFollowUpsOutputSchema,
})
  .then(generateFollowUpsStep)
  .commit()
