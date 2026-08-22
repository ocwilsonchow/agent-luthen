import { describe, expect, test } from "bun:test"
import {
  DEFAULT_CHAT_AUDIENCE,
  audienceFromThreadMetadata,
  parseChatAudience,
} from "./audience"

describe("parseChatAudience", () => {
  test("defaults to professional", () => {
    expect(parseChatAudience(undefined)).toBe(DEFAULT_CHAT_AUDIENCE)
    expect(parseChatAudience("professional")).toBe("professional")
    expect(parseChatAudience("public")).toBe("public")
    expect(parseChatAudience("other")).toBe("professional")
  })
})

describe("audienceFromThreadMetadata", () => {
  test("reads the audience key", () => {
    expect(audienceFromThreadMetadata(undefined)).toBe("professional")
    expect(audienceFromThreadMetadata({ audience: "public" })).toBe("public")
  })
})
