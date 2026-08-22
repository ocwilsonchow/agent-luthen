import { describe, expect, test } from "bun:test"
import { generateFollowUpPrompt } from "./generate-follow-ups-prompt"

describe("generateFollowUpPrompt", () => {
  test("asks for locale-specific follow-ups from the exchange", () => {
    const prompt = generateFollowUpPrompt({
      userText: "What is first-line therapy for gout?",
      assistantText: "Colchicine is often used for acute flares.",
      locale: "zh-hk",
      count: 5,
    })

    expect(prompt).toContain("Generate 5 follow-up questions")
    expect(prompt).toContain("What is first-line therapy for gout?")
    expect(prompt).toContain("Colchicine is often used for acute flares.")
    expect(prompt).toContain("Traditional Chinese (Hong Kong)")
  })
})
