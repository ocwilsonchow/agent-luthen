import type { RouteHandler } from "@hono/zod-openapi"
import type { AppBindings } from "@/lib/types"
import type { HealthCheckRoute } from "./routes"

export const healthCheckHandler: RouteHandler<HealthCheckRoute, AppBindings> = (
  c
) => {
  return c.json({
    ok: true,
  })
}
