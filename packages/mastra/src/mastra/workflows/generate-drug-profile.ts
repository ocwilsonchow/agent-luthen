import { Agent } from "@mastra/core/agent"
import { createStep, createWorkflow } from "@mastra/core/workflows"
import { vercelModels } from "../models"
import {
  LOCALE_LANGUAGE,
  type AppLocale,
  type ChatAudience,
} from "../request-context"
import {
  drugProfileGenerateInputSchema,
  drugProfileStructuredSchema,
} from "../tools/drug-profile/schema"

export const GENERATE_DRUG_PROFILE_WORKFLOW_ID = "generate-drug-profile"

const drugProfileGenerator = new Agent({
  id: "drug-profile-generator",
  name: "Drug profile generator",
  instructions:
    "You generate a UK adult drug monograph as structured data. Never invent URLs. Leave section sources empty.",
  model: vercelModels.drugProfile,
})

function generatePrompt(input: {
  name: string
  indication: string | null
  length: "concise" | "detailed"
  audience: ChatAudience
  locale: AppLocale
  region: string
}) {
  const language = LOCALE_LANGUAGE[input.locale]
  const voice =
    input.audience === "public"
      ? [
          "Audience: public.",
          "prescription = how this medicine is usually taken, never a self-prescribe recipe.",
          "communication = questions to ask a clinician and what to report. Not a second administration list.",
        ].join(" ")
      : [
          "Audience: professional.",
          "prescription = typical adult licensed regimens.",
          "communication = counselling points to tell the patient.",
        ].join(" ")

  return [
    `Drug query: ${input.name}`,
    `Region: ${input.region}. Use ${input.region} adult licensed practice.`,
    input.indication
      ? `Focus indication: ${input.indication}`
      : "No indication given — label prescription and monitoring as typical adult licensed use.",
    `Length: ${input.length}.`,
    `Write section bodies in ${language}.`,
    voice,
    "Adult licensed use only. Do not invent paediatric doses.",
    "identity.resolvedName is the generic / INN. If the query is a unique brand, set resolvedFromBrand to that brand.",
    "If several distinct generics match, identity.status = ambiguous and list candidates. Do not fill sections.",
    "If the query is a drug class, identity.status = class_not_supported.",
    "If you cannot identify the medicine, identity.status = not_found.",
    "Each section: status ok when you can fill it; otherwise unavailable with body null.",
    "Always set sources to []. Never invent, guess, or rewrite a URL.",
  ].join("\n")
}

const generateDrugProfileStep = createStep({
  id: "generate-drug-profile",
  inputSchema: drugProfileGenerateInputSchema,
  outputSchema: drugProfileStructuredSchema,
  execute: async ({ inputData }) => {
    const result = await drugProfileGenerator.generate(
      generatePrompt(inputData),
      {
        structuredOutput: {
          schema: drugProfileStructuredSchema,
          jsonPromptInjection: true,
        },
      }
    )
    if (!result.object) {
      throw new Error("Drug profile generate returned no object.")
    }
    return result.object
  },
})

export const generateDrugProfileWorkflow = createWorkflow({
  id: GENERATE_DRUG_PROFILE_WORKFLOW_ID,
  inputSchema: drugProfileGenerateInputSchema,
  outputSchema: drugProfileStructuredSchema,
})
  .then(generateDrugProfileStep)
  .commit()
