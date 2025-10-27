#!/bin/bash
set -e

# Run smoke tests against PRODUCTION environment
# ⚠️ WARNING: READ-ONLY tests only! Never write to production!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.test.production"

# Load environment variables from .env.test.production
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "❌ Error: $ENV_FILE not found"
  exit 1
fi

echo "🔥 Running smoke tests against PRODUCTION environment"
echo "⚠️  WARNING: Testing against live production!"
echo "📍 API Base URL: $API_BASE_URL"
echo "📍 Frontend Base URL: $FRONTEND_BASE_URL"
echo "📍 Environment: $NODE_ENV"
echo ""

# Run ONLY the production smoke tests (read-only critical path validation)
echo "Running production smoke tests (read-only)..."
pnpm exec vitest run test/production-smoke.test.ts

echo ""
echo "✅ Production smoke tests complete!"
