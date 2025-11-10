#!/bin/bash

#
# Consulate Claude Desktop MCP Server Installation Script
#
# This script automates the setup of Consulate's MCP server for Claude Desktop on macOS.
# It updates your Claude Desktop config to include the Consulate MCP proxy.
#
# Usage:
#   ./install-mcp-server.sh <your-api-key>
#   ./install-mcp-server.sh csk_live_abc123...
#
# Requirements:
#   - macOS
#   - Claude Desktop app installed
#   - Node.js installed (for running the proxy script)
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging helpers
log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

# Header
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Consulate MCP Server Installer for Claude Desktop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if API key was provided
if [ -z "$1" ]; then
    log_error "API key is required"
    echo ""
    echo "Usage:"
    echo "  ./install-mcp-server.sh <your-api-key>"
    echo ""
    echo "Example:"
    echo "  ./install-mcp-server.sh csk_live_abc123..."
    echo ""
    echo "Get your API key from:"
    echo "  https://x402disputes.com/settings/api-keys"
    echo ""
    exit 1
fi

API_KEY="$1"

# Validate API key format
if [[ ! "$API_KEY" =~ ^csk_(live|test)_ ]]; then
    log_error "Invalid API key format"
    echo ""
    echo "API keys must start with:"
    echo "  - csk_live_... (production)"
    echo "  - csk_test_... (testing)"
    echo ""
    echo "Get your API key from:"
    echo "  https://x402disputes.com/settings/api-keys"
    echo ""
    exit 1
fi

# Detect API key environment
if [[ "$API_KEY" =~ ^csk_live_ ]]; then
    API_ENV="production"
else
    API_ENV="testing"
fi

log_info "API Key: ${API_KEY:0:15}... (${API_ENV})"

# Check for macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    log_error "This script is designed for macOS only"
    echo ""
    echo "For other platforms, manually add to your MCP config:"
    echo ""
    echo '{
  "mcpServers": {
    "consulate": {
      "command": "node",
      "args": ["'$(pwd)/claude-desktop-mcp-proxy.js'"],
      "env": {
        "CONSULATE_API_KEY": "'$API_KEY'"
      }
    }
  }
}'
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    echo ""
    echo "Install Node.js from:"
    echo "  https://nodejs.org/"
    echo ""
    echo "Or with Homebrew:"
    echo "  brew install node"
    echo ""
    exit 1
fi

log_success "Node.js found: $(node --version)"

# Determine Claude Desktop config path
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

log_info "Claude Desktop config: $CLAUDE_CONFIG_FILE"

# Create config directory if it doesn't exist
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    log_warning "Claude Desktop config directory not found, creating..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
    log_success "Created: $CLAUDE_CONFIG_DIR"
fi

# Get absolute path to proxy script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_SCRIPT="$SCRIPT_DIR/claude-desktop-mcp-proxy.js"

if [ ! -f "$PROXY_SCRIPT" ]; then
    log_error "Proxy script not found: $PROXY_SCRIPT"
    echo ""
    echo "Make sure you're running this script from the Consulate project directory:"
    echo "  cd /path/to/consulate"
    echo "  ./scripts/install-mcp-server.sh $API_KEY"
    echo ""
    exit 1
fi

log_success "Proxy script found: $PROXY_SCRIPT"

# Make proxy script executable
chmod +x "$PROXY_SCRIPT"
log_success "Proxy script is executable"

# Backup existing config if it exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    BACKUP_FILE="$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Backing up existing config to: $BACKUP_FILE"
    cp "$CLAUDE_CONFIG_FILE" "$BACKUP_FILE"
    log_success "Backup created"
fi

# Read existing config or create new one
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    log_info "Updating existing Claude Desktop config..."
    EXISTING_CONFIG=$(cat "$CLAUDE_CONFIG_FILE")
else
    log_info "Creating new Claude Desktop config..."
    EXISTING_CONFIG='{}'
fi

# Use Node.js to merge configs (safer than jq for complex JSON)
node -e "
const fs = require('fs');
const path = require('path');

const configPath = '$CLAUDE_CONFIG_FILE';
const proxyScript = '$PROXY_SCRIPT';
const apiKey = '$API_KEY';

// Read existing config or start with empty object
let config = {};
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error('⚠  Warning: Could not parse existing config, creating new one');
        config = {};
    }
}

// Ensure mcpServers object exists
if (!config.mcpServers) {
    config.mcpServers = {};
}

// Add/update Consulate server
config.mcpServers.consulate = {
    command: 'node',
    args: [proxyScript],
    env: {
        CONSULATE_API_KEY: apiKey
    }
};

// Write updated config
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('✅ Config updated successfully');
"

if [ $? -eq 0 ]; then
    log_success "Claude Desktop config updated"
else
    log_error "Failed to update config"
    exit 1
fi

# Test the proxy script
log_info "Testing MCP proxy..."
echo ""

# Run a quick test (send initialize request)
TEST_RESULT=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0"}}}' | CONSULATE_API_KEY="$API_KEY" node "$PROXY_SCRIPT" 2>&1 | head -n 1)

if [[ "$TEST_RESULT" == *"jsonrpc"* ]]; then
    log_success "MCP proxy test passed"
else
    log_warning "MCP proxy test did not return expected response"
    echo "Response: $TEST_RESULT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_success "Installation complete!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Restart Claude Desktop app"
echo "  2. Open a new conversation"
echo "  3. Consulate tools will be automatically available"
echo ""
echo "Available tools:"
echo "  • consulate_register_agent - Register your agent with Consulate"
echo "  • consulate_file_dispute - File a dispute for SLA breaches"
echo "  • consulate_submit_evidence - Submit evidence to a case"
echo "  • consulate_check_case_status - Check case status"
echo "  • consulate_list_my_cases - List all your cases"
echo "  • consulate_get_sla_status - Check SLA compliance"
echo "  • consulate_lookup_agent - Find agent DIDs"
echo "  • consulate_request_vendor_registration - Request vendor onboarding"
echo ""
echo "Troubleshooting:"
echo ""
echo "  • Enable debug mode:"
echo "    Edit $CLAUDE_CONFIG_FILE"
echo "    Add \"CONSULATE_DEBUG\": \"true\" to env section"
echo ""
echo "  • View logs:"
echo "    Claude Desktop → Settings → Developer → View Logs"
echo ""
echo "  • Test manually:"
echo "    CONSULATE_API_KEY=$API_KEY node $PROXY_SCRIPT"
echo ""
echo "Documentation:"
echo "  https://docs.x402disputes.com/mcp-quickstart"
echo ""
echo "Support:"
echo "  support@x402disputes.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
