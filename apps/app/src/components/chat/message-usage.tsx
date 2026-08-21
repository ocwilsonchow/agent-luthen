"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  modelIdFromMessage,
  totalTokenCount,
  usageFromMessage,
  type TokenUsage,
} from "@/lib/chat/mastra-chunks"
import { estimateUsageCost } from "@/lib/chat/usage-cost"
import { modelCatalogQueryOptions } from "@/lib/queries/model-catalog"
import { useQuery } from "@tanstack/react-query"
import type { UIMessage } from "ai"
import { useFormatter, useTranslations } from "next-intl"
import type { TokenCosts } from "tokenlens"

const usageRows = [
  ["inputTokens", "usageInput", "inputUSD"],
  ["outputTokens", "usageOutput", "outputUSD"],
  ["reasoningTokens", "usageReasoning", "reasoningUSD"],
  ["cachedInputTokens", "usageCached", "cacheReadUSD"],
] as const

function formatTokens(format: ReturnType<typeof useFormatter>, value: number) {
  return format.number(value, {
    maximumFractionDigits: value >= 1000 ? 1 : 0,
    notation: value >= 1000 ? "compact" : "standard",
  })
}

function formatUsd(format: ReturnType<typeof useFormatter>, value: number) {
  const fractionDigits =
    value === 0 ? 2 : value < 0.0001 ? 6 : value < 0.01 ? 4 : 2
  return format.number(value, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function UsageBreakdown({
  usage,
  cost,
}: {
  usage: TokenUsage
  cost?: TokenCosts
}) {
  const t = useTranslations("chat")
  const format = useFormatter()
  const rows = usageRows.flatMap(([key, label, costKey]) => {
    const value = usage[key]
    if (value == null) return []
    return [{ key, label, value, usd: cost?.[costKey] }]
  })

  if (rows.length === 0 && cost?.totalUSD == null) return null

  return (
    <div className="grid min-w-44 grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1">
      {rows.map((row) => (
        <div key={row.key} className="contents">
          <span>{t(row.label)}</span>
          <span className="tabular-nums">{formatTokens(format, row.value)}</span>
          <span className="text-right tabular-nums">
            {row.usd != null ? formatUsd(format, row.usd) : ""}
          </span>
        </div>
      ))}
      {cost?.totalUSD != null ? (
        <div className="contents font-medium">
          <span>{t("usageCost")}</span>
          <span />
          <span className="text-right tabular-nums">
            {formatUsd(format, cost.totalUSD)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function MessageUsage({
  message,
  modelId: fallbackModelId,
  provider: fallbackProvider,
}: {
  message: UIMessage
  modelId?: string
  provider?: string
}) {
  const t = useTranslations("chat")
  const format = useFormatter()
  const streamedModelId = modelIdFromMessage(message)
  const modelId = streamedModelId?.includes("/")
    ? streamedModelId
    : fallbackModelId ?? streamedModelId
  const provider = (fallbackProvider || "vercel").toLowerCase()
  const usage = usageFromMessage(message)
  const catalogQuery = useQuery({
    ...modelCatalogQueryOptions(provider),
    enabled: message.role === "assistant" && Boolean(usage),
  })
  const total = usage ? totalTokenCount(usage) : undefined
  const cost =
    usage &&
    estimateUsageCost({
      modelId,
      provider,
      usage,
      catalog: catalogQuery.data,
    })

  if (message.role !== "assistant" || !usage || total == null) return null

  const label =
    cost?.totalUSD != null
      ? t("usageWithCost", {
          total: formatTokens(format, total),
          cost: formatUsd(format, cost.totalUSD),
        })
      : t("usage", { total: formatTokens(format, total) })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="w-fit text-left text-muted-foreground text-xs tabular-nums hover:text-foreground"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <UsageBreakdown usage={usage} cost={cost} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
