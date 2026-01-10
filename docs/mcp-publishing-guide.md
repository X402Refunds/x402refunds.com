# Publishing X402Refunds to MCP Registry

This guide explains how X402Refunds' MCP server is published to the official MCP directory.

## Overview

X402Refunds can be published to the MCP registry whenever version tags are pushed or manually triggered.

## Current Setup

- **Automated Publishing**: GitHub Actions workflow (`.github/workflows/publish-mcp.yml`)
- **Server Metadata**: `server.json` (MCP registry format)
- **Authentication**: GitHub OIDC (no secrets required)
- **Namespace**: `com.x402refunds/x402-refunds` (see `server.json`)

## How It Works

### Automatic Publishing

When you push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:
1. ✅ Validate `server.json` structure
2. ✅ Update version from tag
3. ✅ Verify MCP endpoints are accessible
4. ✅ Authenticate with MCP registry (GitHub OIDC)
5. ✅ Publish to registry
6. ✅ Verify publication

### Manual Publishing

You can also trigger manually from GitHub Actions UI:

1. Go to **Actions** → **Publish to MCP Registry**
2. Click **Run workflow**
3. Optionally provide a version number
4. Click **Run workflow**

## Server Configuration

The `server.json` file defines:

- **Name**: `com.x402refunds/x402-refunds`
- **Type**: Remote HTTP server (`streamable-http`)
- **URL**: `https://api.x402refunds.com`
- **Endpoints**:
  - Discovery: `/.well-known/mcp.json`
  - Invoke: `/mcp/invoke`

## Validation

Before publishing, the workflow validates:

- ✅ JSON syntax is valid
- ✅ Required fields present (`$schema`, `name`, `title`, `description`, `version`)
- ✅ Name format matches namespace (`io.github.*` or `com.*`)
- ✅ Remote configuration valid (URL, transport type)
- ✅ MCP endpoints are accessible
- ✅ Discovery endpoint returns tools

Run validation locally:

```bash
node scripts/validate-server-json.js
```

## Authentication

The workflow uses **GitHub OIDC** authentication, which:

- ✅ Requires no secrets
- ✅ Works automatically in GitHub Actions
- ✅ Uses your GitHub account permissions
- ✅ Secure token-based auth

## Updating server.json

When updating server metadata:

1. Edit `server.json`
2. Validate locally: `node scripts/validate-server-json.js`
3. Commit changes
4. Tag a new version: `git tag v1.0.1 && git push origin v1.0.1`
5. Or trigger manually from GitHub Actions

## Troubleshooting

### Validation Fails

Check `server.json` structure:
- Must have `$schema` field
- `name` must match namespace format
- `remotes` array must have valid URL

### Authentication Fails

- Ensure workflow has `id-token: write` permission (already configured)
- Check GitHub Actions logs for OIDC errors

### Endpoints Not Accessible

- Verify `https://api.x402refunds.com/.well-known/mcp.json` returns 200
- Verify `https://api.x402refunds.com/mcp/invoke` returns 401 (auth required), not 404

### Publication Not Appearing

- Registry indexing can take 5-10 minutes
- Check search: `https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vbkotecha/consulate`

## Resources

- **MCP Registry**: https://modelcontextprotocol.info/directory
- **Publishing Docs**: https://modelcontextprotocol.info/tools/registry/publishing
- **Schema Reference**: https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json

