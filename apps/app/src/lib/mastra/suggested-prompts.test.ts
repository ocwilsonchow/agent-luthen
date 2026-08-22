import { describe, expect, test } from "bun:test"
import {
  excerptForFollowUps,
  GENERATE_FOLLOW_UPS_WORKFLOW_ID,
  promptsFromUnknown,
  uniquePrompts,
} from "./suggested-prompts"

describe("promptsFromUnknown", () => {
  test("reads a prompts object", () => {
    expect(
      promptsFromUnknown({
        prompts: [
          " Summarize adult asthma guidelines. ",
          "",
          "Compare GLP-1 agonists for obesity.",
        ],
      })
    ).toEqual([
      "Summarize adult asthma guidelines.",
      "Compare GLP-1 agonists for obesity.",
    ])
  })

  test("reads a string array", () => {
    expect(promptsFromUnknown(["Ask about statin intensity."])).toEqual([
      "Ask about statin intensity.",
    ])
  })

  test("rejects non-string values", () => {
    expect(promptsFromUnknown({ prompts: [1, null, "Keep this"] })).toEqual([
      "Keep this",
    ])
    expect(promptsFromUnknown(null)).toEqual([])
    expect(promptsFromUnknown("not prompts")).toEqual([])
  })
})

describe("uniquePrompts", () => {
  test("drops current and duplicate prompts", () => {
    expect(
      uniquePrompts(
        [
          "Summarize the latest hypertension guidelines for adults.",
          "Review heart failure staging.",
          "review heart failure staging.",
          "What is first-line therapy for gout?",
        ],
        ["Summarize the latest hypertension guidelines for adults."]
      )
    ).toEqual([
      "Review heart failure staging.",
      "What is first-line therapy for gout?",
    ])
  })
})

describe("GENERATE_FOLLOW_UPS_WORKFLOW_ID", () => {
  test("matches the Mastra workflow id", () => {
    expect(GENERATE_FOLLOW_UPS_WORKFLOW_ID).toBe("generate-follow-ups")
  })
})

describe("excerptForFollowUps", () => {
  test("strips med tags and truncates", () => {
    expect(excerptForFollowUps("First-line metformin is used.", 20)).toBe(
      "First-line metformin…"
    )
    expect(
      excerptForFollowUps(
        `First-line <med kind="generic">metformin</med> is used.`
      )
    ).toBe("First-line metformin is used.")
  })

  test("strips ref tags", () => {
    expect(
      excerptForFollowUps(
        `Duration: 5–7 days. <ref url="https://bestpractice.bmj.com/topics/en-gb/8">BMJ Best Practice</ref>`
      )
    ).toBe("Duration: 5–7 days. BMJ Best Practice")
  })
})
