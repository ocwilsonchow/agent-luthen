import { serve } from "@hono/node-server"
import { ports } from "@repo/infra/ports"
import { app } from "./app"

serve(
  {
    fetch: app.fetch,
    port: ports.api,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
