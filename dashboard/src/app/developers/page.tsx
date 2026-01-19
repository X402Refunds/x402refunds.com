import { Metadata } from "next"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Section } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CodeBlock } from "@/components/ui/code-block"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExternalLink, FileJson, Terminal, Code, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "API Documentation - X402Refunds Developer Guide",
  description: "Complete API documentation for filing x402 payment refund requests. Includes JSON Schema, code examples, and error handling guide. Supports Base and Solana USDC payments.",
  keywords: [
    "x402 API",
    "x402 refund API",
    "payment refund API",
    "USDC refund API",
    "x402 developer documentation",
    "refund request schema",
    "x402 payment refunds",
    "Base USDC refund",
    "Solana USDC refund"
  ],
  openGraph: {
    title: "X402Refunds API Documentation",
    description: "File x402 payment refund requests programmatically. Full API reference with examples.",
    url: "https://x402refunds.com/developers",
    type: "website",
  },
  alternates: {
    canonical: "https://x402refunds.com/developers",
  }
}

const baseExample = `curl -X POST https://api.x402refunds.com/v1/refunds \\
  -H "Content-Type: application/json" \\
  -d '{
    "blockchain": "base",
    "transactionHash": "0x9d54ee080b6676ea73127422fdd948a71a4c981c9ebcca9fd5cc2b48e7e5cfd6",
    "sellerEndpointUrl": "https://api.example.com/paid-service",
    "description": "API returned 500 error after payment was confirmed"
  }'`

const solanaExample = `curl -X POST https://api.x402refunds.com/v1/refunds \\
  -H "Content-Type: application/json" \\
  -d '{
    "blockchain": "solana",
    "transactionHash": "5wHu1qwD7q4E3gLBkBxCPJpBJT9wP4MqTJJJHqYvJSYX...",
    "sellerEndpointUrl": "https://api.example.com/paid-service",
    "description": "Service timed out after 30 seconds"
  }'`

const successResponse = `{
  "ok": true,
  "caseId": "jh77n4k2x8m9...",
  "blockchain": "base",
  "transactionHash": "0x9d54ee...",
  "merchant": "eip155:8453:0x..."
}`

const errorResponse = `{
  "ok": false,
  "code": "INVALID_REQUEST",
  "field": "blockchain",
  "message": "blockchain must be \\"base\\" or \\"solana\\"",
  "expected": ["base", "solana"],
  "schemaUrl": "https://api.x402refunds.com/v1/refunds/schema",
  "schema": { ... },
  "recovery": {
    "retryable": true,
    "fixes": [
      {"op": "rename", "from": "network", "to": "blockchain"}
    ],
    "suggestedBody": {
      "blockchain": "base",
      "transactionHash": "0x...",
      "sellerEndpointUrl": "https://...",
      "description": "..."
    }
  }
}`

const jsExample = `const response = await fetch('https://api.x402refunds.com/v1/refunds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blockchain: 'base',
    transactionHash: '0x9d54ee080b6676ea73127422fdd948a71a4c981c9ebcca9fd5cc2b48e7e5cfd6',
    sellerEndpointUrl: 'https://api.example.com/paid-service',
    description: 'API returned error after payment'
  })
});

const result = await response.json();
if (result.ok) {
  console.log('Refund filed:', result.caseId);
} else {
  // Use recovery hints to retry
  console.log('Error:', result.message);
  if (result.recovery?.suggestedBody) {
    // Retry with corrected body
    console.log('Suggested fix:', result.recovery.suggestedBody);
  }
}`

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <Section
        spacing="none"
        className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200"
        containerClassName="max-w-5xl pt-8 pb-10"
      >
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            Developer Documentation
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            X402Refunds API
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            File and manage x402 payment refund requests programmatically. 
            Full REST API with JSON Schema and self-healing error responses.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a
            href="https://api.x402refunds.com/v1/refunds/schema"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileJson className="h-4 w-4" />
            View JSON Schema
            <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Process Guide
          </Link>
        </div>
      </Section>

      {/* Quick Start */}
      <Section spacing="tight" containerClassName="max-w-5xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Start</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-600" />
                Base URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                https://api.x402refunds.com
              </code>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-slate-600">
                None required (permissionless)
              </span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-600" />
                Content-Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                application/json
              </code>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Endpoints */}
      <Section spacing="tight" containerClassName="max-w-5xl" className="bg-slate-50 border-y border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Endpoints</h2>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="default" className="bg-green-600">POST</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">/v1/refunds</TableCell>
                <TableCell>File a new refund request</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">GET</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">/v1/refunds/schema</TableCell>
                <TableCell>Get JSON Schema for request body</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">GET</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">/v1/refund?id=&#123;caseId&#125;</TableCell>
                <TableCell>Check refund request status</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">GET</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">/v1/refunds?merchant=&#123;caip10&#125;</TableCell>
                <TableCell>List refunds by merchant wallet</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* Request Schema */}
      <Section spacing="tight" containerClassName="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Request Schema</h2>
          <a
            href="https://api.x402refunds.com/v1/refunds/schema"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View live schema <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Required Fields</h3>
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">blockchain</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">&quot;base&quot; | &quot;solana&quot;</code></TableCell>
                <TableCell>Network where the USDC payment occurred</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">transactionHash</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">string</code></TableCell>
                <TableCell>
                  USDC payment tx hash. Base: <code className="text-xs">0x</code> + 64 hex chars. Solana: base58 signature.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">sellerEndpointUrl</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">string</code></TableCell>
                <TableCell>
                  The exact <code className="text-xs">https://</code> URL of the paid API endpoint (must include path)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">description</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">string</code></TableCell>
                <TableCell>What went wrong after payment (e.g., timeout, 500 error, wrong output)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Optional Fields</h3>
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">evidenceUrls</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">string[]</code></TableCell>
                <TableCell>Array of URLs pointing to evidence (logs, screenshots)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">sourceTransferLogIndex</TableCell>
                <TableCell><code className="text-xs bg-slate-100 px-1 rounded">number</code></TableCell>
                <TableCell>For transactions with multiple USDC transfers, specify which one</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> Do not send <code className="bg-amber-100 px-1 rounded">amount</code>, <code className="bg-amber-100 px-1 rounded">payer</code>, or <code className="bg-amber-100 px-1 rounded">merchant</code> fields. 
                These are automatically derived from the on-chain USDC transfer.
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Examples */}
      <Section spacing="tight" containerClassName="max-w-5xl" className="bg-slate-50 border-y border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Examples</h2>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Base Network (curl)</h3>
        <CodeBlock code={baseExample} language="bash" showCopy />

        <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-8">Solana Network (curl)</h3>
        <CodeBlock code={solanaExample} language="bash" showCopy />

        <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-8">JavaScript / TypeScript</h3>
        <CodeBlock code={jsExample} language="javascript" showCopy />
      </Section>

      {/* Responses */}
      <Section spacing="tight" containerClassName="max-w-5xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Responses</h2>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Success Response (200)</h3>
        <CodeBlock code={successResponse} language="json" showCopy />

        <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-8">Error Response (400)</h3>
        <CodeBlock code={errorResponse} language="json" showCopy />
      </Section>

      {/* Error Recovery */}
      <Section spacing="tight" containerClassName="max-w-5xl" className="bg-slate-50 border-y border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Error Recovery</h2>
        
        <p className="text-slate-600 mb-6">
          When a request fails validation, the 400 response includes helpful recovery information 
          to enable automatic retries without guessing:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">schema</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              The full JSON Schema inline — no need to fetch it separately.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">recovery.fixes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Array of corrections to apply (e.g., rename <code className="bg-slate-100 px-1 rounded">network</code> → <code className="bg-slate-100 px-1 rounded">blockchain</code>)
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">recovery.suggestedBody</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              A corrected request body you can retry immediately.
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">recovery.missingRequired</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              List of required fields that are missing from the request.
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3 mt-8">Common Field Aliases</h3>
        <p className="text-sm text-slate-600 mb-4">
          These field names are often guessed incorrectly and will be automatically mapped in the recovery hints:
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incorrect</TableHead>
                <TableHead>→</TableHead>
                <TableHead>Correct</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-sm">network, chain</TableCell>
                <TableCell>→</TableCell>
                <TableCell className="font-mono text-sm">blockchain</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">transaction, txHash, hash, signature</TableCell>
                <TableCell>→</TableCell>
                <TableCell className="font-mono text-sm">transactionHash</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">endpoint, url, serviceUrl</TableCell>
                <TableCell>→</TableCell>
                <TableCell className="font-mono text-sm">sellerEndpointUrl</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-sm">reason, error, message</TableCell>
                <TableCell>→</TableCell>
                <TableCell className="font-mono text-sm">description</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* Supported Blockchains */}
      <Section spacing="tight" containerClassName="max-w-5xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Supported Blockchains</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Base (Ethereum L2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Chain ID:</strong> 8453</div>
              <div><strong>USDC Contract:</strong> <code className="text-xs bg-slate-100 px-1 rounded">0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code></div>
              <div><strong>Tx Hash Format:</strong> <code className="text-xs bg-slate-100 px-1 rounded">0x</code> + 64 hex characters</div>
              <div><strong>CAIP-10:</strong> <code className="text-xs bg-slate-100 px-1 rounded">eip155:8453:0x...</code></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                Solana (Mainnet)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>USDC Mint:</strong> <code className="text-xs bg-slate-100 px-1 rounded">EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</code></div>
              <div><strong>Tx Hash Format:</strong> base58 signature (32-128 chars)</div>
              <div><strong>CAIP-10:</strong> <code className="text-xs bg-slate-100 px-1 rounded">solana:5eykt4...:...</code></div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Resources */}
      <Section spacing="tight" containerClassName="max-w-5xl" className="bg-slate-50 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Resources</h2>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <a
            href="https://api.x402refunds.com/v1/refunds/schema"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <FileJson className="h-6 w-6 text-blue-600 mb-2" />
            <div className="font-medium text-slate-900 group-hover:text-blue-600">JSON Schema</div>
            <div className="text-sm text-slate-500">Machine-readable API contract</div>
          </a>
          
          <Link
            href="/docs"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <Terminal className="h-6 w-6 text-green-600 mb-2" />
            <div className="font-medium text-slate-900 group-hover:text-blue-600">Process Guide</div>
            <div className="text-sm text-slate-500">Full refund documentation</div>
          </Link>
          
          <Link
            href="/request-refund"
            className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <Code className="h-6 w-6 text-purple-600 mb-2" />
            <div className="font-medium text-slate-900 group-hover:text-blue-600">Web Form</div>
            <div className="text-sm text-slate-500">File a refund via UI</div>
          </Link>
        </div>
      </Section>

      <Footer />
    </div>
  )
}
