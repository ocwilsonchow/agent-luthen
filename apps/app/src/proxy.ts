import { getSessionCookie } from "@repo/auth/cookie"
import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { routing } from "@/i18n/routing"
import { getAuthCookiePrefix } from "@/lib/env"

const handleI18n = createMiddleware(routing)

function localeFromPathname(pathname: string) {
  return routing.locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
}

function stripLocale(pathname: string, locale: string) {
  const rest = pathname.slice(locale.length + 1)
  return rest.length === 0 ? "/" : rest
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = localeFromPathname(pathname)

  if (!locale) {
    return handleI18n(request)
  }

  const pathWithoutLocale = stripLocale(pathname, locale)
  const isLogin = pathWithoutLocale === "/login"
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: getAuthCookiePrefix(),
  })

  if (!sessionCookie && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    if (pathWithoutLocale !== "/") {
      url.searchParams.set("next", pathWithoutLocale)
    }
    return NextResponse.redirect(url)
  }

  if (sessionCookie && isLogin) {
    const next = request.nextUrl.searchParams.get("next")
    const url = request.nextUrl.clone()
    url.pathname =
      next && next.startsWith("/") ? `/${locale}${next}` : `/${locale}`
    url.search = ""
    return NextResponse.redirect(url)
  }

  return handleI18n(request)
}

export default proxy

export const config = {
  matcher: [
    "/",
    "/(en|zh-hk|zh-cn)/:path*",
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
}
