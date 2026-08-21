import { MastraAuthBetterAuth as MastraAuthBetterAuthBase } from "@mastra/auth-better-auth"
import { auth as authServer } from "@repo/auth/server"

type MastraAuthBetterAuthBaseOptions = ConstructorParameters<
  typeof MastraAuthBetterAuthBase
>[0]

/** Accepts our plugin-configured `betterAuth()` instance; Mastra types `auth` as default `Auth`. */
export class MastraAuthBetterAuth extends MastraAuthBetterAuthBase {
  constructor(
    options: Omit<MastraAuthBetterAuthBaseOptions, "auth"> & {
      auth?: typeof authServer
    }
  ) {
    super({
      ...options,
      auth: options.auth as MastraAuthBetterAuthBaseOptions["auth"],
    })
  }
}
