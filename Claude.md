# Claude Code Configuration for Consulate

**Last Updated**: 2025-10-26

This document contains ALL rules, patterns, and operational procedures for working on the Consulate codebase with Claude Code.

---

## 🎯 System Role & Context

You are a senior full-stack software engineer with deep expertise in AI systems, serverless architecture, and modern web development.

## 🏗️ Tech Stack

### Frontend
- Next.js 14 with App Router (React Server Components)
- React 18+ with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Clerk authentication
- Vercel deployment and edge functions

### Backend
- Convex serverless functions (mutations, queries, actions)
- Convex real-time subscriptions
- TypeScript for all backend logic
- Zod for schema validation
- HTTP endpoints for external integrations

### Development Tools
- **pnpm** (Homebrew-installed, NOT npm/yarn)
- Vitest for testing
- ESLint 9+ with flat config
- TypeScript 5.6+
- Git with semantic-release versioning
- GitHub Actions for CI/CD

### Architecture Patterns
- Monorepo with pnpm workspaces
- Serverless-first backend (Convex)
- Type-safe API layer with Convex client
- Real-time data synchronization
- Multi-agent coordination systems

---

## 📁 Project Structure

**IMPORTANT**: Before starting ANY architecture or implementation work, ALWAYS read the comprehensive project structure map at:
- **File**: `/Users/vkotecha/Desktop/consulate/internal/architecture/project-structure.md`
- This file contains the complete directory tree, file locations, and architectural patterns
- Refer to it to understand where files belong and how they interact

### Quick Reference (see project-structure.md for full details)

**Backend (`convex/`)**
- `agents.ts` - Agent registration and reputation
- `cases.ts` - Dispute case management
- `evidence.ts` - Evidence submission and validation
- `judges.ts` - Judge panel and voting logic
- `courtEngine.ts` - Automated arbitration workflow
- `paymentDisputes.ts` - Payment dispute handling (ACP/ATXP)
- `http.ts` - HTTP API endpoints
- `schema.ts` - Database schema definitions

**Frontend (`dashboard/src/`)**
- `app/` - Next.js 14 App Router pages
- `components/` - React components (31+ components)
- Protected routes with Clerk authentication
- Real-time updates via Convex subscriptions

**Tests (`test/`)**
- Vitest test files
- 400+ tests total
- Integration and unit tests
- Production smoke tests

---

## 🚫 CRITICAL RULES (NEVER VIOLATE)

### 1. Deployment Safety
**NEVER auto-deploy** unless user explicitly requests.

- ❌ Don't run deployment commands automatically
- ✅ Always deploy to **preview first**, then production after validation
- ❌ Never run `pnpm deploy` without user confirmation
- ✅ After fixes: Run quality checks, commit to git, then STOP (don't deploy)
- ✅ User says "deploy" → Ask "preview or production?"

### 2. Testing Requirements (MANDATORY)
**ALWAYS run tests BEFORE committing**. No exceptions.

```bash
# MANDATORY before every commit
pnpm lint && pnpm type-check && pnpm build && pnpm test:run

# MANDATORY before every push
pnpm update-context
```

**Never commit** if any check fails. Period.
**Never push** without running `pnpm update-context` first. Period.

### 3. Documentation Discipline
**NEVER create `.md` files** unless explicitly requested.

- No summary documents
- No auto-generated docs
- No "helpful" documentation
- User must explicitly ask for documentation

### 4. Project Structure Awareness
**ALWAYS read the project structure at the start of EVERY task** to ensure fresh, accurate context.

- ✅ Read `internal/architecture/project-structure.md` at the start of every task (see Rule #5 below)
- ✅ Use this fresh context to inform your implementation decisions
- ✅ Read additional files for implementation details as needed
- ❌ Don't waste time saying "let me understand your project structure" - just read the file silently
- ❌ Don't rely solely on cached knowledge - the structure evolves constantly

### 5. Always Refresh Project Structure (MANDATORY)
**ALWAYS read the project structure at the start of EVERY task** - No exceptions.

- ✅ **MUST READ** `/Users/vkotecha/Desktop/consulate/internal/architecture/project-structure.md` at the start of every task
- ✅ This ensures you have the latest file locations, directory structure, and architectural patterns
- ✅ Do this BEFORE planning or implementing any changes
- ❌ Never rely solely on cached knowledge - the structure may have changed
- ❌ Never skip this step, even for "simple" tasks

**Why this matters:**
- Project structure evolves as features are added
- New directories, files, and patterns emerge
- Fresh context prevents working with outdated assumptions
- Ensures correct file placement and architectural alignment

---

## 🚀 Commands Reference

### Essential Commands
```bash
# Development
pnpm dev                    # Start dev server (connects to preview by default)

# Quality Checks (MANDATORY before commit)
pnpm lint                   # Lint all code
pnpm type-check            # TypeScript validation
pnpm build                 # Build all packages
pnpm test:run              # Run full test suite (400+ tests)
pnpm update-context        # Update codebase context

# Deployment
pnpm deploy                # Deploy to Convex (production)
pnpm deploy:dev            # One-time dev build
pnpm exec convex dev       # Watch mode with hot reload

# Testing (uses .env.test.* files for environment config)
pnpm test:run              # Full test suite (~400 tests) - uses default (PREVIEW)
pnpm test:preview          # Full test suite - PREVIEW (.env.test.preview)
pnpm test:production       # Smoke tests only - PRODUCTION (.env.test.production)
pnpm test:smoke            # Alias for test:preview
pnpm test:smoke:prod       # Alias for test:production

# Monitoring
pnpm check-logs            # View Convex deployment logs
pnpm exec convex deployments  # Show current deployment info
```

### Deployment Environments

**Production Deployment: perceptive-lyrebird-89**
- **Name**: `perceptive-lyrebird-89`
- **Type**: Production (live traffic)
- **Convex API**: `https://perceptive-lyrebird-89.convex.cloud` (for SDK)
- **HTTP Routes**: `https://perceptive-lyrebird-89.convex.site` (for REST API)
- **Production Domain**: `https://api.consulatehq.com` (CNAME to convex.site)
- **Use For**: Real payment disputes, customer integrations, production data

**Preview/Development Deployment: youthful-orca-358**
- **Name**: `youthful-orca-358`
- **Type**: Development/Preview
- **Convex API**: `https://youthful-orca-358.convex.cloud` (for SDK)
- **HTTP Routes**: `https://youthful-orca-358.convex.site` (for REST API)
- **Use For**: Testing, development, CI/CD, smoke tests

**Critical URL Distinction:**
- `.convex.cloud` = Convex SDK connections (queries, mutations)
- `.convex.site` = Public HTTP REST API endpoints
- Custom domain (`api.consulatehq.com`) = CNAME to production `.convex.site`

### Test Environment Configuration (Industry Standard)

**Environment Files:**
- `.env.test.preview` - Preview/dev environment configuration
- `.env.test.production` - Production environment configuration
- Both files are committed to git (no secrets, just URLs)

**How it works:**
- Test scripts (`scripts/test-preview.sh`, `scripts/test-production.sh`) load environment files automatically
- No hardcoded URLs in scripts (industry standard pattern)
- Environment-specific configuration in dedicated files
- Easy to add new environments (staging, local, etc.)

**Why this approach:**
- ✅ No hardcoded URLs (maintainable)
- ✅ Clear separation of environments
- ✅ Easy to understand which environment you're testing
- ✅ Follows industry standard `.env.{environment}` pattern
- ✅ No deployment-specific names in scripts (avoid "youthful-orca" confusion)

---

## 📋 Git Commit Standards

### Release-Triggering Commits
```bash
feat:     # Minor release (new functionality)
fix:      # Patch release (bug fixes)
BREAKING CHANGE:  # Major release (in commit body)
```

### Non-Release Commits
```bash
ci:       # GitHub Actions, workflows
build:    # Dependencies, package.json
docs:     # Documentation only
refactor: # Code reorganization
chore:    # Maintenance, cleanup
test:     # Adding/updating tests
```

### Commit Message Format
```
<type>: <short description>

<detailed explanation if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎨 Design System Reference

**CRITICAL**: All dashboard and UI elements MUST follow the Sovereign Civic Design System.

### Design System Location
- **File**: `/Users/vkotecha/Desktop/consulate/internal/design/sovereign-civic-design-system.md`
- **Version**: 1.0.0
- **Last Updated**: October 2025

### Core Design Rules (NEVER VIOLATE)

1. **Color Palette**:
   - Primary text: `slate-900` (institutional authority)
   - Interactive elements: `blue-600` (sovereign action)
   - Success: `emerald-600`
   - Warning: `amber-600`
   - Critical: `red-600`
   - Info: `blue-50` backgrounds with `blue-700` text
   - **❌ NEVER use purple, pink, violet, or playful gradients** (not in design system)

2. **Typography**:
   - Font: `Inter` (sans-serif), `JetBrains Mono` (monospace for data/IDs)
   - Hierarchy:
     - H1: `text-4xl lg:text-7xl`
     - H2: `text-3xl`
     - H3: `text-2xl`
     - H4: `text-xl`
     - Body: `text-base`
     - Small: `text-sm`
     - Metadata: `text-xs`
   - Weights:
     - `font-bold` (headers, authority)
     - `font-semibold` (emphasis, section headers)
     - `font-normal` (body text)

3. **Component Styling**:
   - Cards: `border-2 border-slate-200 hover:border-blue-300 bg-white shadow-sm`
   - Badges (Info): `bg-blue-50 text-blue-700 border-blue-200`
   - Badges (Success): `bg-emerald-50 text-emerald-700 border-emerald-200`
   - Badges (Warning): `bg-amber-50 text-amber-700 border-amber-200`
   - Buttons (Primary): `bg-slate-900 text-white hover:bg-slate-800`
   - Buttons (Secondary): `bg-blue-600 text-white hover:bg-blue-700`
   - Buttons (Outline): `border-2 border-slate-300 text-slate-700 hover:bg-slate-50`

4. **Spacing (8-point grid)**:
   - Section padding: `py-12 sm:py-16 lg:py-20`
   - Card padding: `p-6`
   - Element gaps: `gap-4`, `gap-6`, `gap-8`
   - Margins: `mb-4`, `mb-6`, `mb-8`, `mb-12`

5. **Branding**:
   - Landing page: "Consulate" (no subtitle)
   - Dashboard: "Consulate" + "Governance OS" subtitle
   - Logo: Shield icon + `bg-blue-600`
   - Jurisdiction badge: "U.S. Federal Jurisdiction" (`bg-blue-50 text-blue-700 border-blue-200`)

### When Creating UI Elements
- ✅ Read design system doc BEFORE starting
- ✅ Use provided component patterns from design system
- ✅ Follow 8-point spacing grid
- ✅ Ensure WCAG AAA contrast ratios (slate-900 on white = 17.5:1)
- ✅ Test mobile responsiveness (mobile-first approach)
- ✅ Use semantic colors appropriately (emerald=success, amber=warning, red=critical, blue=info)
- ❌ Don't create custom colors outside defined palette
- ❌ Don't use purple/pink/violet (not in design system)
- ❌ Don't use playful gradients (except subtle hero: `from-slate-50 to-blue-50`)
- ❌ Don't violate z-index hierarchy (see design system doc)

### Reference Examples
See design system doc for complete component library:
- Button variants (design-system.md:317-337)
- Badge patterns (design-system.md:344-364)
- Card layouts (design-system.md:371-404)
- Typography scale (design-system.md:229-267)

---

## 🧪 Testing Strategy

### Test Environment Configuration

**CRITICAL**: Tests now default to PREVIEW environment for safety.

**Default Behavior (No Environment Variables):**
- `pnpm test:run` → Tests against **PREVIEW** (youthful-orca-358)
- `pnpm test:smoke` → Tests against **PREVIEW** (youthful-orca-358)
- Safe for tests that modify data (write operations)

**Production Testing (Explicit):**
- `pnpm test:smoke:prod` → Tests against **PRODUCTION** (api.consulatehq.com)
- **READ-ONLY tests only!** (health, version, discovery endpoints)
- Uses dedicated script: `scripts/run-smoke-tests-prod.sh`

**Custom Testing:**
```bash
# Test against specific environment
API_BASE_URL=https://custom-url.convex.site pnpm test:run

# Test against production (use with caution!)
API_BASE_URL=https://api.consulatehq.com pnpm test:run
```

### Test Type Categories

**Unit Tests (10 files)** - In-memory Convex testing
- Run against: ANY environment (no HTTP calls, uses `convex-test`)
- Examples: `agents.test.ts`, `cases.test.ts`, `evidence-specialized.test.ts`
- Can run in parallel, isolated, no external dependencies

**Integration Tests (5 files)** - Multi-component workflows
- Run against: PREVIEW (youthful-orca-358) - safe for data modification
- Examples: `integration.test.ts`, `llm-engine.test.ts`, `performance.test.ts`
- Test complex workflows, may create test data

**E2E Tests (5 files)** - HTTP API testing
- Run against: PREVIEW (default) or PRODUCTION (explicit)
- Examples: `api.test.ts`, `e2e-flow.test.ts`, `http-endpoints.test.ts`
- Full HTTP request/response cycle, writes data

**Smoke Tests (1 file)** - Critical path validation
- Run against: PREVIEW or PRODUCTION
- File: `production-smoke.test.ts` (13 tests)
- READ-ONLY: Health, version, MCP discovery, ADP discovery

### Before Committing (MANDATORY)

```bash
# 1. Quality checks (ALWAYS run on PREVIEW by default)
pnpm lint && pnpm type-check && pnpm build && pnpm test:run

# 2. Backend changes - deploy to PREVIEW first
pnpm deploy:dev
pnpm test:smoke

# 3. Update codebase context (MANDATORY before push)
pnpm update-context

# 4. If preview tests pass and context updated, then commit and push
git add . && git commit -m "..." && git push

# 5. Deploy to production only after preview validation
pnpm deploy
pnpm test:smoke:prod
```

### Test Coverage Required
- ✅ New mutations/queries/actions
- ✅ Validation logic
- ✅ Error handling
- ✅ Integration between components
- ✅ HTTP endpoint error cases (4xx, 5xx)

### Expected Test Results
- **Full test suite**: ~400+ tests total
- **Preview smoke tests**: 13/13 passing
- **Production smoke tests**: 13/13 passing (READ-ONLY)
- Some tests may be skipped when `USE_LIVE_API=true` (production mode)

### When to Use Preview vs Production

**Use PREVIEW (youthful-orca-358) for:**
- ✅ Development and testing
- ✅ Tests that CREATE data (agents, disputes, evidence)
- ✅ Tests that MODIFY data (updates, deletions)
- ✅ Load testing, performance testing
- ✅ Experimental features
- ✅ CI/CD pipelines
- ✅ Before every commit

**Use PRODUCTION (api.consulatehq.com) for:**
- ✅ Final validation after deployment
- ✅ Read-only smoke tests (health, version, discovery)
- ✅ Verifying production configuration
- ❌ NEVER for tests that modify data
- ❌ NEVER for automated CI/CD (use preview instead)

---

## 🔧 Development Workflow

### For Feature Development
1. Create feature branch
2. Make changes locally
3. Run quality checks: `pnpm lint && pnpm type-check && pnpm build && pnpm test:run`
4. Update context: `pnpm update-context` (MANDATORY before push)
5. Commit with semantic commit message
6. Push to GitHub
7. Create PR

### For Bug Fixes
1. Reproduce the bug with a test
2. Fix the bug
3. Ensure test passes
4. Run full quality checks
5. Update context: `pnpm update-context` (MANDATORY before push)
6. Commit with `fix:` prefix
7. Push and create PR

### For Deployment

**IMPORTANT**: Always deploy to preview FIRST, validate, then deploy to production.

1. **Deploy to Preview/Dev (youthful-orca-358)** - ALWAYS DEPLOY HERE FIRST:
   ```bash
   # Deploy to preview/dev environment (uses CONVEX_DEPLOYMENT from .env.local)
   pnpm exec convex dev --once --yes
   # OR use the npm script:
   pnpm deploy:dev

   # Test preview deployment
   pnpm test:smoke
   # OR explicitly:
   API_BASE_URL=https://youthful-orca-358.convex.site pnpm test:smoke:prod
   ```

2. **Deploy to Production (perceptive-lyrebird-89)** - ONLY AFTER preview validation:
   ```bash
   # Deploy to production environment (default for convex deploy)
   pnpm exec convex deploy --yes
   # OR use the npm script:
   pnpm deploy

   # Test production deployment
   pnpm test:smoke:prod
   # OR explicitly:
   API_BASE_URL=https://api.consulatehq.com pnpm test:smoke:prod
   ```

   **CRITICAL**: `convex dev` deploys to dev/preview, `convex deploy` deploys to production!

3. **Verify Deployment**:
   ```bash
   # Check which deployment you're on
   pnpm exec convex deployments

   # View logs
   pnpm check-logs

   # Test endpoints manually
   curl https://api.consulatehq.com/.well-known/mcp.json
   ```

---

## 🏛️ Core Product: AI Vendor Dispute Resolution

### Business Model: Infrastructure-as-a-Service

**CRITICAL**: Consulate operates as INFRASTRUCTURE, not full-service arbitration.

**What This Means:**
- ✅ **Customer teams make all final decisions** on disputes
- ✅ **Consulate provides 95% AI automation** + review queue UI
- ✅ **Customer stays in control** - their domain expertise, their rules
- ✅ **Zero judge costs for customers** - no Consulate judges involved
- ✅ **Better margins** - pure software infrastructure model
- ✅ **Full ADP compliance** - per https://github.com/consulatehq/agentic-dispute-protocol

### What This System Does
1. **Automated SLA breach detection** - Monitor agent performance
2. **Evidence collection & validation** - Cryptographic proof chains
3. **Case filing & arbitration** - 95% AI automation
4. **Resolution enforcement** - Integration with payment protocols
5. **Review Queue Management** - UI for customer teams to review edge cases

### Payment Dispute Features
- **Micro-disputes**: Transactions < $1 (auto-resolve in < 5 min)
- **Tiered Pricing**: $0.10 (micro) to $25 (enterprise)
- **Token-based**: 20k tokens included, $0.01/1k overage
- **Regulation E Compliant**: 10 business day resolution
- **ACP/ATXP Integration**: Native payment protocol support
- **95% Automation Rate**: AI handles most cases, 5% go to human review
- **Learning System**: Improves from human judgments and precedents

### Verdict Types
**Payment Disputes:**
- `CONSUMER_WINS` - Full refund to consumer
- `MERCHANT_WINS` - No refund, charge stands
- `PARTIAL_REFUND` - Partial refund amount
- `NEED_REVIEW` - Escalate to human review

**Agent Disputes:**
- `PLAINTIFF_WINS` - Plaintiff's claim upheld
- `DEFENDANT_WINS` - Defendant wins case
- `SPLIT` - Partial award to plaintiff
- `NEED_PANEL` - Escalate to judge panel

---

## 🔒 API Authentication

### API Key Format
```
csk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Production (perceptive-lyrebird-89)
csk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Testing (youthful-orca-358)
```

### Current Authentication Status

**⚠️ SECURITY CONCERN**: Most endpoints are currently PUBLIC (no authentication required)

**Endpoints Requiring Authentication (1 total):**
- `POST /agents/register` - ✅ Requires API key

**Public Endpoints (23 total):**
- Discovery & Health: `/`, `/health`, `/version`, `/.well-known/*`
- **Payment Disputes**: `POST /api/payment-disputes` (❌ PUBLIC - security concern)
- Evidence: `POST /evidence` (❌ PUBLIC - security concern)
- Cases: `GET /cases/:caseId`, `POST /disputes`
- Agents: `GET /agents/*`, `POST /agents/discover`, `POST /agents/capabilities`
- Monitoring: `POST /sla/report`, `GET /sla/status/:agentDid` (deprecated)
- MCP: `POST /mcp/invoke`
- Webhooks: `POST /webhooks/register`, `GET /notifications/:agentDid`
- Live: `GET /live/feed`

**Recommended Security Improvements:**
1. Add authentication to `POST /api/payment-disputes`
2. Add authentication to `POST /evidence`
3. Verify party authorization before allowing actions
4. Add rate limiting to all public endpoints

### How to Get API Key
1. Create organization in Consulate dashboard
2. Navigate to Settings → API Keys
3. Generate new API key (starts with `csk_live_` for production)

### Authentication Header
```bash
Authorization: Bearer csk_live_your_key_here
```

### Error Handling Order
1. **Validate request body first** (returns 400)
2. **Then check authentication** (returns 401)
3. **Then process request** (returns 200/201)

This order provides better developer experience - users see validation errors before auth errors.

---

## 🔌 ACP/ATXP Payment Protocol Integration

### What are ACP & ATXP?
- **ACP** (Autonomous Commerce Protocol) - Payment protocol for AI agent transactions
- **ATXP** (Autonomous Transaction Protocol) - Alternative payment protocol
- Both require **Regulation E compliance** (dispute mechanisms for transactions)

### Integration Pattern
Payment platforms (ACP/ATXP) POST disputes to Consulate's unified dispute endpoint:

```javascript
// Payment platform integration example
const response = await fetch('https://api.consulatehq.com/api/disputes/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer csk_live_...'  // Customer's API key (org auto-detected)
  },
  body: JSON.stringify({
    transactionId: 'txn_abc123',
    transactionHash: '0x...',
    amount: 0.25,  // Micro-transaction
    currency: 'USD',
    paymentProtocol: 'ACP',  // or 'ATXP'
    plaintiff: 'consumer:alice@demo.com',  // Customer wallet
    defendant: 'merchant:api-provider@demo.com',  // Service provider
    disputeReason: 'api_timeout',  // One of: api_timeout, quality_issue, service_not_rendered, amount_incorrect, fraud
    description: 'API request timed out after 30s',
    evidenceUrls: [
      'https://logs.platform.com/timeout.json'
    ],
    callbackUrl: 'https://acp-protocol.com/webhooks/dispute-result'  // Optional
    // NOTE: reviewerOrganizationId is AUTO-DETECTED from API key - no need to send!
  })
});

// Response (within 5 minutes for micro-disputes):
{
  "success": true,
  "caseId": "k123...",
  "paymentDisputeId": "j098...",
  "isMicroDispute": true,
  "aiRecommendation": "CONSUMER_WINS",
  "confidence": 0.97,
  "needsHumanReview": false,
  "estimatedResolutionTime": "< 5 minutes",
  "fee": 0.10,
  "pricingTier": "micro"
}
```

### Dispute Resolution Flow
1. **Dispute Received** → Create case, validate evidence
2. **AI Analysis** (< 1 min) → Constitutional AI reasoning, precedent matching
3. **High Confidence?** (>95%) → Auto-resolve, notify parties
4. **Low Confidence?** (<95%) → Add to review queue for customer team
5. **Human Review** → Customer team makes final decision
6. **Resolution** → Callback to payment protocol with verdict

### Regulation E Compliance
- **Initial Response**: < 5 minutes for micro-disputes
- **Final Resolution**: Within 10 business days (Regulation E requirement)
- **Evidence Submission**: Parties can submit evidence up to 7 days
- **Appeal Process**: Not supported (binding arbitration)

---

## 🚨 Common Pitfalls & Solutions

### ❌ DON'T
- Never commit without running tests
- Never deploy without preview validation
- Never create .md files without explicit request
- Never skip quality checks
- Never assume tests are passing
- Never deploy directly to production
- Never use npm/yarn (use pnpm)
- Never commit .env.local files

### ✅ DO
- Always run tests before committing
- Always validate on preview before production
- Always use semantic commit messages
- Always run quality checks
- Always verify test results
- Always deploy to preview first
- Always use pnpm
- Always use .env.example for templates

---

## 📊 Quality Standards

### Code Quality
- TypeScript strict mode enabled
- ESLint 9+ with flat config
- No console.logs in production code
- Proper error handling in all functions
- Type-safe API layer

### Testing Standards
- Unit tests for business logic
- Integration tests for workflows
- E2E tests for critical paths
- Mock external dependencies
- Test error cases

### Performance Standards
- HTTP routes respond in < 200ms
- Database queries optimized with indexes
- Real-time subscriptions for live updates
- Efficient data pagination
- Token usage monitoring

---

## 🔍 Troubleshooting Guide

### "unknown option '--prod'"
```bash
# ❌ WRONG
pnpm exec convex deploy --prod

# ✅ CORRECT
pnpm exec convex deploy --yes
```

### "404 Not Found" on HTTP routes
```bash
# ❌ WRONG - Using .convex.cloud for HTTP
curl https://youthful-orca-358.convex.cloud/api/endpoint

# ✅ CORRECT - Using .convex.site for HTTP
curl https://youthful-orca-358.convex.site/api/endpoint
```

### "Tests failing but working locally"
1. Check if deployed: `pnpm exec convex deploy --yes`
2. Verify correct URL: `.convex.site` for HTTP tests
3. Check environment variables
4. View logs: `pnpm check-logs`

### "Unauthorized" errors
1. Check API key format: `csk_live_...` or `csk_test_...`
2. Verify key is active in dashboard
3. Check Authorization header format

---

## 🎓 Key Learnings from Real Sessions

### Major Mistakes to Avoid
1. **Never commit without running tests** - This is non-negotiable
2. **Don't dismiss failing tests as "not my problem"** - Take ownership of ALL failures
3. **Don't assume about data/state** - Verify and investigate properly
4. **Don't cut corners** - Quality checks exist for a reason

### Process That Works
1. Read the requirements carefully
2. Run tests BEFORE starting work (know the baseline)
3. Make changes
4. Run tests AFTER changes
5. Fix ALL failures (not just the ones you caused)
6. Commit only when everything passes
7. Deploy to preview first
8. Validate on preview
9. Then deploy to production

---

## 📚 Additional Resources

### Internal Documentation
- `internal/operations/convex-deployment-environments.md` - Deployment details
- `internal/operations/deployment-guide.md` - Step-by-step deployment
- `internal/operations/API_AUTHENTICATION_AUDIT.md` - Auth patterns
- `internal/operations/smoke-test-environment-setup.md` - Testing guide

### External Documentation
- Convex Docs: https://docs.convex.dev
- Next.js Docs: https://nextjs.org/docs
- Vitest Docs: https://vitest.dev

---

## ✍️ Final Notes

**Remember:**
1. **Test first, always** - No exceptions
2. **Own the entire codebase** - Fix what you find
3. **Verify before assuming** - Investigate properly
4. **Preview before production** - Always validate first
5. **Respect the workflow** - Rules exist for good reasons

**When in doubt:**
- Ask the user for clarification
- Run the tests to verify
- Check the logs for errors
- Read the actual code, don't assume

**Success metrics:**
- All quality checks pass
- All tests pass (or known failures documented)
- Changes deployed to preview successfully
- Production deployment validated
- User is happy with the result

---

**Last reminder**: You are working on a production system that handles real disputes and real money. Quality and reliability are paramount. Never cut corners. Never skip tests. Never deploy without validation.

---

## 📋 Quick Reference Tables

### Deployment URLs Quick Reference

| Environment | Purpose | Convex API | HTTP Routes | Custom Domain |
|------------|---------|------------|-------------|---------------|
| **Production** | Live traffic | `perceptive-lyrebird-89.convex.cloud` | `perceptive-lyrebird-89.convex.site` | `api.consulatehq.com` |
| **Preview/Dev** | Testing | `youthful-orca-358.convex.cloud` | `youthful-orca-358.convex.site` | - |

### Command Quick Reference

| Task | Command | Notes |
|------|---------|-------|
| Run tests | `pnpm test:run` | Run before EVERY commit |
| Type check | `pnpm type-check` | Must pass before commit |
| Lint | `pnpm lint` | Must pass before commit |
| Build | `pnpm build` | Must pass before commit |
| **Deploy preview** | `pnpm deploy:dev` or `pnpm exec convex dev --once --yes` | **ALWAYS FIRST** |
| **Deploy production** | `pnpm deploy` or `pnpm exec convex deploy --yes` | **ONLY after preview** |
| Test preview | `pnpm test:smoke` | Before production |
| Test production | `pnpm test:smoke:prod` | After deployment |
| View logs | `pnpm check-logs` | Monitor deployment |

### API Endpoints Quick Reference

**New Unified Dispute Endpoints:**

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/disputes/payment` | POST | ✅ Yes | File payment dispute (ACP/ATXP) |
| `/api/disputes/agent` | POST | ✅ Yes | File agent dispute (SLA/contract) |
| `/api/disputes/payment/stats` | GET | No | Get payment dispute statistics |
| `/api/disputes/payment/review-queue` | GET | No | Get disputes needing review |

**Other Core Endpoints:**

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/.well-known/mcp.json` | GET | No | MCP tool discovery |
| `/.well-known/adp` | GET | No | ADP service discovery |
| `/agents/register` | POST | ✅ Yes | Register agent |
| `/evidence` | POST | ✅ Yes | Submit evidence |
| `/health` | GET | No | Health check |
| `/cases/:caseId` | GET | No | Get case status |

**Future Dispute Types (Coming Soon):**
- `/api/disputes/contract` - Contract breach disputes
- `/api/disputes/ip` - Intellectual property disputes
- `/api/disputes/employment` - Employment disputes

### Pricing Tiers Quick Reference

| Tier | Transaction Amount | Fee | Token Limit | Overage Cost |
|------|-------------------|-----|-------------|--------------|
| Micro | < $1 | $0.10 | 20k | $0.01/1k |
| Small | $1 - $10 | $0.25 | 20k | $0.01/1k |
| Medium | $10 - $100 | $1.00 | 20k | $0.01/1k |
| Large | $100 - $1k | $5.00 | 20k | $0.01/1k |
| Enterprise | > $1k | $25.00 | 20k | $0.01/1k |

### Verdict Types Quick Reference

| Payment Disputes | Agent Disputes | Description |
|-----------------|----------------|-------------|
| `CONSUMER_WINS` | `PLAINTIFF_WINS` | Full refund/award |
| `MERCHANT_WINS` | `DEFENDANT_WINS` | No refund/award |
| `PARTIAL_REFUND` | `SPLIT` | Partial amount |
| `NEED_REVIEW` | `NEED_PANEL` | Escalate to human |

### File Locations Quick Reference

| Type | Location | Purpose |
|------|----------|---------|
| Backend functions | `convex/*.ts` | Serverless functions, queries, mutations |
| HTTP endpoints | `convex/http.ts` | REST API routes |
| Database schema | `convex/schema.ts` | Table definitions |
| Frontend pages | `dashboard/src/app/**/*.tsx` | Next.js pages |
| Components | `dashboard/src/components/**/*.tsx` | React components |
| Tests | `test/**/*.test.ts` | Vitest test files |
| Scripts | `scripts/*.{sh,js}` | Automation scripts |
| Docs | `internal/operations/*.md` | Operational docs |

---

## 🎯 Checklist for Every Task

Before starting ANY task, verify:
- [ ] I've read the requirements carefully
- [ ] I understand what needs to change
- [ ] I've identified which files to modify
- [ ] I know which commit type to use

Before committing ANY code, verify:
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` passes
- [ ] `pnpm test:run` passes, even if the failing tests are unrelated to your changes.
- [ ] `pnpm update-context` has been run (MANDATORY before push)
- [ ] Changes are committed with semantic commit message
- [ ] Commit message includes: description, Co-Authored-By

Before deploying to production, verify:
- [ ] Deployed to preview first
- [ ] Preview tests passing
- [ ] Preview endpoints manually tested
- [ ] No errors in preview logs
- [ ] User approved production deployment

---

**End of Claude.md Configuration**

This document is the single source of truth for Claude Code when working on Consulate. Refer back to it frequently. Update it when you discover new patterns or rules.
