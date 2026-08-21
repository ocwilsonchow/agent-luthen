/// <reference path="../../.sst/platform/config.d.ts" />
import { domain } from "@repo/infra/domain"
import { ports } from "@repo/infra/ports"

const apiUrl =
  $app.stage === "local"
    ? `http://localhost:${ports.api}`
    : `https://${$app.stage}.api.${domain}`

const cookiePrefix =
  $app.stage === "local" ? `${domain}-local` : `${domain}-${$app.stage}`

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/app",
  environment: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX: cookiePrefix,
  },
  domain: $app.stage === "local" ? undefined : `${$app.stage}.${domain}`,
  dev: {
    command: "bun run dev",
    url: `http://localhost:${ports.app}`,
  },
})
