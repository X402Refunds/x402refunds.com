#!/bin/bash

# Helper script to extract hex-encoded private key for MCP DNS authentication

KEY_FILE="${1:-mcp-dns-key.pem}"

if [ ! -f "$KEY_FILE" ]; then
    echo "Error: Key file not found: $KEY_FILE"
    echo ""
    echo "Usage: $0 [path-to-key.pem]"
    echo ""
    echo "To generate a new key:"
    echo "  openssl genpkey -algorithm Ed25519 -out mcp-dns-key.pem"
    exit 1
fi

echo "Extracting hex-encoded private key from $KEY_FILE..."
echo ""

# Extract the private key hex value
HEX_KEY=$(openssl pkey -in "$KEY_FILE" -noout -text 2>/dev/null | grep -A 5 "priv:" | tail -n +2 | tr -d ' :\n' | head -c 64)

if [ -z "$HEX_KEY" ]; then
    echo "Error: Could not extract private key. Is this an Ed25519 key?"
    exit 1
fi

echo "Private key (hex):"
echo "$HEX_KEY"
echo ""
echo "Copy this value for use with:"
echo "  mcp-publisher login dns --domain x402refunds.com --private-key $HEX_KEY"
echo ""
echo "Or save as GitHub secret MCP_DNS_PRIVATE_KEY_HEX"

