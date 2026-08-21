import { createAuthClient } from "better-auth/react"
import { getApiUrl } from "@/lib/env"

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  fetchOptions: {
    credentials: "include",
  },
})
