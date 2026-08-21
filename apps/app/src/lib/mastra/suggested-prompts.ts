import type { AppLocale } from "@/i18n/routing"
import { getMastraClient } from "@/lib/mastra/client"

export const SUGGESTED_PROMPT_COUNT = 3
const FOLLOW_UP_COUNT = 5
const FOLLOW_UP_EXCERPT_MAX = 3000

const localeLanguage: Record<AppLocale, string> = {
  en: "English",
  "zh-cn": "Simplified Chinese",
  "zh-hk": "Traditional Chinese (Hong Kong)",
}

/** HTTP generate only accepts boolean `jsonPromptInjection`, not `'auto'`. */
export const suggestedPromptJsonPromptInjection = true

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
    .replace(/<\/?keypoints\b[^>]*>/gi, "")
    .replace(/<\/?safetynotes\b[^>]*>/gi, "")
    .trim()
  if (stripped.length <= max) return stripped
  return `${stripped.slice(0, max)}…`
}

async function generateStructuredPrompts(input: {
  agentId: string
  locale: AppLocale
  count: number
  prompt: string
  exclude?: string[]
}): Promise<string[]> {
  const language = localeLanguage[input.locale] ?? localeLanguage.en
  const result = await getMastraClient()
    .getAgent(input.agentId)
    .generate<{ prompts: string[] }>(
      `${input.prompt}\n- Write in ${language}.\n- No numbering, labels, or quotation marks.`,
      {
        maxSteps: 1,
        toolChoice: "none",
        activeTools: [],
        instructions:
          "You write short suggested conversation starters. Do not call tools. Do not wrap text in tags. Return only the structured prompts.",
        structuredOutput: {
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              prompts: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["prompts"],
          },
          jsonPromptInjection: suggestedPromptJsonPromptInjection,
        },
        modelSettings: {
          temperature: 1.1,
        },
      }
    )

  const prompts = uniquePrompts(
    promptsFromUnknown(result.object),
    input.exclude
  ).slice(0, input.count)
  if (prompts.length === 0) {
    throw new Error("No suggested prompts were generated")
  }
  return prompts
}

export async function generateSuggestedPrompts(input: {
  agentId: string
  agentName?: string
  agentDescription?: string
  locale: AppLocale
  exclude?: string[]
}): Promise<string[]> {
  const exclude = input.exclude ?? []
  return generateStructuredPrompts({
    agentId: input.agentId,
    locale: input.locale,
    count: SUGGESTED_PROMPT_COUNT,
    exclude,
    prompt: [
      `Generate ${SUGGESTED_PROMPT_COUNT} suggested user prompts for this assistant.`,
      input.agentName ? `Assistant: ${input.agentName}` : null,
      input.agentDescription ? `Description: ${input.agentDescription}` : null,
      exclude.length > 0
        ? `Do not repeat or closely paraphrase these:\n${exclude
            .map((prompt) => `- ${prompt}`)
            .join("\n")}`
        : null,
      "Requirements:",
      "- Match the assistant's domain and the questions its users typically ask.",
      "- Each prompt is one concise question or request a user would click to start a conversation.",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  })
}

export async function generateFollowUps(input: {
  agentId: string
  userText: string
  assistantText: string
  locale: AppLocale
}): Promise<string[]> {
  return generateStructuredPrompts({
    agentId: input.agentId,
    locale: input.locale,
    count: FOLLOW_UP_COUNT,
    prompt: [
      `Generate ${FOLLOW_UP_COUNT} follow-up questions a user would click next after this exchange.`,
      "User:",
      excerptForFollowUps(input.userText, 1500),
      "Assistant:",
      excerptForFollowUps(input.assistantText),
      "Requirements:",
      "- Dive deeper into the same topic: specifics, related guidelines, comparisons, or practical next steps.",
      "- Each item is one concise question.",
    ].join("\n"),
  })
}
