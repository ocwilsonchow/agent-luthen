/// <reference path="../../.sst/platform/config.d.ts" />
import { domain } from "@repo/infra/domain"

export const router = new sst.aws.Router("Router", {
  domain: $app.stage === "local" ? undefined : `${$app.stage}.${domain}`,
})
