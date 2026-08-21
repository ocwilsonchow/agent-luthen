import type { MastraModelConfig } from "@mastra/core/llm"
import { Resource } from "sst"
import { gateway, type GatewayModelId } from "ai"

export const createVercelModelConfig = (
  modelId: GatewayModelId
): MastraModelConfig => {
  return {
    providerId: "vercel",
    modelId,
    apiKey: Resource.AI_GATEWAY_API_KEY.value,
  }
}

type ModelType = "base" | "observation" | "tool" | "fast"

/** Request-context flag to select `vercelModels.fast` for a single generate. */
export const FAST_MODEL_REQUEST_KEY = "useFastModel"

export const vercelModels = {
  base: createVercelModelConfig(gateway("deepseek/deepseek-v4-flash").modelId),
  observation: createVercelModelConfig(
    gateway("deepseek/deepseek-v4-flash").modelId
  ),
  fast: createVercelModelConfig(
    gateway("google/gemini-3.5-flash-lite").modelId
  ),
} satisfies Partial<Record<ModelType, MastraModelConfig>>
