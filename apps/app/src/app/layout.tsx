import { hasLocale } from "next-intl"
import { getLocale } from "next-intl/server"
import { Geist, Geist_Mono } from "next/font/google"
import { routing } from "@/i18n/routing"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let locale: string = routing.defaultLocale
  try {
    const detected = await getLocale()
    if (hasLocale(routing.locales, detected)) {
      locale = detected
    }
  } catch {
    locale = routing.defaultLocale
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
