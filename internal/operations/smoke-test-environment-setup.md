# Smoke Test Environment Setup

**Date**: October 19, 2025  
**Environment**: Youthful Orca (`dev:youthful-orca-358`)  
**Purpose**: Dedicated testing environment for running comprehensive tests including data-modifying operations

## Environment Details

### Convex Deployment
- **Name**: Youthful Orca
- **Deployment ID**: `dev:youthful-orca-358`
- **Cloud URL**: `https://youthful-orca-358.convex.cloud`
- **API URL**: `https://youthful-orca-358.convex.site`

### Environment Variables Configured
- `OPENROUTER_API_KEY`: ✓ Set
- `OPENROUTER_MODEL`: `gpt-oss-20b`
- `OPENROUTER_REASONING_ENABLED`: `true`
- `TOGETHER_API_KEY`: ✓ Set
- `TOGETHER_EMBEDDING_MODEL`: `togethercomputer/m2-bert-80M-32k-retrieval`
- `EMBEDDING_PROVIDER`: `together`

### Schema Updates
- Fixed `functionalTypeRules` table to include `stakingRequirement` field
- All Convex functions deployed successfully
- Schema validation passing

## Running Smoke Tests

### Option 1: Using the Script (Recommended)
```bash
pnpm test:smoke
```

### Option 2: Manual Environment Variables
```bash
API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:run
```

### Option 3: Direct Script Execution
```bash
bash scripts/run-smoke-tests.sh
```

## Test Results (Initial Run)

### Summary
- **Test Files**: 2 failed | 19 passed (21 total)
- **Tests**: 21 failed | 375 passed | 80 skipped (476 total)
- **Duration**: 140.80s
- **Success Rate**: 78.7% (375/476 tests passed)

### ✅ Passing Test Suites
All core functionality tests passed:
- `agents.test.ts` - Agent registration & reputation
- `api.test.ts` - API integration tests
- `apiKeys.test.ts` - API key management
- `cases.test.ts` - Case filing & management
- `court-engine.test.ts` - Automated arbitration workflow
- `e2e-flow.test.ts` - End-to-end workflows
- `events.test.ts` - Event logging
- `evidence-specialized.test.ts` - Specialized evidence types
- `integration.test.ts` - Integration tests
- `judges.test.ts` - Judge panel & voting
- `llm-engine.test.ts` - LLM integration
- `mcp-integration.test.ts` - MCP tool workflows
- `performance.test.ts` - Performance & rate limiting
- `system-endpoints.test.ts` - System endpoints
- `users.test.ts` - User management

### ⚠️ Known Failures

#### 1. ADP Endpoints (`test/adp-endpoints.test.ts`)
**Status**: 14 tests failed (all timeouts)  
**Reason**: These tests expect Next.js frontend routes (`/api/custody`, `/api/standards`, `/api/schemas`) which don't exist in the Convex backend.

**Tests affected**:
- `/api/custody/:caseId` - Chain of custody endpoint
- `/api/standards` - Standards listing
- `/api/standards/arbitration-rules/:version` - Specific standard versions
- `/api/schemas/list` - JSON schema listing
- `/api/schemas/:schemaName` - Specific schemas

**Resolution**: These tests should either:
1. Be moved to a separate frontend test suite, or
2. Be skipped when running against Convex-only environment

#### 2. Production Smoke Tests (`test/production-smoke.test.ts`)
**Status**: 7 tests failed  
**Reason**: Missing endpoints and CORS headers in Convex backend

**Tests affected**:
- `POST /mcp/invoke` - Missing CORS headers on error responses
- `POST /sla/report` - Returns 400 instead of 200/201
- `GET /sla/status/:agentDid` - Missing CORS headers on 404 responses
- `GET /.well-known/adp` - Endpoint not implemented (returns 404)
- `GET /.well-known/adp/neutrals` - Endpoint not implemented (returns 404)
- `GET /live/feed` - Endpoint returns wrong data format
- `OPTIONS /*` - CORS preflight not handled (returns 404)

**Resolution**: These endpoints need to be implemented in `convex/http.ts` or CORS headers need to be added to error responses.

### 📊 Previously Skipped Tests Now Running

Many tests that were previously skipped with `.skipIf(USE_LIVE_API)` are now running successfully:
- MCP authentication tests
- Agent registration workflow tests
- Evidence submission tests
- Case filing tests
- SLA violation detection tests
- Webhook registration tests
- Agent discovery tests

**Key Win**: Only 80 tests skipped (down from much higher), meaning we're now testing significantly more functionality.

## Benefits of This Setup

1. **Safe Testing**: Can run destructive/data-modifying tests without affecting production
2. **Complete Coverage**: Tests that modify data can now run automatically
3. **CI/CD Ready**: Can be integrated into GitHub Actions for automated testing
4. **Development Velocity**: Faster feedback loop for backend changes
5. **Realistic Environment**: Uses actual Convex deployment with real API responses

## Next Steps

### Immediate
1. ✅ Schema fixed and deployed
2. ✅ Environment variables configured
3. ✅ Test script created (`pnpm test:smoke`)
4. ✅ Baseline test results documented

### Short-term Improvements
1. Fix CORS headers on error responses in `convex/http.ts`
2. Implement missing ADP endpoints (`.well-known/adp`, `/live/feed`)
3. Fix `/sla/report` endpoint to return 200/201 instead of 400
4. Update `test/adp-endpoints.test.ts` to skip frontend-only tests
5. Add OPTIONS handler for CORS preflight in `convex/http.ts`

### Long-term Integration
1. Add smoke tests to GitHub Actions workflow
2. Set up automated daily smoke test runs
3. Create test data seeding script for consistent test state
4. Add performance benchmarking against smoke environment
5. Implement test data cleanup cron job

## Maintenance

### Keeping Environment Clean
The Youthful Orca environment will accumulate test data over time. Consider:
1. Manual cleanup via Convex dashboard when needed
2. Automated cleanup script (future implementation)
3. Periodic environment reset if data gets too polluted

### Updating Tests
When adding new Convex functions or endpoints:
1. Add corresponding smoke tests
2. Run `pnpm test:smoke` to verify
3. Update this document with any new known issues

## Related Files
- `scripts/run-smoke-tests.sh` - Smoke test runner script
- `test/production-smoke.test.ts` - HTTP endpoint smoke tests
- `.env.local` - Contains Youthful Orca connection details
- `convex/schema.ts` - Database schema (includes stakingRequirement fix)

---

**Last Updated**: October 19, 2025  
**Maintained By**: Development Team




