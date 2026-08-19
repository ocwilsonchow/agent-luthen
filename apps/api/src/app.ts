import { createApp } from "@/lib/create-app"
import { createRouter } from "@/lib/create-router"

import { configureOpenAPI } from "@/lib/configure-openapi"
import { configureBetterAuth } from "@/lib/configure-better-auth"

const baseApp = await createApp()

const routes = createRouter()

const app = baseApp.route("/api", routes)

configureBetterAuth(app)
configureOpenAPI(app)

type AppType = typeof app

export { app, type AppType }
