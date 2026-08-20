import { cluster } from "@repo/infra/cluster"
import { ports } from "@repo/infra/ports"
import {
  aiGatewayApiKey,
  betterAuthSecret,
  databaseUrl,
  langfuseBaseUrl,
  langfusePublicKey,
  langfuseSecretKey,
  pineconeApiKey,
  tavilyApiKey,
} from "./secrets"
import { domain } from "./domain"

export const api = new sst.aws.Service("API", {
  cluster,
  image: {
    context: ".",
    dockerfile: "apps/api/Dockerfile",
  },
  link: [
    databaseUrl,
    betterAuthSecret,
    pineconeApiKey,
    tavilyApiKey,
    langfuseSecretKey,
    langfusePublicKey,
    langfuseBaseUrl,
    aiGatewayApiKey,
  ],
  environment: {
    PORT: String(ports.api),
  },
  // For `stage=local` we intentionally avoid creating an ALB/load balancer.
  // Local dev should use `dev.url` / direct container port access instead.
  loadBalancer:
    $app.stage === "local"
      ? undefined
      : {
          rules: [
            { listen: "80/http", redirect: "443/https" },
            { listen: "443/https", forward: `${ports.api}/http` },
          ],
          health: {
            [`${ports.api}/http`]: {
              path: "/api/health",
            },
          },
          domain: `${$app.stage}.api.${domain}`,
        },
  capacity: "spot",
  dev: {
    command: "bun run dev",
    directory: "apps/api",
    url: `http://localhost:${ports.api}`,
  },
  // Use Docker Desktop's built-in builder instead of spinning a new
  // docker-container BuildKit instance (those often fail with
  // "listing workers: error reading server preface: EOF").
  transform: {
    image: {
      builder: { name: "desktop-linux" },
    },
  },
})
