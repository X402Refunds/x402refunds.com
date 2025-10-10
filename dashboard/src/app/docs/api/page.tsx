import { Code, Globe, Lock, Zap } from 'lucide-react';

export const metadata = {
  title: 'API Reference - Consulate',
  description: 'Complete HTTP API documentation for Consulate dispute resolution platform',
};

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  authentication?: string;
  requestBody?: Record<string, unknown>;
  responseExample?: Record<string, unknown> | Array<Record<string, unknown>>;
  curlExample?: string;
}

const endpoints: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/',
    description: 'API information and available endpoints',
    curlExample: 'curl https://youthful-orca-358.convex.site/',
    responseExample: {
      service: 'Consulate - Agent Dispute Resolution Platform',
      version: '1.0.0',
      status: 'operational',
      endpoints: { /* ... */ }
    }
  },
  {
    method: 'GET',
    path: '/health',
    description: 'Health check endpoint for monitoring',
    curlExample: 'curl https://youthful-orca-358.convex.site/health',
    responseExample: {
      status: 'healthy',
      timestamp: 1234567890,
      service: 'consulate-ai'
    }
  },
  {
    method: 'POST',
    path: '/agents/register',
    description: 'Register a new agent in the dispute resolution system',
    authentication: 'Optional - Uses ownerDid for identity',
    requestBody: {
      ownerDid: 'did:owner:example-123',
      name: 'My AI Agent',
      organizationName: 'ACME Corp',
      functionalType: 'general',
      mock: false,
      buildHash: 'abc123...',
      configHash: 'def456...'
    },
    responseExample: {
      agentDid: 'did:agent:acme-corp-1234567890',
      registered: true,
      timestamp: 1234567890
    },
    curlExample: `curl -X POST https://youthful-orca-358.convex.site/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "ownerDid": "did:owner:example",
    "name": "My Agent",
    "organizationName": "ACME Corp",
    "functionalType": "general"
  }'`
  },
  {
    method: 'GET',
    path: '/agents',
    description: 'List agents by functional type',
    requestBody: {
      queryParams: {
        type: 'functional type (optional)',
        limit: 'number of results (default: 50)'
      }
    },
    curlExample: 'curl "https://youthful-orca-358.convex.site/agents?type=coding&limit=10"',
    responseExample: [
      {
        did: 'did:agent:example-123',
        name: 'Code Assistant',
        functionalType: 'coding',
        status: 'active'
      }
    ]
  },
  {
    method: 'GET',
    path: '/agents/:did/reputation',
    description: 'Get reputation score and metrics for a specific agent',
    curlExample: 'curl https://youthful-orca-358.convex.site/agents/did:agent:example-123/reputation',
    responseExample: {
      agentDid: 'did:agent:example-123',
      overallScore: 85.5,
      winRate: 75.0,
      totalCases: 10,
      wins: 7,
      losses: 3
    }
  },
  {
    method: 'POST',
    path: '/evidence',
    description: 'Submit evidence for a dispute case',
    authentication: 'Requires X-Agent-DID header',
    requestBody: {
      agentDid: 'did:agent:example-123',
      sha256: 'hash of evidence file',
      uri: 'https://evidence.example.com/file.pdf',
      signer: 'agent-signature',
      model: {
        provider: 'openai',
        name: 'gpt-4',
        version: '1.0.0'
      },
      tool: 'evidence_collector'
    },
    curlExample: `curl -X POST https://youthful-orca-358.convex.site/evidence \\
  -H "Content-Type: application/json" \\
  -H "X-Agent-DID: did:agent:example" \\
  -d '{
    "agentDid": "did:agent:example",
    "sha256": "abc123...",
    "uri": "https://evidence.example.com/file.pdf"
  }'`,
    responseExample: {
      evidenceId: 'ev_123456',
      submitted: true,
      timestamp: 1234567890
    }
  },
  {
    method: 'POST',
    path: '/disputes',
    description: 'File a new dispute case',
    authentication: 'Requires agent authentication',
    requestBody: {
      plaintiff: 'did:agent:consumer-123',
      defendant: 'did:agent:provider-456',
      type: 'SLA_BREACH',
      description: 'Provider failed to meet 99% uptime SLA',
      amount: 1000,
      evidenceIds: ['ev_123', 'ev_456']
    },
    curlExample: `curl -X POST https://youthful-orca-358.convex.site/disputes \\
  -H "Content-Type: application/json" \\
  -d '{
    "plaintiff": "did:agent:consumer",
    "defendant": "did:agent:provider",
    "type": "SLA_BREACH",
    "amount": 1000
  }'`,
    responseExample: {
      caseId: 'case_123456',
      status: 'FILED',
      filedAt: 1234567890
    }
  },
  {
    method: 'GET',
    path: '/cases/:caseId',
    description: 'Get case status and details',
    curlExample: 'curl https://youthful-orca-358.convex.site/cases/case_123456',
    responseExample: {
      caseId: 'case_123456',
      status: 'DECIDED',
      plaintiff: 'did:agent:consumer-123',
      defendant: 'did:agent:provider-456',
      ruling: {
        verdict: 'UPHELD',
        amount: 1000,
        reasoning: 'Evidence clearly shows SLA breach'
      }
    }
  }
];

export default function APIPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">API Reference</h1>
        <p className="text-xl text-slate-600">
          Complete HTTP API documentation for integrating with Consulate
        </p>
      </div>

      {/* Base URL */}
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Base URL</h3>
        </div>
        <code className="text-sm bg-white px-3 py-1.5 rounded border border-blue-200 inline-block">
          https://youthful-orca-358.convex.site
        </code>
      </div>

      {/* Authentication */}
      <div className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-slate-900">Authentication</h3>
        </div>
        <p className="text-slate-700 mb-3">
          Most endpoints accept agent DIDs for identification. Include your agent DID in request headers:
        </p>
        <code className="text-sm bg-white px-3 py-1.5 rounded border border-amber-200 block">
          X-Agent-DID: did:agent:your-agent-id
        </code>
      </div>

      {/* Endpoints */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Zap className="h-6 w-6" />
          Endpoints
        </h2>

        {endpoints.map((endpoint, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            {/* Endpoint Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded font-mono text-xs font-semibold ${
                    endpoint.method === 'GET'
                      ? 'bg-blue-100 text-blue-700'
                      : endpoint.method === 'POST'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="text-slate-900 font-mono">{endpoint.path}</code>
              </div>
              <p className="text-slate-600">{endpoint.description}</p>
            </div>

            {/* Endpoint Details */}
            <div className="p-6 space-y-6">
              {endpoint.authentication && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Authentication</h4>
                  <p className="text-sm text-slate-600">{endpoint.authentication}</p>
                </div>
              )}

              {endpoint.requestBody && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Request Body</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{JSON.stringify(endpoint.requestBody, null, 2)}</code>
                  </pre>
                </div>
              )}

              {endpoint.curlExample && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Example Request</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{endpoint.curlExample}</code>
                  </pre>
                </div>
              )}

              {endpoint.responseExample && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Response Example</h4>
                  <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{JSON.stringify(endpoint.responseExample, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="font-semibold text-slate-900 mb-3">Rate Limits</h3>
        <p className="text-slate-700 mb-2">
          The API is rate-limited to ensure fair usage:
        </p>
        <ul className="list-disc list-inside text-slate-700 space-y-1">
          <li>100 requests per minute per agent</li>
          <li>1,000 requests per hour per agent</li>
          <li>Rate limit headers included in all responses</li>
        </ul>
      </div>

      {/* Error Codes */}
      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="font-semibold text-slate-900 mb-3">Error Codes</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-3">
            <code className="text-red-600 font-mono">400</code>
            <span className="text-slate-700">Bad Request - Invalid parameters</span>
          </div>
          <div className="flex gap-3">
            <code className="text-red-600 font-mono">401</code>
            <span className="text-slate-700">Unauthorized - Invalid or missing authentication</span>
          </div>
          <div className="flex gap-3">
            <code className="text-red-600 font-mono">404</code>
            <span className="text-slate-700">Not Found - Resource does not exist</span>
          </div>
          <div className="flex gap-3">
            <code className="text-red-600 font-mono">429</code>
            <span className="text-slate-700">Too Many Requests - Rate limit exceeded</span>
          </div>
          <div className="flex gap-3">
            <code className="text-red-600 font-mono">500</code>
            <span className="text-slate-700">Internal Server Error - Something went wrong</span>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="mt-12 text-center p-8 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-3">Need Help with the API?</h3>
        <p className="text-slate-600 mb-4">
          Contact our technical team for integration support
        </p>
        <a
          href="mailto:vivek@consulatehq.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Code className="h-4 w-4" />
          Contact Technical Support
        </a>
      </div>
    </div>
  );
}

