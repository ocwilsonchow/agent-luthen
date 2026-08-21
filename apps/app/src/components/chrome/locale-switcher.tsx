"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"

const labels: Record<string, string> = {
  en: "English",
  "zh-hk": "繁體中文",
  "zh-cn": "简体中文",
}

export function LocaleSwitcher() {
  const t = useTranslations("nav")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Select
      value={locale}
      onValueChange={(next) => {
        router.replace(pathname, { locale: next as AppLocale })
      }}
    >
      <SelectTrigger aria-label={t("locale")} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((item) => (
          <SelectItem key={item} value={item}>
            {labels[item] ?? item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
