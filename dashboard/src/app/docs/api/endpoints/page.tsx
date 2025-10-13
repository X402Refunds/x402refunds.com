import Link from 'next/link';
import { ChevronRight, Code, Key, Users, FileText, Shield } from 'lucide-react';

export const metadata = {
  title: 'API Reference - Consulate Docs',
  description: 'Complete HTTP API documentation with examples and authentication',
};

export default function APIReferencePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
        <Link href="/docs" className="hover:text-blue-600">
          Docs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">API Reference</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          API Reference
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-4xl">
          Complete API reference for integrating with the Consulate Agentic Dispute Arbitration Platform. This documentation covers all HTTP endpoints, authentication methods, request/response formats, and code examples.
        </p>
      </div>

      {/* Base URL */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Base URL</h2>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-lg">
          https://api.consulatehq.com
        </div>
        <p className="mt-4 text-blue-100">
          All API endpoints should be prefixed with this base URL. For example: <code className="bg-blue-800 px-2 py-1 rounded">https://api.consulatehq.com/health</code>
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Navigation</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="#aap" className="group bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-purple-600">AAP Protocol</h3>
            <p className="text-sm text-slate-600">Service discovery & arbitrator info</p>
          </a>
          <a href="#authentication" className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <Key className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600">Authentication</h3>
            <p className="text-sm text-slate-600">API keys & agent DIDs</p>
          </a>
          <a href="#agents" className="group bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-green-600">Agent Management</h3>
            <p className="text-sm text-slate-600">Register & discover agents</p>
          </a>
          <a href="#disputes" className="group bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <FileText className="h-8 w-8 text-amber-600 mb-2" />
            <h3 className="font-bold text-slate-900 mb-1 group-hover:text-amber-600">Disputes</h3>
            <p className="text-sm text-slate-600">File & manage disputes</p>
          </a>
        </div>
      </div>

      {/* AAP Section */}
      <div id="aap" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Agentic Arbitration Protocol (AAP)
        </h2>
        <p className="text-slate-700 mb-8">
          Consulate implements the <a href="https://github.com/consulatehq/agentic-arbitration-protocol" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Agentic Arbitration Protocol</a> for standardized dispute resolution.
        </p>

        {/* Service Discovery */}
        <div className="mb-8 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90">Service Discovery</div>
                <h3 className="text-2xl font-bold">/.well-known/aap</h3>
              </div>
              <span className="px-4 py-2 bg-blue-500 rounded-full text-sm font-bold">GET</span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Returns AAP service manifest for protocol discovery.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Example Request</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
              <span className="text-green-400">curl</span> https://api.consulatehq.com/.well-known/aap
            </div>

            <h4 className="font-bold text-slate-900 mb-2">Response</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "arbitrationService": "https://api.consulatehq.com/aap/v1",
  "protocolVersion": "1.0",
  "supportedRules": ["Consulate-v1.0", "UNCITRAL-2021"],
  "supportedEvidenceTypes": ["SYSTEM_LOGS", "CONTRACTS", "COMMUNICATIONS"],
  "features": {
    "chainOfCustody": true,
    "dualFormatAwards": true,
    "arbitratorDiscovery": true
  },
  "endpoints": {
    "disputes": "/disputes",
    "evidence": "/evidence",
    "custody": "/api/custody/{caseId}",
    "arbitrators": "/.well-known/aap/arbitrators"
  }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Arbitrator Discovery */}
        <div className="mb-8 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90">Arbitrator Discovery</div>
                <h3 className="text-2xl font-bold">/.well-known/aap/arbitrators</h3>
              </div>
              <span className="px-4 py-2 bg-blue-500 rounded-full text-sm font-bold">GET</span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">List available arbitrators and their qualifications.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Response</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`{
  "arbitrators": [
    {
      "id": "judge-panel-ai-001",
      "name": "Consulate AI Judge Panel",
      "type": "ai",
      "specialization": ["SLA_BREACH", "CONTRACT_DISPUTE"],
      "availability": "24/7",
      "biasAudit": {
        "lastAudit": "2025-01-15",
        "score": 98.5
      }
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div id="authentication" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Authentication
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Agent DID Auth */}
          <div className="border-2 border-blue-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-bold text-slate-900">Agent DID</h3>
            </div>
            <p className="text-slate-700 mb-4 text-sm">Most endpoints accept agent DIDs for identification:</p>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-3 font-mono text-xs">
              X-Agent-DID: did:agent:your-agent-id
            </div>
          </div>

          {/* API Key Auth */}
          <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-8 w-8 text-green-600" />
              <h3 className="text-xl font-bold text-slate-900">API Key</h3>
            </div>
            <p className="text-slate-700 mb-4 text-sm">For API key authentication:</p>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-3 font-mono text-xs">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </div>
        </div>
      </div>

      {/* Core System Endpoints */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Core System
        </h2>

        {/* Health Check */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Health Check</span>
              <h4 className="text-lg font-bold">/health</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Check platform status and availability.</p>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-green-400">curl</span> https://api.consulatehq.com/health
            </div>
          </div>
        </div>

        {/* Platform Information */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Platform Information</span>
              <h4 className="text-lg font-bold">/</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Get platform information and available endpoints.</p>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-green-400">curl</span> https://api.consulatehq.com/
            </div>
          </div>
        </div>
      </div>

      {/* Agent Management */}
      <div id="agents" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Agent Management
        </h2>

        {/* Register Agent */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Register Agent</span>
              <h4 className="text-lg font-bold">/agents/register</h4>
            </div>
            <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">POST</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Register a new AI agent on the platform.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Example Request</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <pre>{`curl -X POST https://api.consulatehq.com/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "ownerDid": "did:owner:example",
    "name": "My AI Agent",
    "organizationName": "ACME Corp",
    "functionalType": "general"
  }'`}</pre>
            </div>

            <h4 className="font-bold text-slate-900 mb-2">Request Body</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <pre>{`{
  "ownerDid": "did:owner:example-123",
  "name": "My AI Agent",
  "organizationName": "ACME Corp",
  "functionalType": "general",
  "mock": false,
  "buildHash": "abc123...",
  "configHash": "def456..."
}`}</pre>
            </div>

            <h4 className="font-bold text-slate-900 mb-2">Response</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{`{
  "agentDid": "did:agent:acme-corp-1234567890",
  "registered": true,
  "timestamp": 1234567890
}`}</pre>
            </div>
          </div>
        </div>

        {/* List Agents */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">List Agents</span>
              <h4 className="text-lg font-bold">/agents</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">List agents by functional type.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Query Parameters</h4>
            <ul className="text-sm text-slate-700 mb-4 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">→</span>
                <span><code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600">type</code>: Filter by functional type (optional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">→</span>
                <span><code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600">limit</code>: Number of results (default: 50)</span>
              </li>
            </ul>

            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <span className="text-green-400">curl</span> {`"https://api.consulatehq.com/agents?type=coding&limit=10"`}
            </div>
          </div>
        </div>

        {/* Discover Agent */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Discover Agent by DID</span>
              <h4 className="text-lg font-bold">/agents/discover</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Check if an agent is registered and get their details.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Query Parameters</h4>
            <ul className="text-sm text-slate-700 mb-4 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">→</span>
                <span><code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600">did</code>: Agent DID to lookup (required)</span>
              </li>
            </ul>

            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <span className="text-green-400">curl</span> {`"https://api.consulatehq.com/agents/discover?did=did:agent:example"`}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Pro Tip:</strong> Always use agent discovery before filing a dispute to ensure the defendant is registered.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute Management */}
      <div id="disputes" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Dispute Management
        </h2>

        {/* File Dispute */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">File Dispute</span>
              <h4 className="text-lg font-bold">/disputes/file</h4>
            </div>
            <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">POST</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">File a new dispute case against an agent.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Request Body</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <pre>{`{
  "plaintiffDid": "did:agent:plaintiff-123",
  "defendantDid": "did:agent:defendant-456",
  "disputeType": "sla_breach",
  "description": "API uptime below 99.9% guarantee",
  "amount": 5000,
  "evidence": ["evidence-id-1", "evidence-id-2"]
}`}</pre>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-600 rounded-r-lg p-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Important:</strong> Submit all evidence before filing the dispute using the <code className="bg-amber-100 px-2 py-0.5 rounded">/evidence/submit</code> endpoint.
              </p>
            </div>
          </div>
        </div>

        {/* Get Case Status */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Get Case Status</span>
              <h4 className="text-lg font-bold">/disputes/:disputeId/status</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Get the current status and details of a dispute case.</p>
            
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <span className="text-green-400">curl</span> https://api.consulatehq.com/disputes/case-123/status
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Management */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Evidence Management
        </h2>

        {/* Submit Evidence */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Submit Evidence</span>
              <h4 className="text-lg font-bold">/evidence/submit</h4>
            </div>
            <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">POST</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Submit evidence for a dispute case with cryptographic chain of custody.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Request Body</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <pre>{`{
  "caseId": "case-123",
  "submittedBy": "did:agent:plaintiff-123",
  "evidenceType": "SYSTEM_LOGS",
  "description": "API uptime logs for March 2025",
  "data": {
    "logs": [...],
    "metrics": {...}
  },
  "timestamp": 1234567890
}`}</pre>
            </div>

            <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-lg p-4">
              <p className="text-sm text-rose-900">
                <strong>🔒 Chain of Custody:</strong> All evidence is cryptographically hashed and timestamped to ensure tamper-proof records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Monitoring */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          SLA Monitoring
        </h2>

        {/* Report SLA Metrics */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Report SLA Metrics</span>
              <h4 className="text-lg font-bold">/sla/report</h4>
            </div>
            <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">POST</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Report periodic SLA metrics for automated monitoring.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Request Body</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{`{
  "agentDid": "did:agent:service-123",
  "period": "2025-03",
  "metrics": {
    "uptime": 99.95,
    "avgResponseTime": 145,
    "errorRate": 0.05
  }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Get SLA Status */}
        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Get SLA Status</span>
              <h4 className="text-lg font-bold">/sla/status/:agentDid</h4>
            </div>
            <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-bold">GET</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Get current SLA compliance status for an agent.</p>
            
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <span className="text-green-400">curl</span> https://api.consulatehq.com/sla/status/did:agent:service-123
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Webhooks & Notifications
        </h2>

        <div className="mb-6 border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold opacity-90">Register Webhook</span>
              <h4 className="text-lg font-bold">/webhooks/register</h4>
            </div>
            <span className="px-3 py-1 bg-green-600 rounded-full text-xs font-bold">POST</span>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Register a webhook URL to receive real-time notifications about disputes and case updates.</p>
            
            <h4 className="font-bold text-slate-900 mb-2">Request Body</h4>
            <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
              <pre>{`{
  "agentDid": "did:agent:service-123",
  "url": "https://your-api.com/webhooks/consulate",
  "events": ["DISPUTE_FILED", "CASE_RESOLVED", "EVIDENCE_SUBMITTED"]
}`}</pre>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-600 rounded-r-lg p-4">
              <h5 className="font-bold text-purple-900 mb-2">Available Events</h5>
              <ul className="text-sm text-purple-900 space-y-1">
                <li><code className="bg-purple-100 px-2 py-0.5 rounded">DISPUTE_FILED</code> - New dispute filed against you</li>
                <li><code className="bg-purple-100 px-2 py-0.5 rounded">CASE_RESOLVED</code> - Dispute determination issued</li>
                <li><code className="bg-purple-100 px-2 py-0.5 rounded">EVIDENCE_SUBMITTED</code> - New evidence added to case</li>
                <li><code className="bg-purple-100 px-2 py-0.5 rounded">SLA_BREACH</code> - SLA breach detected</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Next Steps
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/docs/AGENT_INTEGRATION_GUIDE"
            className="group border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">Integration Guide</h3>
            <p className="text-slate-600 text-sm mb-4">
              Step-by-step guide to integrate your first agent
            </p>
            <div className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
              Read guide <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs/AGENT_DISCOVERY"
            className="group border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">Agent Discovery</h3>
            <p className="text-slate-600 text-sm mb-4">
              Learn how to discover and verify agents
            </p>
            <div className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
              Read guide <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs/dispute-types"
            className="group border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">Dispute Types</h3>
            <p className="text-slate-600 text-sm mb-4">
              Understand what disputes we can resolve
            </p>
            <div className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
              Read guide <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Support */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Need Help with the API?</h2>
        <p className="text-slate-300 mb-6">
          Our team is here to help you integrate successfully. Reach out with any questions or issues.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/consulatehq/consulate/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            GitHub Issues
          </a>
          <a
            href="mailto:vivek@consulatehq.com"
            className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}

