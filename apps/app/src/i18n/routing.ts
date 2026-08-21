import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "zh-hk", "zh-cn"],
  defaultLocale: "en",
})

export type AppLocale = (typeof routing.locales)[number]
