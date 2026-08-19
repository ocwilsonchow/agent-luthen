import { Mastra } from "@mastra/core/mastra"
import { MastraCompositeStore } from "@mastra/core/storage"
import { Observability } from "@mastra/observability"
import { agent } from "./agents/agent"
import { LangfuseExporter } from "@mastra/langfuse"
import { Resource } from "sst"
import { PinoLogger } from "@mastra/loggers"
import { PostgresStore } from "@mastra/pg"
import { MastraAuthBetterAuth } from "./auth"
import { auth as authServer } from "@repo/auth/server"

export const mastra = new Mastra({
  server: {
    auth: new MastraAuthBetterAuth({
      auth: authServer,
      mapUserToResourceId: (authUser) => authUser.user.id,
      public: ["/api/mastra/openapi.json"],
    }),
  },
  agents: { agent },
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
