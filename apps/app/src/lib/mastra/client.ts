import { MastraClient } from "@mastra/client-js"
import type { AppLocale } from "@/i18n/routing"
import type { ChatAudience } from "@/lib/chat/audience"
import { getApiUrl } from "@/lib/env"

export const LUTHEN_AUDIENCE_HEADER = "x-luthen-audience"
export const LUTHEN_LOCALE_HEADER = "x-luthen-locale"

export type LuthenRunContext = {
  audience?: ChatAudience
  locale?: AppLocale
}

export function luthenRequestHeaders(context?: LuthenRunContext) {
  const headers: Record<string, string> = {}
  if (context?.audience) headers[LUTHEN_AUDIENCE_HEADER] = context.audience
  if (context?.locale) headers[LUTHEN_LOCALE_HEADER] = context.locale
  return headers
}

export function getMastraClient(context?: LuthenRunContext) {
  const headers = luthenRequestHeaders(context)
  return new MastraClient({
    baseUrl: getApiUrl(),
    apiPrefix: "/api/mastra",
    credentials: "include",
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  })
}
