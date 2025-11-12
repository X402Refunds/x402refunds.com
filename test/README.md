# Consulate Test Suite

Comprehensive testing for the Consulate Agentic Dispute Arbitration Platform.

## Test Organization

### Unit Tests (Convex Backend)
- **`agents.test.ts`** (5 tests) - Agent registration, reputation management
- **`cases.test.ts`** (9 tests) - Case filing, status management, resolution
- **`judges.test.ts`** (15 tests) - Judge registration, panel assignment, voting, AI deliberation
- **`court-engine.test.ts`** (10 tests) - Court workflow, automated decisions
- **`events.test.ts`** (10 tests) - Event tracking, system statistics
- **`evidence-specialized.test.ts`** (15 tests) - Evidence queries, filtering, validation

### API Integration Tests
- **`api.test.ts`** (50 tests) - HTTP API endpoints with negative tests
- **`http-endpoints.test.ts`** (25 tests) - Missing core HTTP endpoints

### Integration Tests
- **`integration.test.ts`** (13 tests) - End-to-end workflows, multi-party disputes

### Performance Tests
- **`performance.test.ts`** (10 tests) - Concurrency, large data handling, rate limiting

## Running Tests

### All Tests
```bash
pnpm test:run
```
Runs all tests across the codebase (34 tests).

### Unit Tests Only
```bash
pnpm test:unit
```
Runs only the Convex function unit tests (14 tests).

### API Tests Only
```bash
pnpm test:api
```
Runs only the HTTP API integration tests (20 tests).

### Watch Mode
```bash
pnpm test
```
Runs tests in watch mode for development.

## API Test Configuration

### Default: Production API
By default, API tests run against `https://api.consulatehq.com`.

### Custom API Base URL
To test against a different environment:
```bash
API_BASE_URL=http://localhost:3000 pnpm test:api
```

## Test Coverage

### ✅ Backend Functions (Convex) - 85%+
- [x] Agent registration with owner validation
- [x] Reputation initialization and updates
- [x] Case filing with validation
- [x] Case status management and queries
- [x] Evidence submission (general and specialized types)
- [x] Evidence filtering and validation
- [x] Judge registration and panel assignment
- [x] Judge voting and consensus
- [x] AI deliberation and reasoning
- [x] Court workflow automation
- [x] Event tracking and system stats
- [x] Reputation updates after case resolution
- [x] Agent status management

### ✅ HTTP API Endpoints - 95%
- [x] `GET /` - API info (positive + negative)
- [x] `GET /health` - Health check
- [x] `GET /version` - Version info
- [x] `GET /agents` - List agents (positive + negative + edge cases)
- [x] `GET /agents/:did/reputation` - Get reputation (positive + negative)
- [x] `GET /agents/top-reputation` - Top agents (positive + negative)
- [x] `POST /agents/register` - Register agent (positive + negative)
- [x] `POST /agents/discover` - Agent discovery (positive + negative)
- [x] `POST /agents/capabilities` - Capabilities (positive + negative)
- [x] `POST /evidence` - Submit evidence (positive + negative)
- [x] `POST /disputes` - File dispute (positive + negative)
- [x] `GET /cases/:caseId` - Case status (positive + negative)
- [x] `POST /sla/report` - SLA metrics (positive + negative)
- [x] `GET /sla/status/:agentDid` - SLA status (positive + negative)
- [x] `POST /webhooks/register` - Webhook registration (positive + negative)
- [x] `GET /notifications/:agentDid` - Notifications (positive + negative)
- [x] `GET /live/feed` - Real-time feed (positive + negative)

### ✅ Integration & Performance
- [x] End-to-end dispute lifecycle
- [x] Multi-party disputes (3-party, multiple defendants, class action)
- [x] Evidence chain validation
- [x] Reputation propagation across cases
- [x] Appeal scenarios
- [x] Counterclaim handling
- [x] Concurrent operations (100+ agents, 50+ cases, 100+ evidence)
- [x] Large data handling (1000+ records)
- [x] Rate limiting and burst traffic

### 🔄 Future Enhancements
- [ ] Chain of Custody API tests
- [ ] AAP Protocol endpoint tests
- [ ] Standards API tests
- [ ] Code coverage metrics (Vitest coverage)

## Test Architecture

### Convex Test Library
Tests use `convex-test` for isolated, in-memory Convex function testing:
- ✅ Fast execution (no network calls)
- ✅ Full isolation between tests
- ✅ Realistic Convex behavior
- ✅ Automatic schema validation

### HTTP API Testing
API tests use native `fetch` to test real HTTP endpoints:
- ✅ End-to-end validation
- ✅ CORS header verification
- ✅ Error handling validation
- ✅ Request/response format validation

### Test Data Management

#### In-Memory Tests (convex-test)
Unit tests using `convex-test` have automatic cleanup:
- Unique DIDs with timestamps
- Independent owners and agents per test
- Automatic cleanup via `convex-test` isolated databases

#### HTTP Tests (Live Environment)
HTTP tests hit live Convex deployments and require explicit cleanup:
- **Test data markers**: All test fixtures include `isTestData: true`, `testRunId: <timestamp>`
- **Global cleanup**: `test/setup.ts` runs cleanup after ALL tests complete
- **Manual cleanup**: Run `node scripts/cleanup-all-test-data.js <convex-url>` if needed

#### Test Data Markers
Test data is identified by:
- `isTestData: true` field (preferred)
- Wallet addresses: `0x00000000...`, `0x98765432...`
- DIDs/names containing "test", "mock"
- Jurisdiction tags: `TEST`

#### Cleanup Utilities
- **Automatic**: Global `afterAll` in `test/setup.ts` cleans after test run
- **Manual Dev**: `node scripts/cleanup-dev.js` 
- **Manual Production**: `node scripts/cleanup-production.js` (with confirmation)
- **Batch**: `node scripts/cleanup-all-test-data.js <url>` (runs until clean)

## Quality Checks

Before committing, always run:
```bash
pnpm lint && pnpm type-check && pnpm test:run
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Every pull request
- Before production deployments

## Adding New Tests

### Backend Function Test (In-Memory)
1. Create test in appropriate file (`agents.test.ts`, `cases.test.ts`)
2. Use `convexTest` for test isolation
3. Create test data with unique identifiers
4. Assert expected behavior
5. **No cleanup needed** - convex-test handles it automatically

Example:
```typescript
it('should do something', async () => {
  const result = await t.mutation(api.agents.someFunction, {
    param: 'value'
  });
  expect(result).toBeDefined();
});
```

### HTTP Test (Live Environment)
1. Add test to appropriate file (`api.test.ts`, `mcp-*.test.ts`)
2. Use native `fetch` for HTTP calls
3. **Add test markers** to any created data: `isTestData: true`, `testRunId: Date.now()`
4. Test both success and error cases
5. Validate response structure
6. **Cleanup is automatic** via global `afterAll` hook in `test/setup.ts`

Example:
```typescript
it('should create agent with test markers', async () => {
  const response = await fetch(`${API_BASE_URL}/agents/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Agent',
      publicKey: 'test-key',
      isTestData: true,  // IMPORTANT: Mark as test data
      testRunId: Date.now(),
    }),
  });
  expect(response.status).toBe(200);
});
```

### IMPORTANT: Test Data Cleanup Rules
- ✅ **DO** add `isTestData: true` to all test data
- ✅ **DO** use `testRunId: Date.now()` for batch tracking
- ✅ **DO** rely on global cleanup in `test/setup.ts`
- ❌ **DON'T** test against production (`perceptive-lyrebird-89` or `api.x402disputes.com`)
- ❌ **DON'T** leave test data behind (check with `node scripts/cleanup-all-test-data.js --dry-run`)

## Test Debugging

### View Test Output
```bash
pnpm test:run --reporter=verbose
```

### Run Single Test
```bash
pnpm test:run -t "test name"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/vitest run test/agents.test.ts
```

## Known Issues

### Timeout Warnings
You may see: `TimeoutNegativeWarning: -1 is a negative number`
- This is a known Vitest/Convex-test interaction
- Does not affect test results
- Will be addressed in future Vitest releases

## Performance

Current test suite performance:
- **Total runtime**: ~6-8 seconds
- **Unit tests**: ~0.5 seconds (64 tests)
- **API tests**: ~5.8 seconds (50 tests, network I/O)
- **Integration tests**: ~0.5 seconds (13 tests)
- **Performance tests**: ~0.2 seconds (10 tests)

## Future Enhancements

- [ ] Add mutation testing (Stryker)
- [ ] Add load/stress testing for APIs
- [ ] Add contract testing for AAP compliance
- [ ] Add visual regression testing for dashboard
- [ ] Increase code coverage to 90%+

