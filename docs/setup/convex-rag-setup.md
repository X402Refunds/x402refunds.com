# Convex RAG Setup Guide

This guide explains how to set up the Convex-native RAG (Retrieval-Augmented Generation) system for intelligent codebase understanding.

## Overview

The system uses **Convex vector search** to provide semantic code understanding, integrated directly into your existing Convex database.

### Benefits of Convex RAG

- ✅ **Already integrated** - Uses your existing Convex backend
- ✅ **No external services** - Everything in one database
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Real-time** - Leverage Convex's real-time capabilities
- ✅ **Same auth** - Reuse existing authentication
- ✅ **Lower cost** - Included in Convex plan
- ✅ **Simpler architecture** - No MCP servers or external APIs

## Prerequisites

- Convex project (already set up)
- OpenAI API key (for embeddings)
- Node.js 20+
- pnpm installed

## Step 1: Update Convex Schema

The schema has already been updated with these tables:
- `codebaseFiles` - File metadata and content
- `codebaseEmbeddings` - Vector embeddings for semantic search
- `codebaseDependencies` - Import/export relationships
- `codebaseCommands` - Available pnpm commands

Deploy the updated schema:

```bash
pnpm deploy
```

This will push the new schema to your Convex deployment.

## Step 2: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Convex URL:
   - Go to: https://dashboard.convex.dev
   - Select your deployment
   - Go to Settings > URL
   - Copy the deployment URL (format: `https://xxx.convex.cloud`)

3. Get OpenAI API key:
   - Go to: https://platform.openai.com/api-keys
   - Create new key

4. Update `.env.local`:
   ```bash
   CONVEX_URL=https://your-deployment.convex.cloud
   OPENAI_API_KEY=sk-proj-...your_key_here
   ```

## Step 3: Index Your Codebase

Run the indexer to generate embeddings:

```bash
# Full scan (indexes entire codebase)
pnpm index-codebase:full

# Incremental (only changed files)
pnpm index-codebase
```

This will:
- Scan your codebase files
- Generate vector embeddings using OpenAI
- Upload to Convex database
- Index package.json commands

**Note:** First run takes 5-10 minutes depending on codebase size.

## Step 4: Verify Indexing

Check your Convex dashboard:

1. Go to: https://dashboard.convex.dev
2. Select your deployment
3. Go to Data > Tables
4. Verify data in:
   - `codebaseFiles` - Should have ~200+ entries
   - `codebaseEmbeddings` - Should have ~1000+ entries
   - `codebaseCommands` - Should have ~30+ entries

## Step 5: Test Queries

### Via Convex Dashboard

Go to Functions tab and test:

**Get Index Stats:**
```
api.codebaseSearch.getIndexStats()
```

**Search by Type:**
```
api.codebaseSearch.getFilesByType({fileType: "component"})
```

**Get Commands:**
```
api.codebaseSearch.getCommands()
```

### Via Semantic Search

Test semantic search (requires OpenAI key in Convex environment):

```
api.semanticSearch.searchByQuery({
  query: "authentication logic",
  limit: 5
})
```

## Usage in Code

### Query Files
```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Get all components
const components = useQuery(api.codebaseSearch.getFilesByType, {
  fileType: "component"
});

// Get file dependencies
const deps = useQuery(api.codebaseSearch.getFileDependencies, {
  path: "dashboard/src/components/Header.tsx"
});

// Get available commands
const commands = useQuery(api.codebaseSearch.getCommands);
```

### Semantic Search
```typescript
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

// Search by natural language
const semanticSearch = useAction(api.semanticSearch.searchByQuery);

const results = await semanticSearch({
  query: "How does authentication work?",
  limit: 10
});
```

## Maintenance

### Update Index After Changes

The index can be updated in two ways:

**Manual (Recommended):**
```bash
# After making changes
pnpm index-codebase

# Full reindex if needed
pnpm index-codebase:full
```

**Automatic (Optional):**

Add to git hooks if desired (edit `.git/hooks/pre-commit`):
```bash
# Add after context generation
node scripts/index-to-convex.js
```

### Monitor Usage

Check Convex dashboard:
- Database size (Data tab)
- Function calls (Logs tab)
- Query performance (Functions tab)

Convex limits:
- Free tier: 1GB storage, 1M function calls/month
- Pro tier: Higher limits for production use

## Troubleshooting

### Indexing Fails

**Check environment variables:**
```bash
echo $CONVEX_URL
echo $OPENAI_API_KEY
```

**Verify Convex deployment:**
```bash
pnpm deploy
```

**Check OpenAI API key:**
- Verify key is valid
- Check rate limits (3,000 RPM for free tier)

### No Results from Queries

**Verify data exists:**
- Check Convex dashboard > Data
- Run `getIndexStats()` query

**Check vector index:**
- Schema must be deployed
- Vector index takes a few minutes to build

**Try re-indexing:**
```bash
pnpm index-codebase:full
```

### Semantic Search Errors

**Set environment variable in Convex:**
1. Go to Convex dashboard
2. Settings > Environment Variables
3. Add: `OPENAI_API_KEY=sk-...`
4. Redeploy: `pnpm deploy`

## How It Works

### Query Flow

```
User asks: "How does auth work?"
    ↓
Call: api.semanticSearch.searchByQuery({query: "auth"})
    ↓
Action generates embedding via OpenAI
    ↓
Convex vector search finds similar code
    ↓
Returns top 10 most relevant files
    ↓
Display results with similarity scores
```

### Indexing Flow

```
Code change → Run pnpm index-codebase
    ↓
Script scans changed files (git diff)
    ↓
Generates embeddings via OpenAI
    ↓
Calls Convex mutations to store
    ↓
Updates: files, embeddings, dependencies
    ↓
Ready for next query
```

## Advanced Configuration

### Custom Embedding Model

Edit `scripts/index-to-convex.js`:

```javascript
// Change embedding model
model: 'text-embedding-3-small' // Cheaper, faster
// or
model: 'text-embedding-3-large' // More accurate
```

**Note:** If you change models, update schema dimensions:
```typescript
// convex/schema.ts
dimensions: 1536, // ada-002
dimensions: 1536, // 3-small
dimensions: 3072, // 3-large
```

### Chunk Size Tuning

Adjust `CHUNK_SIZE` in indexer:

```javascript
const CHUNK_SIZE = 2000; // Default
// Increase for better context
// Decrease for more precise matching
```

### File Type Filters

Add custom file type detection in `extractMetadata()`:

```javascript
if (filePath.includes('/hooks/')) fileType = 'hook';
else if (filePath.includes('/utils/')) fileType = 'utility';
```

## Cost Estimates

### OpenAI Costs (Embeddings)

- Model: text-embedding-ada-002
- Cost: $0.0001 per 1K tokens
- Average file: ~500 tokens
- **1000 files ≈ $0.05**
- Incremental updates: ~$0.01/day

### Convex Costs

- Free tier: 1GB storage, 1M calls/month
- Pro tier ($25/mo): 10GB storage, 10M calls/month
- **Most projects stay in free tier**

## Benefits

1. **Semantic Understanding**
   - "Find authentication code" works without exact terms
   - Discovers related patterns automatically

2. **Fast Queries**
   - 10-50ms response time
   - Vector index for instant search

3. **Always Fresh**
   - Run after changes for updates
   - Incremental indexing (fast)

4. **Type-Safe Integration**
   - Full TypeScript support
   - Auto-generated API types

5. **Real-Time Subscriptions**
   - Use Convex subscriptions
   - Live updates when code changes

## Example Queries

### Find Authentication Code
```typescript
const results = await searchByQuery({
  query: "authentication and authorization logic",
  limit: 5
});
```

### Find Similar Components
```typescript
const similar = await findSimilarFiles({
  path: "dashboard/src/components/Header.tsx",
  limit: 10
});
```

### Get Dependencies
```typescript
const deps = await getFileDependencies({
  path: "convex/auth.ts"
});
```

### List All Commands
```typescript
const commands = await getCommands();
// Returns all pnpm commands with categories
```

## Next Steps

- Try semantic queries in your app
- Monitor usage in Convex dashboard
- Adjust chunk sizes if needed
- Set up automatic indexing if desired

## Support

Issues? Check:
- [Convex Docs](https://docs.convex.dev)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- Project README.md

---

**Status**: ✅ Production Ready
**Last Updated**: October 5, 2025
