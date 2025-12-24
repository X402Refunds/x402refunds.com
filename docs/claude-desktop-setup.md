# Claude Desktop Setup Guide

Complete guide to integrating Consulate's MCP server with Claude Desktop on macOS.

**Last Updated**: 2025-10-27

---

## Overview

This guide shows you how to add Consulate's dispute resolution tools directly to Claude Desktop. Once configured, you'll be able to:

- Register agents with Consulate
- File disputes for SLA breaches
- Submit evidence to cases
- Check case status
- Monitor SLA compliance
- Look up agent DIDs

All without leaving Claude Desktop.

---

## Prerequisites

### 1. Claude Desktop App

Download and install Claude Desktop from: [https://claude.ai/download](https://claude.ai/download)

### 2. Node.js

Claude Desktop requires Node.js to run the MCP proxy script.

**Check if you have Node.js:**
```bash
node --version
```

**Install Node.js (if needed):**
- Download from: [https://nodejs.org/](https://nodejs.org/)
- Or with Homebrew: `brew install node`

### 3. Consulate API Key (Optional)

**Note**: API keys are **optional** for MCP access. The MCP endpoints are publicly accessible. Authentication happens via Ed25519 signatures at the evidence/dispute level, not API keys.

If you want to use an API key (for organization-scoped features):
1. Sign in to [Consulate Dashboard](https://x402disputes.com)
2. Navigate to **Settings → API Keys**
3. Click **Generate New API Key**
4. Copy the key (starts with `csk_live_` for production)

**IMPORTANT**: Save this key securely. It's only shown once!

---

## Quick Setup (Recommended)

### One-Command Installation

```bash
cd /path/to/consulate
./scripts/install-mcp-server.sh
```

**Or with an API key** (optional):
```bash
./scripts/install-mcp-server.sh csk_live_YOUR_KEY_HERE
```

**What this does:**
1. Validates your API key format (if provided)
2. Finds your Claude Desktop config location
3. Backs up existing config (if any)
4. Adds Consulate MCP server to config
5. Tests the proxy script
6. Shows you next steps

**Note**: You can skip the API key - the script will work without it. MCP endpoints are publicly accessible.

**After installation:**
1. Restart Claude Desktop app
2. Open a new conversation
3. Consulate tools are automatically available

---

## Manual Setup (Advanced)

If you prefer manual configuration or the install script doesn't work:

### 1. Locate Your Claude Desktop Config

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Create this file if it doesn't exist:
```bash
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 2. Edit the Config File

Open the config file in your editor:
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add the Consulate MCP server (or merge with existing config):

```json
{
  "mcpServers": {
    "x402Disputes": {
      "command": "node",
      "args": ["/absolute/path/to/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {}
    }
  }
}
```

**Optional API Key**: If you want to use organization-scoped features, add `"CONSULATE_API_KEY": "csk_live_YOUR_KEY_HERE"` to the `env` section. It's not required - MCP endpoints are publicly accessible.

**Note**: You can use either `"consulate"` or `"x402Disputes"` as the server name - both work. The name is just an identifier in Claude Desktop.

**IMPORTANT**: Replace `/absolute/path/to/consulate` with your actual Consulate directory path.

### 3. Make Proxy Script Executable

```bash
chmod +x /path/to/consulate/scripts/claude-desktop-mcp-proxy.js
```

### 4. Test the Proxy

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0"}}}' | \
  CONSULATE_API_KEY=csk_live_YOUR_KEY_HERE \
  node /path/to/consulate/scripts/claude-desktop-mcp-proxy.js
```

You should see a JSON response with protocol version information.

### 5. Restart Claude Desktop

Quit Claude Desktop completely (Cmd+Q), then relaunch it.

---

## Available Tools

Once configured, Claude Desktop will have access to these Consulate tools:

### 1. **consulate_register_agent**
Register your agent with Consulate to participate in dispute resolution.

**Example usage in Claude:**
> "Register my agent 'acme-api-monitor' as an ai_provider with Consulate"

### 2. **consulate_file_dispute**
File a dispute for SLA breaches, contract violations, or service quality issues.

**Example usage in Claude:**
> "File a dispute against OpenAI for API downtime exceeding our 99.9% SLA"

### 3. **consulate_submit_evidence**
Submit cryptographic evidence to support a case.

**Example usage in Claude:**
> "Submit API logs from https://logs.acme.com/downtime.json to case k12345..."

### 4. **x402_check_case_status**
Check the current status of a dispute case.

**Example usage in Claude:**
> "What's the status of case k12345...?"

### 5. **x402_list_my_cases**
List all X-402 payment dispute cases where you're a party (plaintiff or defendant). Uses your Ethereum wallet address (ERC-8004) as identity.

**Example usage in Claude:**
> "Show me all my active disputes for wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"

### 6. **consulate_get_sla_status**
Check your SLA compliance status and any active violations.

**Example usage in Claude:**
> "Check my SLA status for agent did:agent:acme-prod-1234"

### 7. **consulate_lookup_agent**
Find an agent's DID by organization name, domain, or service name.

**Example usage in Claude:**
> "Look up OpenAI's agent DID"

### 8. **consulate_request_vendor_registration**
Request that Consulate register a vendor that isn't in the system yet.

**Example usage in Claude:**
> "Request that Consulate register NewAI as a vendor"

---

## Troubleshooting

### Tools Not Appearing

**Symptom**: Claude Desktop doesn't show Consulate tools

**Solutions**:
1. Check that you completely quit (Cmd+Q) and relaunched Claude Desktop
2. Verify config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Check config file JSON syntax (use [jsonlint.com](https://jsonlint.com))
4. View Claude Desktop logs: **Settings → Developer → View Logs**

### Authentication Errors

**Symptom**: "Invalid or expired API key" errors

**Solutions**:
1. Verify API key starts with `csk_live_` or `csk_test_`
2. Check API key is active in Consulate dashboard (Settings → API Keys)
3. Ensure no extra spaces or quotes around key in config
4. Regenerate key if needed (old key will be revoked)

### Proxy Script Not Found

**Symptom**: "command not found" or "no such file" errors

**Solutions**:
1. Use absolute path to proxy script (not relative like `./scripts/...`)
2. Find absolute path: `cd /path/to/consulate && pwd`
3. Verify file exists: `ls -la /path/to/consulate/scripts/claude-desktop-mcp-proxy.js`
4. Check file is executable: `chmod +x /path/to/consulate/scripts/claude-desktop-mcp-proxy.js`

### Debug Mode

Enable detailed logging to diagnose issues:

1. Edit your config file
2. Add `"CONSULATE_DEBUG": "true"` to the `env` section:

```json
{
  "mcpServers": {
    "consulate": {
      "command": "node",
      "args": ["/path/to/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {
        "CONSULATE_API_KEY": "csk_live_...",
        "CONSULATE_DEBUG": "true"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. Check logs: **Settings → Developer → View Logs**

### Testing the Proxy Manually

Test the proxy script outside of Claude Desktop:

```bash
# Set your API key
export CONSULATE_API_KEY=csk_live_YOUR_KEY_HERE

# Run the proxy with debug mode
CONSULATE_DEBUG=true node /path/to/consulate/scripts/claude-desktop-mcp-proxy.js
```

Then type (or paste) an MCP request:
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

Press Enter. You should see a list of available tools.

Press Ctrl+D to exit.

---

## Using Different Environments

### Production vs Testing

**Production (default)**:
```json
{
  "env": {
    "CONSULATE_API_KEY": "csk_live_..."
  }
}
```

**Testing/Preview**:
```json
{
  "env": {
    "CONSULATE_API_KEY": "csk_test_...",
    "CONSULATE_API_URL": "https://youthful-orca-358.convex.site"
  }
}
```

### Multiple Environments

You can configure multiple Consulate servers:

```json
{
  "mcpServers": {
    "consulate-prod": {
      "command": "node",
      "args": ["/path/to/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {
        "CONSULATE_API_KEY": "csk_live_..."
      }
    },
    "consulate-test": {
      "command": "node",
      "args": ["/path/to/consulate/scripts/claude-desktop-mcp-proxy.js"],
      "env": {
        "CONSULATE_API_KEY": "csk_test_...",
        "CONSULATE_API_URL": "https://youthful-orca-358.convex.site"
      }
    }
  }
}
```

---

## Security Best Practices

### 1. API Key Management

- **Never commit** API keys to git
- **Never share** API keys in public channels
- **Rotate keys** periodically (generate new, revoke old)
- **Use test keys** for development/testing
- **Use production keys** only in production

### 2. Key Permissions

Each API key is scoped to your organization:
- Can only register agents for your org
- Can only file disputes on behalf of your org
- Cannot access other organizations' data

### 3. Revoking Keys

If a key is compromised:
1. Go to Consulate dashboard → Settings → API Keys
2. Click "Revoke" on the compromised key
3. Generate a new key
4. Update your Claude Desktop config with new key
5. Restart Claude Desktop

---

## Uninstalling

To remove Consulate from Claude Desktop:

### 1. Edit Config

Open: `~/Library/Application Support/Claude/claude_desktop_config.json`

Remove the `"consulate"` entry from `mcpServers`:

```json
{
  "mcpServers": {
    // Remove this entire section:
    // "consulate": { ... }
  }
}
```

### 2. Restart Claude Desktop

Quit (Cmd+Q) and relaunch.

### 3. Optional: Remove Proxy Script

If you want to completely remove Consulate:

```bash
cd /path/to/consulate
rm scripts/claude-desktop-mcp-proxy.js
rm scripts/install-mcp-server.sh
```

---

## Example Workflows

### Workflow 1: Register Agent & File Dispute

```
User: Register my agent "acme-api-monitor" as an ai_consumer with Consulate

Claude: [Calls consulate_register_agent]
        ✓ Agent registered successfully
        DID: did:agent:acme-api-monitor-1730000000

User: File a dispute against OpenAI for 45 minutes of API downtime
      exceeding our 99.9% SLA

Claude: [Calls consulate_lookup_agent to find OpenAI's DID]
        [Calls consulate_file_dispute]
        ✓ Dispute filed successfully
        Case ID: k12345...
        Estimated resolution: 72 hours

User: Submit evidence from https://logs.acme.com/downtime.json

Claude: [Calls consulate_submit_evidence]
        ✓ Evidence submitted successfully
        Status: pending_verification
```

### Workflow 2: Monitor SLA Compliance

```
User: Check my SLA status

Claude: [Calls consulate_get_sla_status]

        SLA Status Report:
        • Current Standing: GOOD
        • Total Disputes: 3
        • Active Disputes: 1
        • Resolved Disputes: 2
        • Win Rate: 66.7%
        • Risk Level: LOW
```

### Workflow 3: Check Case Progress

```
User: What's the status of case k12345...?

Claude: [Calls consulate_check_case_status]

        Case Status:
        • Status: IN_DELIBERATION
        • Filed: 2024-10-25
        • Plaintiff: did:agent:acme-api-monitor-1730000000
        • Defendant: did:agent:openai-api-1234
        • Claim Amount: $5,000
        • Evidence Submitted: 3 pieces
        • Next Update: Within 24 hours
```

---

## Advanced Configuration

### Custom API Endpoint

For self-hosted or enterprise deployments:

```json
{
  "env": {
    "CONSULATE_API_KEY": "csk_live_...",
    "CONSULATE_API_URL": "https://consulate.yourcompany.com"
  }
}
```

### Proxy Script Options

The proxy script supports these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CONSULATE_API_KEY` | Your API key (required) | - |
| `CONSULATE_API_URL` | API endpoint | `https://api.x402disputes.com` |
| `CONSULATE_DEBUG` | Enable debug logging | `false` |

---

## FAQ

### Q: Do I need to restart Claude Desktop after config changes?

**A**: Yes, always completely quit (Cmd+Q) and relaunch Claude Desktop for config changes to take effect.

### Q: Can I use the same API key on multiple machines?

**A**: Yes, API keys work across multiple machines. However, for security, consider using different keys per machine so you can revoke individual keys if one is compromised.

### Q: How do I know if it's working?

**A**: In a Claude conversation, say "Show me available tools" or "Register an agent with Consulate". Claude should show it can access the Consulate tools.

### Q: Does this send my conversations to Consulate?

**A**: No. Only when you explicitly use a Consulate tool (like "file a dispute") does data go to Consulate's API. Your conversations remain private to Claude.

### Q: What's the difference between csk_live_ and csk_test_ keys?

**A**:
- `csk_live_` → Production environment (real disputes, real data)
- `csk_test_` → Testing environment (test data, won't affect production)

Use test keys for development and learning. Use production keys only for real disputes.

### Q: Can I use this with Claude on the web?

**A**: No, this integration is specific to Claude Desktop. The web version doesn't support MCP servers. However, you can use Consulate's HTTP API directly from any environment.

---

## Support

### Documentation
- Docs: [https://www.x402disputes.com/docs](https://www.x402disputes.com/docs)
- Agentic Dispute Protocol: [https://github.com/consulatehq/agentic-dispute-protocol](https://github.com/consulatehq/agentic-dispute-protocol)

### Help & Support
- Email: support@x402disputes.com
- GitHub Issues: [https://github.com/consulatehq/consulate/issues](https://github.com/consulatehq/consulate/issues)
- Community Discord: [https://discord.gg/consulate](https://discord.gg/consulate)

### Emergency Support
For urgent issues (active disputes, SLA breaches):
- Email: urgent@x402disputes.com (monitored 24/7)
- Include: Case ID, agent DID, and issue description

---

## Next Steps

1. ✅ **Complete setup** following this guide
2. 📖 **Read the MCP Quickstart** to understand available tools
3. 🧪 **Test with test key** before using production
4. 🚀 **File your first dispute** when needed
5. 📊 **Monitor SLA status** regularly

---

**Last Updated**: 2025-10-27
**Version**: 1.0.0
**Feedback**: docs@x402disputes.com
