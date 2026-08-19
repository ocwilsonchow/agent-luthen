FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
# Generate a partial monorepo with a pruned lockfile for the api workspace.
# Build from the repository root: docker build -f apps/api/Dockerfile .
RUN turbo prune api --docker

FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install
# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN bunx turbo build

FROM oven/bun:1-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
COPY --from=builder --chown=hono:nodejs /app .

USER hono
EXPOSE 3001
CMD ["bun", "apps/api/dist/index.js"]
