/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "agent-luthen",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "luthen",
          region: "ap-east-1"
        },
      }
    };
  },
  async run() {
    await import("./packages/infra/secrets")
    await import("./packages/infra/api")
    await import("./packages/infra/app")
  },
});
