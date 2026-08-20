import { MastraModelConfig } from "@mastra/core/llm"
import { Resource } from "sst"
import { gateway, GatewayModelId } from "ai"

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
  base: createVercelModelConfig(gateway("xai/grok-4.6").modelId),
  observation: createVercelModelConfig(
    gateway("openai/gpt-5.4-mini").modelId
  ),
} satisfies Partial<Record<ModelType, MastraModelConfig>>
