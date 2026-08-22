import {
  AUDIENCE_REQUEST_KEY,
  LOCALE_REQUEST_KEY,
  LUTHEN_AUDIENCE_HEADER,
  LUTHEN_LOCALE_HEADER,
  parseAppLocale,
  parseChatAudience,
} from "../request-context"

type RequestContextLike = {
  set: (key: string, value: string) => void
}

type MiddlewareContext = {
  req: { header: (name: string) => string | undefined }
  get: (key: "requestContext") => RequestContextLike
}

export async function injectLuthenRequestContext(
  context: MiddlewareContext,
  next: () => Promise<void>
) {
  const requestContext = context.get("requestContext")
  requestContext.set(
    AUDIENCE_REQUEST_KEY,
    parseChatAudience(context.req.header(LUTHEN_AUDIENCE_HEADER))
  )
  requestContext.set(
    LOCALE_REQUEST_KEY,
    parseAppLocale(context.req.header(LUTHEN_LOCALE_HEADER))
  )
  await next()
}
