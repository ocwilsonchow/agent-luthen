import { cluster } from "@repo/infra/cluster"
import { ports } from "@repo/infra/ports"
import { betterAuthSecret, databaseUrl } from "./secrets"
import { domain } from "./domain"

export const api = new sst.aws.Service("API", {
  cluster,
  image: {
    context: ".",
    dockerfile: "apps/api/Dockerfile",
  },
  link: [databaseUrl, betterAuthSecret],
  environment: {
    PORT: String(ports.api),
  },
  loadBalancer: {
    rules: [{ listen: "80/http", forward: `${ports.api}/http` }],
    health: {
      [`${ports.api}/http`]: {
        path: "/api/health",
      },
    },
    domain: $app.stage === "local" ? undefined : `${$app.stage}.api.${domain}`,
  },
  capacity: "spot",
  dev: {
    command: "bun run dev",
    directory: "apps/api",
    url: `http://localhost:${ports.api}`,
  },
})
