#!/bin/bash
set -e

# Run smoke tests against PREVIEW environment
# Safe for read-only validation + CDP connectivity check

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.test.preview"

# Load environment variables from .env.test.preview
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Error: $ENV_FILE not found"
  exit 1
fi

echo "🧪 Running smoke tests against PREVIEW environment"
echo "📍 API Base URL: $API_BASE_URL"
echo "📍 Frontend Base URL: $FRONTEND_BASE_URL"
echo "📍 Environment: $NODE_ENV"
echo ""

# Enable CDP smoke test (hits deployed Convex action).
export RUN_SMOKE_CDP_TEST=true

echo "Running preview smoke tests..."
pnpm exec vitest run test/production-smoke.test.ts test/cdp-live.test.ts

echo ""
echo "✅ Preview smoke tests complete!"

