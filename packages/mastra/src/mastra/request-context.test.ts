import { describe, expect, test } from "bun:test"
import {
  DEFAULT_APP_LOCALE,
  DEFAULT_CHAT_AUDIENCE,
  parseAppLocale,
  parseChatAudience,
} from "./request-context"

describe("parseChatAudience", () => {
  test("defaults to professional", () => {
    expect(parseChatAudience(undefined)).toBe(DEFAULT_CHAT_AUDIENCE)
    expect(parseChatAudience("public")).toBe("public")
  })
})

describe("parseAppLocale", () => {
  test("accepts app locales and defaults to en", () => {
    expect(parseAppLocale("zh-hk")).toBe("zh-hk")
    expect(parseAppLocale("zh-cn")).toBe("zh-cn")
    expect(parseAppLocale("en")).toBe("en")
    expect(parseAppLocale("fr")).toBe(DEFAULT_APP_LOCALE)
  })
})
