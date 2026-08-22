export const AUDIENCE_REQUEST_KEY = "audience"
export const LOCALE_REQUEST_KEY = "locale"

export const LUTHEN_AUDIENCE_HEADER = "x-luthen-audience"
export const LUTHEN_LOCALE_HEADER = "x-luthen-locale"

export const CHAT_AUDIENCES = ["professional", "public"] as const
export type ChatAudience = (typeof CHAT_AUDIENCES)[number]
export const DEFAULT_CHAT_AUDIENCE: ChatAudience = "professional"

export const APP_LOCALES = ["en", "zh-hk", "zh-cn"] as const
export type AppLocale = (typeof APP_LOCALES)[number]
export const DEFAULT_APP_LOCALE: AppLocale = "en"

export const LOCALE_LANGUAGE: Record<AppLocale, string> = {
  en: "English",
  "zh-cn": "Simplified Chinese",
  "zh-hk": "Traditional Chinese (Hong Kong)",
}

export function parseChatAudience(value: unknown): ChatAudience {
  return value === "public" ? "public" : DEFAULT_CHAT_AUDIENCE
}

export function parseAppLocale(value: unknown): AppLocale {
  if (value === "zh-hk" || value === "zh-cn" || value === "en") return value
  return DEFAULT_APP_LOCALE
}
