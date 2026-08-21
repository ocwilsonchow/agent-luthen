import { MastraClient } from "@mastra/client-js"
import { getApiUrl } from "@/lib/env"

export function getMastraClient() {
  return new MastraClient({
    baseUrl: getApiUrl(),
    apiPrefix: "/api/mastra",
    credentials: "include",
  })
}
