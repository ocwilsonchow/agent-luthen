import { domain } from "@repo/infra/domain"
import { ports } from "@repo/infra/ports"
import { betterAuth } from "better-auth"
import { Resource } from "sst"


export const auth = betterAuth({
    baseURL: Resource.App.stage === "local" ? `http://localhost:${ports.app}` : `https://api.${domain}`,
    secret: "secret"
})