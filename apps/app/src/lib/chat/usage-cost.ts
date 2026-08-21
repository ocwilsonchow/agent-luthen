import type { TokenUsage } from "@/lib/chat/mastra-chunks"
import { getUsage, type ProviderInfo, type TokenCosts } from "tokenlens"

export function estimateUsageCost(args: {
  modelId?: string
  provider?: string
  usage: TokenUsage
  catalog?: ProviderInfo
}): TokenCosts | undefined {
  if (!args.modelId || !args.catalog) return undefined
  try {
    const result = getUsage({
      modelId: args.modelId,
      usage: {
        input: args.usage.inputTokens ?? 0,
        output: args.usage.outputTokens ?? 0,
        total: args.usage.totalTokens,
        reasoningTokens: args.usage.reasoningTokens,
        cacheReads: args.usage.cachedInputTokens,
      },
      providers: args.catalog,
    })
    return result.costUSD?.totalUSD != null ? result.costUSD : undefined
  } catch {
    return undefined
  }
}

export async function fetchProviderCatalog(provider: string) {
  const response = await fetch(
    `/api/model-catalog?provider=${encodeURIComponent(provider)}`
  )
  if (!response.ok) return undefined
  return (await response.json()) as ProviderInfo
}
