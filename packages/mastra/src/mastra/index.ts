import { Mastra } from "@mastra/core/mastra"
import { MastraCompositeStore } from "@mastra/core/storage"
import { Observability } from "@mastra/observability"
import { durableClinicalResearchAgent } from "./agents/research/agent"
import { injectLuthenRequestContext } from "./server/luthen-request-context"
import { getDrugProfile } from "./tools/drug-profile"
import { tavilyExtractTool, tavilySearchTool } from "./tools/tavily"
import {
  GENERATE_DRUG_PROFILE_WORKFLOW_ID,
  generateDrugProfileWorkflow,
} from "./workflows/generate-drug-profile"
import {
  GENERATE_FOLLOW_UPS_WORKFLOW_ID,
  generateFollowUpsWorkflow,
} from "./workflows/generate-follow-ups"
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
    middleware: [injectLuthenRequestContext],
  },
  agents: { durableClinicalResearchAgent },
  tools: { tavilySearchTool, tavilyExtractTool, getDrugProfile },
  workflows: {
    [GENERATE_DRUG_PROFILE_WORKFLOW_ID]: generateDrugProfileWorkflow,
    [GENERATE_FOLLOW_UPS_WORKFLOW_ID]: generateFollowUpsWorkflow,
  },
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
