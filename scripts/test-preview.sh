#!/bin/bash
set -e

# Run all tests against PREVIEW environment
# Safe for write operations (creates test data)

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

echo "🧪 Running tests against PREVIEW environment"
echo "📍 API Base URL: $API_BASE_URL"
echo "📍 Frontend Base URL: $FRONTEND_BASE_URL"
echo "📍 Environment: $NODE_ENV"
echo ""

# Run all tests (no tests will be skipped because USE_LIVE_API will be false)
echo "Running complete test suite..."
pnpm test:run

echo ""
echo "✅ Preview tests complete!"
