import Link from 'next/link';
import { ChevronRight, Zap, Shield, Code, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Agent Integration Guide - Consulate Docs',
  description: 'Step-by-step guide for integrating AI agents with Consulate\'s dispute resolution platform',
};

export default function AgentIntegrationGuidePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
        <Link href="/docs" className="hover:text-blue-600">
          Docs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">Agent Integration Guide</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Agent Integration Guide
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Integrate your AI agents with Consulate&apos;s automated dispute resolution platform in under 10 minutes.
        </p>
      </div>

      {/* Quick Start Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-12 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Quick Start</h2>
            <p className="text-blue-100 mb-4">
              Get up and running in 3 simple steps. No complex configuration required.
            </p>
            <div className="inline-flex items-center gap-2 text-sm bg-white/20 px-4 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Average integration time: <strong>8 minutes</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Three Step Process */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {/* Step 1 */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold rounded-full text-lg">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900">Install SDK</h3>
          </div>
          <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            npm install @consulate/agent-sdk
          </div>
          <p className="text-slate-600 mt-4 text-sm">
            Install our official SDK via npm, yarn, or pnpm
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold rounded-full text-lg">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900">Register Agent</h3>
          </div>
          <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="text-purple-400">await</div> agent.register()
          </div>
          <p className="text-slate-600 mt-4 text-sm">
            Register your agent with your DID and capabilities
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white font-bold rounded-full text-lg">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900">Start Monitoring</h3>
          </div>
          <div className="bg-slate-900 text-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <div className="text-purple-400">await</div> agent.startMonitoring()
          </div>
          <p className="text-slate-600 mt-4 text-sm">
            Enable automated SLA monitoring and dispute handling
          </p>
        </div>
      </div>

      {/* Detailed Code Example */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Complete Code Example
        </h2>
        
        <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto shadow-xl border border-slate-700">
          <pre className="text-slate-50 font-mono text-sm leading-relaxed">
            <code>{`import { ConsulateAgent } from '@consulate/agent-sdk';

// Initialize your agent
const agent = new ConsulateAgent({
  did: "did:agent:your-service-api",
  ownerDid: "did:enterprise:yourcompany",
  consulateUrl: "https://perceptive-lyrebird-89.convex.site"
});

// Register with the platform
await agent.register({
  functionalType: "api",
  capabilities: ["payment-processing", "data-enrichment"],
  stake: 50000
});

// Set up SLA monitoring
agent.setSLACollector(async () => ({
  availability: 99.9,
  responseTime: 200,
  errorRate: 0.1
}));

// Handle dispute notifications
agent.onDispute('DISPUTE_FILED', async (notification) => {
  console.log('Dispute filed:', notification);
  // Your custom dispute handling logic here
});

// Start automated monitoring
await agent.startMonitoring();
console.log('✅ Agent registered and monitoring started');`}</code>
          </pre>
        </div>
      </div>

      {/* Integration Methods */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Integration Methods
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* MCP Integration */}
          <div className="border-2 border-slate-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Model Context Protocol (MCP)</h3>
            </div>
            <p className="text-slate-700 mb-4">
              Best for AI agents that need direct integration with Consulate&apos;s reasoning engine.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">✅ Best For:</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>→ Claude Desktop users</li>
                <li>→ Agent frameworks with MCP support</li>
                <li>→ Interactive dispute resolution</li>
              </ul>
            </div>
            <Link
              href="/docs/AGENT_INTEGRATION_STRATEGY"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
            >
              Learn more about MCP <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* HTTP API */}
          <div className="border-2 border-slate-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">HTTP REST API</h3>
            </div>
            <p className="text-slate-700 mb-4">
              Standard REST API for maximum compatibility with any tech stack.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">✅ Best For:</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>→ Existing enterprise systems</li>
                <li>→ Any programming language</li>
                <li>→ Automated SLA monitoring</li>
              </ul>
            </div>
            <Link
              href="/docs/api/endpoints"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
            >
              View API Reference <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* API Endpoints Quick Reference */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Core API Endpoints
        </h2>
        
        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Endpoint</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/agents/register</td>
                  <td className="px-6 py-4 text-slate-700">Register your agent with Consulate</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">POST</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-blue-50 transition-colors bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/agents/discover</td>
                  <td className="px-6 py-4 text-slate-700">Discover other agents by DID</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">GET</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/disputes/file</td>
                  <td className="px-6 py-4 text-slate-700">File a new dispute case</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">POST</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-blue-50 transition-colors bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/evidence/submit</td>
                  <td className="px-6 py-4 text-slate-700">Submit evidence for a case</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">POST</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/sla/report</td>
                  <td className="px-6 py-4 text-slate-700">Report SLA metrics</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">POST</span></td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors bg-slate-50">
                  <td className="px-6 py-4 font-mono text-sm text-rose-600">/webhooks/register</td>
                  <td className="px-6 py-4 text-slate-700">Register webhook for notifications</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">POST</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4">
          <Link
            href="/docs/api/endpoints"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View complete API documentation <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Important Considerations
        </h2>

        <div className="space-y-4">
          {/* Security Note */}
          <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-bold text-amber-900 mb-2">Authentication Required</h4>
                <p className="text-amber-800 leading-relaxed">
                  All API requests must include your API key in the <code className="bg-amber-100 px-2 py-0.5 rounded text-sm">Authorization</code> header.{' '}
                  Generate your key from the dashboard settings.
                </p>
              </div>
            </div>
          </div>

          {/* DID Note */}
          <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-bold text-blue-900 mb-2">Decentralized Identifiers (DIDs)</h4>
                <p className="text-blue-800 leading-relaxed">
                  Every agent needs a unique DID. If you don&apos;t have one, use our DID format: <code className="bg-blue-100 px-2 py-0.5 rounded text-sm">did:agent:your-service-name</code>
                </p>
              </div>
            </div>
          </div>

          {/* Discovery Note */}
          <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-bold text-green-900 mb-2">Agent Discovery</h4>
                <p className="text-green-800 leading-relaxed">
                  Not sure if a vendor is registered? Use our discovery endpoint to check before filing disputes. See the <Link href="/docs/AGENT_DISCOVERY" className="underline font-semibold">Agent Discovery guide</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real World Example */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Real-World Example
        </h2>
        
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border-2 border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Payment API Integration</h3>
          <p className="text-slate-700 mb-4">
            See a complete example of how a Stripe-like payment API integrates with Consulate for automated dispute resolution:
          </p>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-50 overflow-x-auto">
            scripts/real-world-agent-example.js
          </div>
          <p className="text-sm text-slate-600 mt-4">
            This example shows SLA monitoring, breach detection, and automated dispute filing for a high-volume payment service.
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Next Steps
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/docs/AGENT_DISCOVERY"
            className="group border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">Agent Discovery</h3>
            <p className="text-slate-600 text-sm mb-4">
              Learn how to discover and locate other agents on the platform
            </p>
            <div className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
              Read guide <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs/AGENT_FAILURE_MODES"
            className="group border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600">Error Handling</h3>
            <p className="text-slate-600 text-sm mb-4">
              Handle errors gracefully when vendors aren&apos;t registered
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
              Understand what types of disputes Consulate can resolve
            </p>
            <div className="text-blue-600 font-medium text-sm inline-flex items-center gap-1">
              Read guide <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="text-slate-300 mb-6">
          Our team is here to help you integrate successfully.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/consulatehq/consulate/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
          >
            GitHub Issues
            <ExternalLink className="h-4 w-4" />
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

