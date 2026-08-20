import { createApp } from "@/lib/create-app"

import { configureOpenAPI } from "@/lib/configure-openapi"
import { configureBetterAuth } from "@/lib/configure-better-auth"
import health from "@/modules/health"
import { configureMastra } from "@/lib/configure-mastra"

const baseApp = await createApp()

const app = baseApp.route("/api", health)

await configureMastra(app)
configureBetterAuth(app)
configureOpenAPI(app)

type AppType = typeof app

export { app, type AppType }
