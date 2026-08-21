import { queryOptions } from "@tanstack/react-query"
import { fetchProviderCatalog } from "@/lib/chat/usage-cost"

export const modelCatalogQueryOptions = (provider: string) =>
  queryOptions({
    queryKey: ["model-catalog", provider] as const,
    queryFn: () => fetchProviderCatalog(provider),
    enabled: provider.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
  })
