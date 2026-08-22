import type { AppLocale } from "@/i18n/routing"
import { getMastraClient } from "@/lib/mastra/client"

const FOLLOW_UP_COUNT = 5
const FOLLOW_UP_EXCERPT_MAX = 3000

/** Must match packages/mastra generate-follow-ups workflow id. */
export const GENERATE_FOLLOW_UPS_WORKFLOW_ID = "generate-follow-ups"

export function promptsFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }
  if (value && typeof value === "object" && "prompts" in value) {
    return promptsFromUnknown(value.prompts)
  }
  return []
}

export function uniquePrompts(
  prompts: string[],
  exclude: string[] = []
): string[] {
  const seen = new Set(exclude.map((prompt) => prompt.trim().toLowerCase()))
  const result: string[] = []
  for (const prompt of prompts) {
    const key = prompt.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(prompt)
  }
  return result
}

export function excerptForFollowUps(
  text: string,
  max = FOLLOW_UP_EXCERPT_MAX
): string {
  const stripped = text
    .replace(/<\/?med\b[^>]*>/gi, "")
    .replace(/<\/?ref\b[^>]*>/gi, "")
    .replace(/<\/?keypoints\b[^>]*>/gi, "")
    .replace(/<\/?safetynotes\b[^>]*>/gi, "")
    .trim()
  if (stripped.length <= max) return stripped
  return `${stripped.slice(0, max)}…`
}

export async function generateFollowUps(input: {
  userText: string
  assistantText: string
  locale: AppLocale
}): Promise<string[]> {
  const run = await getMastraClient()
    .getWorkflow(GENERATE_FOLLOW_UPS_WORKFLOW_ID)
    .createRun()
  const result = await run.startAsync({
    inputData: {
      userText: excerptForFollowUps(input.userText, 1500),
      assistantText: excerptForFollowUps(input.assistantText),
      locale: input.locale,
      count: FOLLOW_UP_COUNT,
    },
  })

  if (result.status !== "success") {
    const message =
      result.status === "failed"
        ? result.error instanceof Error
          ? result.error.message
          : String(result.error)
        : `Follow-up generate did not complete (${result.status}).`
    throw new Error(message)
  }

  const prompts = uniquePrompts(promptsFromUnknown(result.result)).slice(
    0,
    FOLLOW_UP_COUNT
  )
  if (prompts.length === 0) {
    throw new Error("No suggested prompts were generated")
  }
  return prompts
}
