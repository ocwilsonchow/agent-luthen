import { Mastra } from "@mastra/core/mastra"
import { MastraCompositeStore } from "@mastra/core/storage"
import { Observability } from "@mastra/observability"
import {
  durableClinicalResearchAgent,
  eventedClinicalResearchAgent,
} from "./agents/research/agent"
import { tavilyExtractTool, tavilySearchTool } from "./tools/tavily-tools"
import { LangfuseExporter } from "@mastra/langfuse"
import { Resource } from "sst"
import { PinoLogger } from "@mastra/loggers"
import { PostgresStore } from "@mastra/pg"
import { MastraAuthBetterAuth } from "./auth"
import { auth as authServer } from "@repo/auth/server"
import { ports } from "@repo/infra/ports"

export const mastra = new Mastra({
  bundler: {
    transpilePackages: ["@repo/auth", "@repo/db", "@repo/infra"],
  },
  server: {
    port: ports.mastraStudio,
    auth: new MastraAuthBetterAuth({
      auth: authServer,
      mapUserToResourceId: (authUser) => authUser.user.id,
      public: ["/api/mastra/openapi.json"],
    }),
  },
  agents: { durableClinicalResearchAgent },
  tools: { tavilySearchTool, tavilyExtractTool },
  storage: new MastraCompositeStore({
    id: "composite-storage",
    default: new PostgresStore({
      id: "mastra-storage",
      connectionString: Resource.DATABASE_URL.value,
    }),
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      langfuse: {
        serviceName: "mastra",
        exporters: [
          new LangfuseExporter({
            publicKey: Resource.LANGFUSE_PUBLIC_KEY.value,
            secretKey: Resource.LANGFUSE_SECRET_KEY.value,
            baseUrl: Resource.LANGFUSE_BASE_URL.value,
          }),
        ],
      },
    },
  }),
})
