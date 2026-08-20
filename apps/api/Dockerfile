FROM oven/bun:1 AS bun

FROM node:lts AS base
WORKDIR /app

FROM base AS prepare
RUN npm install -g turbo@^2
COPY . .
# Generate a partial monorepo with a pruned lockfile for the api workspace.
# Build from the repository root: docker build -f apps/api/Dockerfile .
RUN turbo prune api --docker

FROM base AS builder
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install
# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .
# turbo prune omits the repo-root SST types file referenced by package shims
COPY --from=prepare /app/sst-env.d.ts ./sst-env.d.ts

FROM node:lts AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs hono
COPY --from=builder --chown=hono:nodejs /app .

USER hono
EXPOSE 3001
CMD ["npx", "tsx", "apps/api/src/index.ts"]
