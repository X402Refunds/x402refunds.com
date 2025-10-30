#!/bin/bash

# Check if Consulate MCP server is published in the registry

SERVER_NAME="com.consulatehq/consulate"

echo "🔍 Checking MCP Registry for: $SERVER_NAME"
echo ""

# Search for the server
RESPONSE=$(curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=consulate")

# Check if server is found
if echo "$RESPONSE" | jq -e ".servers[]?.server.name == \"$SERVER_NAME\"" > /dev/null 2>&1; then
    echo "✅ Server is published!"
    echo ""
    echo "Server details:"
    echo "$RESPONSE" | jq ".servers[] | select(.server.name == \"$SERVER_NAME\")"
    echo ""
    echo "🌐 View in registry: https://registry.modelcontextprotocol.io/v0/servers?search=consulate"
else
    echo "❌ Server not found in registry yet"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.'
    echo ""
    echo "💡 If you just published, wait a few minutes for indexing"
fi

echo ""
echo "📊 Full search results:"
echo "$RESPONSE" | jq '.'

