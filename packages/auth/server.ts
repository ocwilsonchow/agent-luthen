import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "@repo/db"
import { domain } from "@repo/infra/domain"
import { ports } from "@repo/infra/ports"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import {
  admin,
  lastLoginMethod,
  multiSession,
  openAPI,
  organization,
} from "better-auth/plugins"
import { Resource } from "sst"

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
}

export const auth = betterAuth({
  baseURL:
    Resource.App.stage === "local"
      ? `http://localhost:${ports.app}`
      : `https://api.${domain}`,
  secret: Resource.BETTER_AUTH_SECRET.value,
  trustedOrigins: [
    `http://localhost:${ports.app}`,
    `http://localhost:${ports.mastraStudio}`,
  ],
  advanced: {
    cookiePrefix:
      Resource.App.stage === "local"
        ? `${domain}-local`
        : `${domain}-${Resource.App.stage}`,
    ...(Resource.App.stage === "local"
      ? {
          defaultCookieAttributes: {
            sameSite: "lax" as const,
            secure: false,
          },
        }
      : {
          crossSubDomainCookies: {
            enabled: true,
            domain: "." + domain,
          },
          defaultCookieAttributes: {
            sameSite: "lax" as const,
            secure: true,
          },
        }),
  },
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  plugins: [
    admin(),
    organization(),
    openAPI(),
    lastLoginMethod(),
    multiSession(),
    nextCookies(),
  ],
})
