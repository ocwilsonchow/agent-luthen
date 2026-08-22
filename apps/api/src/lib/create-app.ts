import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { requestId } from "hono/request-id"
import { HTTPException } from "hono/http-exception"
import { Resource } from "sst"
import { domain } from "@repo/infra/domain"
import { createRouter } from "@/lib/create-router"
import { ports } from "@repo/infra/ports"

export async function createApp() {
  const app = createRouter()

  app.use(
    cors({
      origin: [
        `http://localhost:${ports.app}`,
        `https://${Resource.App.stage}.${domain}`,
        `https://${Resource.App.stage}.api.${domain}`,
      ],
      credentials: true,
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "x-luthen-audience",
        "x-luthen-locale",
      ],
    })
  )
  app.use(requestId())
  app.use(logger())
  app.notFound((c) => {
    return c.json(
      {
        ok: false,
        errors: [
          {
            message: "Not Found",
            source: "not_found",
          },
        ],
      },
      404
    )
  })
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        {
          ok: false,
          errors: [{ message: err.message, source: "server" }],
        },
        err.status
      )
    }

    console.error(err)
    return c.json(
      {
        ok: false,
        errors: [{ message: err.message, source: "server" }],
      },
      500
    )
  })

  return app
}
