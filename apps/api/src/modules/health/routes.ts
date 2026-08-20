import { createRoute, z } from "@hono/zod-openapi"

export const HealthCheckResponseSchema = z.object({
  ok: z.boolean(),
})

export const healthCheckRoute = createRoute({
  tags: ["Health"],
  method: "get",
  path: "/health",
  summary: "Health",
  description: "Check if the service is running",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: HealthCheckResponseSchema,
        },
      },
    },
  },
})

export type HealthCheckRoute = typeof healthCheckRoute
