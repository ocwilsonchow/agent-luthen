import { createTool } from "@mastra/core/tools"
import {
  AUDIENCE_REQUEST_KEY,
  LOCALE_REQUEST_KEY,
  parseAppLocale,
  parseChatAudience,
} from "../../request-context"
import { GENERATE_DRUG_PROFILE_WORKFLOW_ID } from "../../workflows/generate-drug-profile"
import {
  isSupportedDrugProfileRegion,
  looksLikeDrugClass,
  normalizeDrugProfileRegion,
} from "./identity"
import {
  drugProfileInputSchema,
  drugProfileOutputSchema,
  emptyDrugProfileSections,
  type DrugProfileOutput,
} from "./schema"

function fail(partial: Omit<DrugProfileOutput, "sections">): DrugProfileOutput {
  return { ...partial, sections: null }
}

export const getDrugProfile = createTool({
  id: "get-drug-profile",
  description:
    "Generate a UK adult drug monograph (indications, mechanism, adverse effects, warnings, interactions, typical prescription, administration, communication, monitoring). Use for a named medicine, not a class or guideline comparison.",
  inputSchema: drugProfileInputSchema,
  outputSchema: drugProfileOutputSchema,
  execute: async (input, context) => {
    const region = normalizeDrugProfileRegion(input.region ?? "UK")
    const length = input.length ?? "concise"
    const indication = input.indication?.trim() || null
    const name = input.name.trim()
    const audience = parseChatAudience(
      context?.requestContext?.get(AUDIENCE_REQUEST_KEY)
    )
    const locale = parseAppLocale(
      context?.requestContext?.get(LOCALE_REQUEST_KEY)
    )

    if (!isSupportedDrugProfileRegion(region)) {
      return fail({
        status: "unsupported_region",
        message: `Only the UK source pack is supported. Received ${region}.`,
        resolvedName: null,
        resolvedFromBrand: null,
        candidates: [],
        indication,
        region,
        length,
      })
    }

    if (looksLikeDrugClass(name)) {
      return fail({
        status: "class_not_supported",
        message: `"${name}" looks like a drug class. Call again with a specific generic, brand, or combination.`,
        resolvedName: null,
        resolvedFromBrand: null,
        candidates: [],
        indication,
        region,
        length,
      })
    }

    const workflow = context?.mastra?.getWorkflow(
      GENERATE_DRUG_PROFILE_WORKFLOW_ID
    )
    if (!workflow) {
      return fail({
        status: "not_found",
        message: "Drug profile generate workflow is not registered.",
        resolvedName: null,
        resolvedFromBrand: null,
        candidates: [],
        indication,
        region,
        length,
      })
    }

    const run = await workflow.createRun()
    const result = await run.start({
      inputData: {
        name,
        indication,
        length,
        region,
        audience,
        locale,
      },
      requestContext: context.requestContext,
    })

    if (result.status !== "success") {
      const message =
        result.status === "failed"
          ? result.error instanceof Error
            ? result.error.message
            : String(result.error)
          : `Drug profile generate did not complete (${result.status}).`
      return fail({
        status: "not_found",
        message,
        resolvedName: null,
        resolvedFromBrand: null,
        candidates: [],
        indication,
        region,
        length,
      })
    }

    const structured = result.result
    if (structured.identity.status !== "ok") {
      return fail({
        status: structured.identity.status,
        message:
          structured.identity.status === "ambiguous"
            ? `Several medicines match "${name}". Retry with one of: ${structured.identity.candidates.join(", ")}.`
            : structured.identity.status === "class_not_supported"
              ? `"${name}" is a drug class. Retry with a specific product.`
              : `No monograph for "${name}".`,
        resolvedName: structured.identity.resolvedName,
        resolvedFromBrand: structured.identity.resolvedFromBrand,
        candidates: structured.identity.candidates,
        indication,
        region,
        length,
      })
    }

    return {
      status: "ok" as const,
      message: `UK adult profile for ${structured.identity.resolvedName ?? name}.`,
      resolvedName: structured.identity.resolvedName,
      resolvedFromBrand: structured.identity.resolvedFromBrand,
      candidates: structured.identity.candidates,
      indication,
      region,
      length,
      sections: structured.sections ?? emptyDrugProfileSections(),
    }
  },
})
