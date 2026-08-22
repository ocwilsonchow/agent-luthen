import { z } from "zod"
import {
  APP_LOCALES,
  LOCALE_LANGUAGE,
  type AppLocale,
} from "../request-context"

export const GENERATE_FOLLOW_UPS_WORKFLOW_ID = "generate-follow-ups"

export const generateFollowUpsInputSchema = z.object({
  userText: z.string(),
  assistantText: z.string(),
  locale: z.enum(APP_LOCALES),
  count: z.number().int().positive(),
})

export const generateFollowUpsOutputSchema = z.object({
  prompts: z.array(z.string()),
})

export function generateFollowUpPrompt(input: {
  userText: string
  assistantText: string
  locale: AppLocale
  count: number
}) {
  const language = LOCALE_LANGUAGE[input.locale]
  return [
    `Generate ${input.count} follow-up questions a user would click next after this exchange.`,
    "User:",
    input.userText,
    "Assistant:",
    input.assistantText,
    "Requirements:",
    "- Dive deeper into the same topic: specifics, related guidelines, comparisons, or practical next steps.",
    "- Each item is one concise question.",
    `- Write in ${language}.`,
    "- No numbering, labels, or quotation marks.",
  ].join("\n")
}
