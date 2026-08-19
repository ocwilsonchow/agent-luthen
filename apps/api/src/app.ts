import { createApp } from "@/lib/create-app"

import { configureOpenAPI } from "@/lib/configure-openapi"
import { configureBetterAuth } from "@/lib/configure-better-auth"
import health from "@/modules/health"

const baseApp = await createApp()

const app = baseApp.route("/api", health)

configureBetterAuth(app)
configureOpenAPI(app)

type AppType = typeof app

export { app, type AppType }
