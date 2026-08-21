import { config } from "@repo/eslint-config/base"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.sst/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/.mastra/**",
      "**/coverage/**",
      "packages/mastra/.agents/**",
      "packages/mastra/.claude/**",
      "packages/db/drizzle/**",
      "**/sst-env.d.ts",
    ],
  },
  {
    files: ["sst.config.ts", "packages/infra/**/*.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
]
