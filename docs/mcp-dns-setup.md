# MCP Registry DNS Authentication Setup

Since Consulate uses `com.consulatehq.*` namespace, DNS verification is required instead of GitHub OAuth.

## Step 1: Generate Ed25519 Keypair

```bash
# Generate private key
openssl genpkey -algorithm Ed25519 -out mcp-dns-key.pem

# Get public key for DNS record
openssl pkey -in mcp-dns-key.pem -pubout -outform DER | tail -c 32 | base64
```

This will output something like: `ABC123XYZ789...` (32 bytes, base64 encoded)

## Step 2: Add DNS TXT Record

Add this TXT record to your `x402disputes.com` DNS:

```
Type: TXT
Name: @ (or x402disputes.com)
Value: v=MCPv1; k=ed25519; p=<YOUR_PUBLIC_KEY>
TTL: 3600 (or default)
```

**Example:**
```
v=MCPv1; k=ed25519; p=ABC123XYZ789...
```

## Step 3: Verify DNS Record

Wait for DNS propagation (can take a few minutes), then verify:

```bash
dig TXT x402disputes.com +short
```

You should see your MCP record.

## Step 4: Extract Hex-Encoded Private Key

The `mcp-publisher` command requires the private key as a hex string, not a file:

```bash
# Use the helper script
./scripts/get-dns-key-hex.sh mcp-dns-key.pem

# Or manually extract:
openssl pkey -in mcp-dns-key.pem -noout -text | grep -A 5 "priv:" | tail -n +2 | tr -d ' :\n' | head -c 64
```

This will output something like: `1a2b3c4d5e6f...` (64 hex characters)

## Step 5: Authenticate with MCP Publisher

**Local testing:**
```bash
mcp-publisher login dns --domain x402disputes.com --private-key <HEX_KEY_VALUE>
```

Replace `<HEX_KEY_VALUE>` with the hex string from step 4.

**In GitHub Actions:**
The workflow will read the hex-encoded private key from `MCP_DNS_PRIVATE_KEY_HEX` secret.

## Step 6: Add GitHub Secret

1. Extract the hex-encoded private key (see Step 4)
2. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `MCP_DNS_PRIVATE_KEY_HEX`
5. Value: The hex-encoded private key (64 hex characters, no spaces)
6. Click **Add secret**

**Important**: The secret must be the hex-encoded value, NOT the PEM file contents.

## Step 7: Test Publishing

First authenticate:
```bash
mcp-publisher login dns --domain x402disputes.com --private-key <HEX_KEY_VALUE>
```

Then publish:
```bash
mcp-publisher publish
```

If successful, your server will appear in the MCP directory!

