# agent-luthen

A monorepo that deploys a Hono API (SST) integrating:

- Better Auth (`/api/auth/*`) for session/auth handling
- Mastra (`/api/mastra/*`) for an LLM agent runtime
- OpenAPI + Scalar for API documentation

## How it works (architecture)

```mermaid
flowchart LR
  Client[Client / Browser] -->|HTTP| Api[SST Hono API (apps/api)]
  Api --> Health[Health route (/api/health)]
  Api --> Auth[Better Auth handlers (/api/auth/*)]
  Api --> Mastra[MastraServer (/api/mastra/*)]
  Api --> Docs[OpenAPI + Scalar (/doc, /reference)]

  Mastra --> Postgres[(Postgres via SST DATABASE_URL)]
  Mastra --> Langfuse[(Langfuse via SST LANGFUSE_* secrets)]
```

### API entrypoint and wiring

The API server is implemented in `apps/api`:

- `apps/api/src/index.ts` starts the Hono server.
- `apps/api/src/app.ts` mounts routes under `/api` and wires:
  - health route
  - Better Auth endpoints
  - Mastra endpoints
  - OpenAPI/Scalar docs endpoints
- Mastra is configured in `apps/api/src/lib/configure-mastra.ts`:
  - prefix: `/api/mastra`
  - Mastra OpenAPI: `/api/mastra/openapi.json`

## API routes

### Health

- `GET /api/health`
  Returns `{ "ok": true }`.

### Authentication (Better Auth)

- `POST /api/auth/*`
- `GET /api/auth/*`
  Routes are handled by `packages/auth/server.ts`.

### Agent (Mastra)

- `GET /api/mastra/openapi.json`
  Mastra OpenAPI schema used by the docs UI.
- Mastra endpoints are served under `/api/mastra/*`.
  For the exact request/response shapes, consult the OpenAPI schema above.

### Documentation

- `GET /doc`
  OpenAPI JSON for the Hono app routes.
- `GET /reference`
  Scalar API Reference UI. It aggregates sources including:
  - `/doc`
  - `/api/auth/open-api/generate-schema`
  - `/api/mastra/openapi.json`

## Mastra agent configuration

The Mastra agent is defined in [packages/mastra](packages/mastra/):

- `packages/mastra/src/mastra/agents/agent.ts` configures the agent metadata, model selection, and memory.
- `packages/mastra/src/mastra/index.ts` configures:
  - Mastra auth integration using Better Auth (`MastraAuthBetterAuth`)
  - Postgres-backed storage (`MastraCompositeStore` + `PostgresStore`, using `sst` `Resource.DATABASE_URL`)
  - Langfuse observability via `Resource.LANGFUSE_*`

## Database

Postgres is used for:

- Better Auth persistence (schema defined in `packages/db/schema/auth.ts`)
- Mastra storage (Mastra also creates its own tables for memory/tasks/schedules)

Database migrations are handled by `drizzle-kit` in `packages/db`.

## Development and deployment

### Local dev

The root script runs SST in local stage:

- `bun dev` (see `package.json`)

### DB setup (local)

To generate and apply the DB schema/migrations, the repo provides:

- `bun run setup:schema`

### Deploy

Use SST stages via:

- `bun run deploy:dev`

## Environment variables (SST secrets)

Secrets are declared in `packages/infra/secrets.ts` and are required by runtime code.

- `BETTER_AUTH_SECRET`
  Better Auth session signing secret.
- `DATABASE_URL`
  Postgres connection string (used by auth and Mastra storage).
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_BASE_URL`
  Langfuse observability configuration for Mastra.
- `PINECONE_API_KEY`
- `TAVILY_API_KEY`
  SST secrets available for agent integrations/tools (depending on how Mastra tools are enabled/configured).

### LLM provider keys

The Mastra agent model is configured in `packages/mastra/src/mastra/agents/agent.ts` and will require the corresponding LLM provider environment variables (for example, `OPENAI_API_KEY` for OpenAI-based models).

## Repository layout (quick map)

- [apps/api](apps/api/): Hono API server + route wiring
- [packages/auth](packages/auth/): Better Auth server/cookie helpers
- [packages/mastra](packages/mastra/): Mastra agent + Mastra configuration
- `packages/db`: Drizzle schema + migration scripts (auth tables)
- [packages/infra](packages/infra/): SST stacks (secrets, domains, ports, and the API service)

Useful additional entrypoints:

- `sst.config.ts`: SST app configuration and stack imports.
- `apps/api/src/lib/configure-openapi.ts`: OpenAPI + Scalar docs setup.
