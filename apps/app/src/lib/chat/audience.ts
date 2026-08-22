export const CHAT_AUDIENCES = ["professional", "public"] as const
export type ChatAudience = (typeof CHAT_AUDIENCES)[number]
export const DEFAULT_CHAT_AUDIENCE: ChatAudience = "professional"
export const THREAD_AUDIENCE_METADATA_KEY = "audience"

export function parseChatAudience(value: unknown): ChatAudience {
  return value === "public" ? "public" : DEFAULT_CHAT_AUDIENCE
}

export function audienceFromThreadMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return parseChatAudience(metadata?.[THREAD_AUDIENCE_METADATA_KEY])
}
