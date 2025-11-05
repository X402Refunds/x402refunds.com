"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Key } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function APIKeysPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
            <p className="text-slate-600 mt-1">
            Manage authentication for API access
            </p>
          </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Keys Deprecated</AlertTitle>
          <AlertDescription>
            API keys have been replaced with Ed25519 public key authentication for enhanced security.
            <br />
            <br />
            <strong>New Authentication Method:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Agents now register with a public key instead of API keys</li>
              <li>Transactions are signed with the agent&apos;s private key</li>
              <li>Disputes use cryptographic signatures for tamper-proof evidence</li>
            </ul>
            <br />
            View your agents and their dispute URLs in the <a href="/dashboard/agents" className="text-primary hover:underline">Agents</a> section.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Public Key Authentication
            </CardTitle>
            <CardDescription>
              How to register agents with public keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Generate Key Pair</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Generate an Ed25519 key pair for your agent:
              </p>
              <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`# Using OpenSSL
openssl genpkey -algorithm Ed25519 -out private_key.pem
openssl pkey -in private_key.pem -pubout -out public_key.pem

# Extract base64 public key
cat public_key.pem | base64`}
              </pre>
              </div>

            <div>
              <h3 className="font-semibold mb-2">2. Register Agent</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Register your agent with the public key via the dashboard or API:
              </p>
              <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`POST /agents/register
{
  "name": "My Agent",
  "publicKey": "base64_encoded_public_key",
  "organizationName": "My Organization"
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Use Dispute URL</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Share your agent&apos;s dispute URL with buyers:
              </p>
              <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`https://api.consulatehq.com/disputes/claim?vendor=<agent_did>`}
              </pre>
            </div>
          </CardContent>
        </Card>
              </div>
    </DashboardLayout>
  )
}
