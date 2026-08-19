import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { ports } from "@repo/infra/ports"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

serve(
  {
    fetch: app.fetch,
    port: ports.api,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
