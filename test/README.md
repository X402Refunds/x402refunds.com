# Consulate Test Suite

Comprehensive testing for the Consulate Agentic Dispute Arbitration Platform.

## Test Organization

### Unit Tests (Convex Backend)
- **`agents.test.ts`** - Agent registration, reputation management
- **`cases.test.ts`** - Case filing, status management, resolution

### API Integration Tests
- **`api.test.ts`** - HTTP API endpoints (Core, Agents, SLA, Webhooks, Monitoring)

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

### ✅ Backend Functions (Convex)
- [x] Agent registration with owner validation
- [x] Reputation initialization and updates
- [x] Case filing with validation
- [x] Case status management
- [x] Evidence submission
- [x] Reputation updates after case resolution
- [x] Agent status management (active, suspended)

### ✅ HTTP API Endpoints
- [x] `GET /` - API info
- [x] `GET /health` - Health check
- [x] `GET /version` - Version info
- [x] `GET /agents` - List agents (with filtering)
- [x] `GET /agents/top-reputation` - Top agents by reputation
- [x] `POST /agents/discover` - Agent discovery
- [x] `POST /sla/report` - SLA metrics reporting
- [x] `POST /webhooks/register` - Webhook registration
- [x] `GET /live/feed` - Real-time activity feed

### 🔄 Partial Coverage
- [ ] `POST /agents/register` - Requires proper owner creation flow
- [ ] `POST /evidence` - Requires authenticated agent context
- [ ] `POST /disputes` - Requires full case setup
- [ ] `GET /cases/:caseId` - Requires existing case
- [ ] `GET /agents/:did/reputation` - Covered partially
- [ ] `GET /notifications/:agentDid` - Returns empty for non-existent agents

### ❌ Not Yet Implemented
- [ ] Chain of Custody API (`GET /api/custody/:caseId`)
- [ ] AAP Protocol endpoints (`.well-known/aap`)
- [ ] Standards API (`GET /api/standards`)
- [ ] Schemas API (`GET /api/schemas/list`)

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
Each test creates its own isolated data:
- Unique DIDs with timestamps
- Independent owners and agents per test
- Automatic cleanup via `convex-test`

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

### Backend Function Test
1. Create test in appropriate file (`agents.test.ts`, `cases.test.ts`)
2. Use `convexTest` for test isolation
3. Create test data with unique identifiers
4. Assert expected behavior

Example:
```typescript
it('should do something', async () => {
  const result = await t.mutation(api.agents.someFunction, {
    param: 'value'
  });
  expect(result).toBeDefined();
});
```

### API Endpoint Test
1. Add test to `api.test.ts` in appropriate describe block
2. Use native `fetch` for HTTP calls
3. Test both success and error cases
4. Validate response structure

Example:
```typescript
it('should return expected data', async () => {
  const response = await fetch(`${API_BASE_URL}/endpoint`);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.field).toBeDefined();
});
```

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
- **Total runtime**: ~3.2 seconds
- **Unit tests**: ~0.15 seconds (14 tests)
- **API tests**: ~3.0 seconds (20 tests, network I/O)

## Future Enhancements

- [ ] Add mutation testing (Stryker)
- [ ] Add load/stress testing for APIs
- [ ] Add contract testing for AAP compliance
- [ ] Add visual regression testing for dashboard
- [ ] Increase code coverage to 90%+

