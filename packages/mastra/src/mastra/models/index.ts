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

type ModelType = "base" | "observation" | "tool"

export const vercelModels = {
  base: createVercelModelConfig(gateway("deepseek/deepseek-v4-flash").modelId),
  observation: createVercelModelConfig(
    gateway("deepseek/deepseek-v4-flash").modelId
  ),
} satisfies Partial<Record<ModelType, MastraModelConfig>>
