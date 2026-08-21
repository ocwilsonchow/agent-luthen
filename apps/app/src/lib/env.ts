import { domain } from "@repo/infra/domain"
import { ports } from "@repo/infra/ports"

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${ports.api}`
}

export function getAuthCookiePrefix() {
  return process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX ?? `${domain}-local`
}
