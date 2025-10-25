#!/bin/bash
set -e

# Run all tests against Youthful Orca smoke test environment
# This environment is specifically for running tests that modify data

YOUTHFUL_ORCA_URL="https://youthful-orca-358.convex.site"

echo "🔥 Running ALL tests against Youthful Orca smoke test environment"
echo "📍 API Base URL: $YOUTHFUL_ORCA_URL"
echo ""

# Export environment variables for tests
export API_BASE_URL="$YOUTHFUL_ORCA_URL"
export FRONTEND_BASE_URL="http://localhost:3000"

# Run all tests (no tests will be skipped because USE_LIVE_API will be false)
echo "Running complete test suite..."
pnpm test:run

echo ""
echo "✅ Smoke tests complete!"




