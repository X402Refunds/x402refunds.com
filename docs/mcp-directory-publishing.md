# Publishing Consulate MCP Server to MCP Directory

Guide for publishing Consulate's MCP server to the official MCP directory/registry.

**Last Updated**: 2025-10-30

---

## Overview

The MCP directory is a public registry where MCP-compatible agents can discover and use your server. Publishing Consulate there makes it discoverable by default in many MCP clients.

---

## Prerequisites

1. **MCP Server Running**: Your server must be deployed and accessible
   - Discovery endpoint: `https://api.x402disputes.com/.well-known/mcp.json`
   - Invoke endpoint: `https://api.x402disputes.com/mcp/invoke`

2. **GitHub Account**: For authentication with the MCP registry

3. **server.json File**: Already created in repo root (see `server.json`)

---

## Step 1: Install MCP Publisher CLI

### macOS/Linux (Homebrew - Recommended)

```bash
brew install mcp-publisher
```

### macOS/Linux (Pre-built Binary)

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/download/v1.0.0/mcp-publisher_1.0.0_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/
```

### From Source

```bash
git clone https://github.com/modelcontextprotocol/registry
cd registry
make publisher
export PATH=$PATH:$(pwd)/bin
```

### Windows PowerShell

```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/download/v1.0.0/mcp-publisher_1.0.0_windows_$arch.tar.gz" -OutFile "mcp-publisher.tar.gz"
tar xf mcp-publisher.tar.gz mcp-publisher.exe
rm mcp-publisher.tar.gz
# Move mcp-publisher.exe to a directory in your PATH
```

### Verify Installation

```bash
mcp-publisher --version
```

---

## Step 2: Authenticate with MCP Registry

Before publishing, you need to authenticate:

```bash
mcp-publisher auth
```

This will:
1. Open your browser to the MCP registry authentication page
2. Connect your GitHub account
3. Store credentials locally for future publishes

**Alternative**: Some versions use API keys instead:
- Generate API key at: https://modelcontextprotocol.info/tools/registry/
- Set environment variable: `export MCP_REGISTRY_API_KEY=your_key_here`

---

## Step 3: Review server.json

Before publishing, verify your `server.json` file is correct:

```bash
cat server.json | jq .
```

**Key fields to verify:**
- ✅ `name`: "consulate"
- ✅ `server.endpoints.discovery`: Points to your discovery endpoint
- ✅ `server.endpoints.invoke`: Points to your invoke endpoint
- ✅ `tools`: Lists all 8 tools with descriptions
- ✅ `authentication`: Describes Bearer token auth
- ✅ `documentation`: Links to your docs

---

## Step 4: Test Discovery Endpoint

Ensure your discovery endpoint returns valid MCP JSON:

```bash
curl https://api.x402disputes.com/.well-known/mcp.json | jq .
```

**Expected response:**
- `protocol`: "mcp"
- `server`: Name, version, description
- `tools`: Array of 8 tool definitions
- `authentication`: Auth configuration

---

## Step 5: Publish to MCP Directory

Once authenticated and `server.json` is ready:

```bash
mcp-publisher publish server.json
```

**What happens:**
1. CLI validates `server.json` format
2. Verifies endpoints are accessible
3. Submits to MCP registry
4. Returns a confirmation URL

**Expected output:**
```
✓ Validating server.json...
✓ Checking discovery endpoint...
✓ Checking invoke endpoint...
✓ Publishing to MCP directory...
✓ Published successfully!
  View at: https://modelcontextprotocol.info/directory/consulate
```

---

## Step 6: Verify Publication

After publishing, verify your server appears in the directory:

1. **Visit MCP Directory**: https://modelcontextprotocol.info/directory
2. **Search for "consulate"**
3. **Click on your server** to view details
4. **Verify**:
   - Name and description are correct
   - All 8 tools are listed
   - Authentication info is accurate
   - Documentation links work

---

## Updating Your Published Server

To update your server listing (after code changes):

```bash
# Update server.json if needed (version bump, description changes, etc.)
mcp-publisher publish server.json
```

**Note**: The registry will:
- Keep the same URL/permalinks
- Update metadata from `server.json`
- Verify endpoints still work

---

## Troubleshooting

### Authentication Failed

**Symptom**: `mcp-publisher auth` fails or times out

**Solutions**:
1. Check internet connection
2. Try GitHub OAuth directly: https://modelcontextprotocol.info/auth
3. Check firewall/proxy settings
4. Use API key authentication instead (if available)

### Validation Errors

**Symptom**: `mcp-publisher publish` fails with validation errors

**Common issues**:
- **Invalid JSON**: Run `cat server.json | jq .` to verify JSON syntax
- **Missing required fields**: Check MCP schema documentation
- **Endpoint unreachable**: Verify `curl` works against discovery/invoke endpoints
- **Wrong endpoint format**: Ensure endpoints return valid MCP JSON

**Debug**:
```bash
# Test discovery endpoint
curl -v https://api.x402disputes.com/.well-known/mcp.json

# Test invoke endpoint (will fail auth, but should return 401, not 404)
curl -X POST https://api.x402disputes.com/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool":"test","parameters":{}}'
```

### Server Not Appearing in Directory

**Symptom**: Published successfully but can't find in directory

**Solutions**:
1. Wait 5-10 minutes for indexing
2. Search with exact name: "consulate"
3. Filter by category: "finance" or "legal"
4. Check for approval status (some registries require moderation)

### Endpoint Verification Failed

**Symptom**: CLI says endpoints are unreachable

**Solutions**:
1. Verify endpoints are publicly accessible (not behind VPN/firewall)
2. Check CORS headers (should allow `*` or MCP registry origin)
3. Ensure HTTPS (not HTTP) for production
4. Test with `curl` from different network

---

## Best Practices

### 1. Version Management

- **Bump version** in `server.json` when publishing updates
- **Semantic versioning**: `1.0.0` → `1.0.1` (patch), `1.1.0` (minor), `2.0.0` (major)

### 2. Documentation

- Keep `documentation` links in `server.json` up to date
- Ensure quickstart guide is accessible
- Document authentication clearly

### 3. Endpoint Reliability

- Use production URLs (not staging/dev)
- Ensure 99.9%+ uptime before publishing
- Set up monitoring/alerts for endpoints

### 4. Metadata Quality

- **Description**: Clear, concise, includes key features
- **Keywords**: Relevant for discoverability
- **Categories**: Accurate classification
- **Support**: Valid email/GitHub links

### 5. Testing Before Publishing

```bash
# Test discovery endpoint
curl https://api.x402disputes.com/.well-known/mcp.json | jq '.tools | length'
# Should return: 8

# Test invoke endpoint (will return auth error, but confirms endpoint exists)
curl -X POST https://api.x402disputes.com/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool":"consulate_file_dispute","parameters":{}}'
# Should return: 401 (auth required), not 404 (not found)
```

---

## Post-Publication Checklist

After publishing, verify:

- [ ] Server appears in MCP directory search
- [ ] All 8 tools are listed correctly
- [ ] Documentation links work
- [ ] Authentication instructions are clear
- [ ] Support email is monitored
- [ ] Discovery endpoint returns valid JSON
- [ ] Invoke endpoint accepts requests (with auth)

---

## Integration Testing

After publishing, test integration from a real MCP client:

### Claude Desktop

```json
{
  "mcpServers": {
    "consulate": {
      "url": "https://api.x402disputes.com"
    }
  }
}
```

### Other MCP Clients

Refer to your `server.json` endpoints:
- Discovery: `GET https://api.x402disputes.com/.well-known/mcp.json`
- Invoke: `POST https://api.x402disputes.com/mcp/invoke`

---

## Resources

- **MCP Directory**: https://modelcontextprotocol.info/directory
- **Publishing Guide**: https://modelcontextprotocol.info/tools/registry/publishing
- **MCP Specification**: https://modelcontextprotocol.info/specification
- **Consulate Docs**: https://docs.x402disputes.com/mcp-quickstart
- **GitHub Registry Repo**: https://github.com/modelcontextprotocol/registry

---

## Support

If you encounter issues publishing:

1. **Check MCP Registry Documentation**: https://modelcontextprotocol.info/tools/registry/publishing
2. **GitHub Issues**: https://github.com/modelcontextprotocol/registry/issues
3. **Consulate Support**: support@x402disputes.com

---

**Next Steps:**
1. ✅ Install MCP Publisher CLI
2. ✅ Authenticate with registry
3. ✅ Verify `server.json` is correct
4. ✅ Test discovery/invoke endpoints
5. ✅ Publish to directory
6. ✅ Verify listing appears
7. ✅ Monitor for user feedback

---

**Last Updated**: 2025-10-30  
**Version**: 1.0.0

