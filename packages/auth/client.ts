import { ports } from "@repo/infra/ports"
import { domain } from "@repo/infra/domain"
import { Resource } from "sst"
import { createAuthClient } from "better-auth/react"
import {
  adminClient,
  lastLoginMethodClient,
  magicLinkClient,
  oneTimeTokenClient,
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"

export const authReactClient = createAuthClient({
  baseURL:
    Resource.App.stage === "local"
      ? `http://localhost:${ports.api}`
      : `https://api.${domain}`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    adminClient(),
    organizationClient(),
    apiKeyClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
    twoFactorClient(),
    phoneNumberClient(),
    oneTimeTokenClient(),
  ],
})
