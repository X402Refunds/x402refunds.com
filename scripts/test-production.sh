#!/bin/bash
set -e

# Run smoke tests against PRODUCTION environment
# ⚠️ WARNING: READ-ONLY tests only! Never write to production!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.test.production"

# Load environment variables from .env.test.production if present.
# If missing, fall back to safe defaults (no secrets committed).
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠️  $ENV_FILE not found; using defaults"
fi

# If env file exists but is empty (or doesn't set required vars), fall back to safe defaults.
export API_BASE_URL="${API_BASE_URL:-https://api.x402refunds.com}"
export FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-https://x402refunds.com}"
export NODE_ENV="${NODE_ENV:-production}"
export USE_LIVE_API="${USE_LIVE_API:-true}"

echo "🔥 Running smoke tests against PRODUCTION environment"
echo "⚠️  WARNING: Testing against live production!"
echo "📍 API Base URL: $API_BASE_URL"
echo "📍 Frontend Base URL: $FRONTEND_BASE_URL"
echo "📍 Environment: $NODE_ENV"
echo ""

# Enable CDP smoke test (hits deployed Convex action).
export RUN_SMOKE_CDP_TEST=true
export RUN_SMOKE_BLOCKHASH_TEST=true

# Run ONLY the production smoke tests (read-only critical path validation)
echo "Running production smoke tests (read-only)..."
pnpm exec vitest run test/production-smoke.test.ts test/cdp-live.test.ts

echo ""
echo "✅ Production smoke tests complete!"
