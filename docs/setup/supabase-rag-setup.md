# Supabase RAG Setup Guide

This guide explains how to set up the Supabase-backed RAG (Retrieval-Augmented Generation) system for intelligent codebase understanding.

## Overview

The system consists of:
1. **Static Context** (Phase 1) - Fast, always-available codebase map
2. **Supabase RAG** (Phase 2) - Semantic search with vector embeddings

## Prerequisites

- Supabase account (free tier works)
- OpenAI API key (for embeddings)
- Node.js 20+
- pnpm installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to initialize (~2 minutes)

## Step 2: Run Schema Migration

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT/sql
   ```

2. Copy contents of `scripts/supabase-schema.sql`

3. Paste and run in SQL Editor

4. Verify tables were created:
   - codebase_files
   - codebase_embeddings
   - codebase_dependencies
   - codebase_commands

## Step 3: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to: Settings > API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public key` → `SUPABASE_KEY`

3. Get OpenAI API key:
   - Go to: https://platform.openai.com/api-keys
   - Create new key → `OPENAI_API_KEY`

4. Update `.env.local`:
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=eyJhbGc...your_key_here
   OPENAI_API_KEY=sk-proj-...your_key_here
   ```

## Step 4: Install Dependencies

```bash
pnpm add @supabase/supabase-js
```

## Step 5: Index Your Codebase

Run the indexer to generate embeddings:

```bash
# Full scan (indexes entire codebase)
pnpm index-supabase --full

# Incremental (only changed files)
pnpm index-supabase
```

This will:
- Scan your codebase files
- Generate vector embeddings using OpenAI
- Upload to Supabase
- Index package.json commands

**Note:** First run takes 5-10 minutes depending on codebase size.

## Step 6: Configure Cursor MCP

The `.cursor/mcp.json` file should already be configured. Verify it exists:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_KEY": "${SUPABASE_KEY}"
      }
    }
  }
}
```

## Step 7: Restart Cursor

1. Completely quit Cursor (Cmd+Q on Mac)
2. Restart Cursor
3. MCP server will auto-load

## Step 8: Test the System

Start a new Cursor chat and try:

**Test 1: Semantic Search**
```
"How does authentication work in detail?"
```

Should return relevant files from `convex/auth.ts`, `convex/apiKeys.ts`, etc.

**Test 2: Component Discovery**
```
"Show me components similar to Header"
```

Should find related UI components using semantic similarity.

**Test 3: Dependency Queries**
```
"What files import the Header component?"
```

Should show dependency relationships.

## Maintenance

### Update Index After Changes

The index updates automatically via git hooks, but you can manually trigger:

```bash
# Incremental update (recommended)
pnpm index-supabase

# Full reindex (if needed)
pnpm index-supabase --full
```

### Monitor Supabase Usage

Check your Supabase dashboard:
- Database size
- API requests
- Row counts

Free tier limits:
- 500MB database
- 2GB bandwidth/month
- Unlimited API requests

### Troubleshooting

**MCP server not loading:**
1. Check `.cursor/mcp.json` exists
2. Verify environment variables in `.env.local`
3. Restart Cursor completely

**Indexing fails:**
1. Check OpenAI API key is valid
2. Verify Supabase credentials
3. Check rate limits (OpenAI: 3,000 RPM)

**No results from queries:**
1. Verify indexing completed successfully
2. Check Supabase tables have data:
   ```sql
   SELECT COUNT(*) FROM codebase_files;
   SELECT COUNT(*) FROM codebase_embeddings;
   ```

## How It Works

### Query Flow

```
User asks: "How does auth work?"
    ↓
Cursor sends query to Supabase MCP
    ↓
MCP generates query embedding
    ↓
Supabase searches using pgvector (cosine similarity)
    ↓
Returns top 10 most relevant files
    ↓
Cursor includes context in response
```

### Indexing Flow

```
Code change → Commit
    ↓
Git hook runs index-supabase.js
    ↓
Script scans changed files
    ↓
Generates embeddings via OpenAI
    ↓
Uploads to Supabase
    ↓
Ready for next query
```

## Advanced Configuration

### Custom Embedding Model

Edit `scripts/index-to-supabase.js` to use different model:

```javascript
// Change from text-embedding-ada-002 to:
model: 'text-embedding-3-small' // Cheaper, faster
// or
model: 'text-embedding-3-large' // More accurate
```

### Chunk Size Tuning

Adjust `CHUNK_SIZE` in indexer for better/worse granularity:

```javascript
const CHUNK_SIZE = 2000; // Default
// Increase for better context
// Decrease for more precise matching
```

### Search Threshold

Adjust similarity threshold in Supabase function:

```sql
-- In search_similar_files function
WHERE 1 - (e.embedding <=> query_embedding) > 0.7
-- Increase (0.8+) for stricter matches
-- Decrease (0.6-) for broader matches
```

## Cost Estimates

### OpenAI Costs (Embeddings)

- Model: text-embedding-ada-002
- Cost: $0.0001 per 1K tokens
- Average file: ~500 tokens
- **1000 files ≈ $0.05**
- Incremental updates: ~$0.01/day

### Supabase Costs

- Free tier: Sufficient for solo dev
- Pro tier ($25/mo): For teams or large codebases

## Benefits

1. **Semantic Understanding**
   - "Find authentication code" works even without exact terms
   - Discovers related patterns automatically

2. **Fast Queries**
   - 50-100ms response time
   - No scanning entire codebase

3. **Always Fresh**
   - Updates on every commit
   - No stale information

4. **Cross-Machine**
   - Works on any machine
   - Team shares same context

5. **Scalable**
   - Handles 10,000+ files
   - Performance stays constant

## Next Steps

- Try semantic queries in Cursor
- Monitor usage in Supabase dashboard
- Adjust chunk sizes if needed
- Share setup with team

## Support

Issues? Check:
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- Project README.md
