#!/usr/bin/env bash
set -euo pipefail

# Start Mastra Studio with the app's SST secrets (DATABASE_URL, AI_GATEWAY_API_KEY, …).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="${SST_STAGE:-local}"

cd "$ROOT"

exec bunx sst shell --stage "$STAGE" -- \
  bun run --filter @repo/mastra studio "$@"
