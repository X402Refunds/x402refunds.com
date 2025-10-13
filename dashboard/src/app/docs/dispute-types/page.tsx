import Link from 'next/link';
import { ChevronRight, Activity, Zap, Database, Gauge, Shield, FileText, Clock, Scale, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Dispute Types - Consulate Docs',
  description: 'Complete guide to the types of disputes Consulate can resolve through expert determination',
};

export default function DisputeTypesPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
        <Link href="/docs" className="hover:text-blue-600">
          Docs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-medium">Dispute Types</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Dispute Types
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-4xl">
          Consulate provides fast, automated dispute resolution for technical disputes between AI systems, API vendors, and their customers through expert determination.
        </p>
      </div>

      {/* Key Features Banner */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <CheckCircle2 className="h-8 w-8 text-blue-600 mb-2" />
          <div className="font-bold text-slate-900 text-sm">7-Minute</div>
          <div className="text-xs text-slate-600">Resolution Time</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <Activity className="h-8 w-8 text-green-600 mb-2" />
          <div className="font-bold text-slate-900 text-sm">Automated</div>
          <div className="text-xs text-slate-600">Log Verification</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <Scale className="h-8 w-8 text-purple-600 mb-2" />
          <div className="font-bold text-slate-900 text-sm">Binding</div>
          <div className="text-xs text-slate-600">Determinations</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <FileText className="h-8 w-8 text-amber-600 mb-2" />
          <div className="font-bold text-slate-900 text-sm">Objective</div>
          <div className="text-xs text-slate-600">Metric Validation</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
          <Shield className="h-8 w-8 text-rose-600 mb-2" />
          <div className="font-bold text-slate-900 text-sm">Enforceable</div>
          <div className="text-xs text-slate-600">Contract Law</div>
        </div>
      </div>

      {/* Important Distinction */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white mb-16 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Important Distinction</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-blue-200 font-semibold mb-2">Resolution Method</div>
            <div className="text-lg">
              Disputes are resolved through <strong>Expert Determination</strong> (not traditional arbitration)
            </div>
          </div>
          <div>
            <div className="text-blue-200 font-semibold mb-2">Communication Standard</div>
            <div className="text-lg">
              We use the <strong>Agentic Arbitration Protocol (AAP)</strong> as the technical communication layer
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <p className="text-blue-100">
            Think of AAP as the &ldquo;HTTP of dispute resolution&rdquo; - it&apos;s the protocol that agents use to communicate, file claims, and exchange evidence. Expert determination is the legal framework we use to make binding technical determinations.
          </p>
        </div>
      </div>

      {/* Dispute Type Cards */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Supported Dispute Types</h2>

        <div className="space-y-8">
          {/* 1. API Uptime & Availability */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Activity className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold opacity-90">Type 1</div>
                  <h3 className="text-2xl font-bold">API Uptime & Availability</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">What We Resolve</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">→</span>
                      <span>SLA uptime breaches (e.g., guaranteed 99.9% uptime not met)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">→</span>
                      <span>Service outages and downtime incidents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">→</span>
                      <span>Feature availability violations</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">How It Works</h4>
                  <ol className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span>Customer files claim with monitoring logs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span>Consulate verifies actual uptime from logs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span>System calculates damages based on SLA terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span>Binding determination issued in 7 minutes</span>
                    </li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6">
                <h5 className="font-bold text-blue-900 mb-3">Example Case</h5>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-blue-900">Claim:</strong> <span className="text-slate-700">&ldquo;API was down 2.3 hours in March, breaching 99.9% uptime SLA&rdquo;</span></p>
                  <p><strong className="text-blue-900">Evidence:</strong> <span className="text-slate-700">Datadog monitoring logs, incident reports</span></p>
                  <p><strong className="text-blue-900">Determination:</strong> <span className="text-slate-700">Breach confirmed. 98.7% uptime vs. 99.9% guarantee.</span></p>
                  <p><strong className="text-blue-900">Damages:</strong> <span className="text-green-700 font-semibold">25% monthly credit ($12,500)</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. API Performance & Latency */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold opacity-90">Type 2</div>
                  <h3 className="text-2xl font-bold">API Performance & Latency</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">What We Resolve</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>Response time SLA breaches (e.g., &lt;200ms guarantee not met)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>Throughput/rate limit violations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>Performance degradation claims</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">Common SLA Terms</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>p95/p99 latency thresholds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>API requests per second (RPS) guarantees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">→</span>
                      <span>Time to first byte (TTFB) requirements</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-600 rounded-r-lg p-6">
                <h5 className="font-bold text-green-900 mb-3">Example Case</h5>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-green-900">Claim:</strong> <span className="text-slate-700">&ldquo;API p95 latency exceeded 200ms guarantee for 4 days&rdquo;</span></p>
                  <p><strong className="text-green-900">Evidence:</strong> <span className="text-slate-700">New Relic APM data showing 487ms p95 latency</span></p>
                  <p><strong className="text-green-900">Determination:</strong> <span className="text-slate-700">Breach confirmed. 487ms vs. 200ms requirement.</span></p>
                  <p><strong className="text-green-900">Damages:</strong> <span className="text-green-700 font-semibold">$5,000 credit (10% of monthly fee)</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Data Quality & Accuracy */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Database className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold opacity-90">Type 3</div>
                  <h3 className="text-2xl font-bold">Data Quality & Accuracy</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">What We Resolve</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Data accuracy SLA breaches (e.g., 99% accuracy guarantee)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Missing or incomplete data delivery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Data freshness violations (e.g., real-time data delayed)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">Common SLA Terms</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Minimum data accuracy percentages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Data completeness requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">→</span>
                      <span>Freshness/latency guarantees for real-time data</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-purple-50 border-l-4 border-purple-600 rounded-r-lg p-6">
                <h5 className="font-bold text-purple-900 mb-3">Example Case</h5>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-purple-900">Claim:</strong> <span className="text-slate-700">&ldquo;Enrichment API returned inaccurate data 3.2% of the time&rdquo;</span></p>
                  <p><strong className="text-purple-900">Evidence:</strong> <span className="text-slate-700">Validation report on 10,000 sample records</span></p>
                  <p><strong className="text-purple-900">Determination:</strong> <span className="text-slate-700">Breach confirmed. 96.8% accuracy vs. 99% guarantee.</span></p>
                  <p><strong className="text-purple-900">Damages:</strong> <span className="text-green-700 font-semibold">$8,000 refund per contract terms</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Rate Limiting & Throttling */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Gauge className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold opacity-90">Type 4</div>
                  <h3 className="text-2xl font-bold">Rate Limiting & Throttling</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">What We Resolve</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>API rate limit violations (requests throttled below guaranteed rate)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>Unexpected throttling during peak usage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>Fair usage policy disputes</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">Common SLA Terms</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>Guaranteed requests per minute/second</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>Burst capacity allowances</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">→</span>
                      <span>Peak traffic handling guarantees</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-amber-50 border-l-4 border-amber-600 rounded-r-lg p-6">
                <h5 className="font-bold text-amber-900 mb-3">Example Case</h5>
                <div className="space-y-2 text-sm">
                  <p><strong className="text-amber-900">Claim:</strong> <span className="text-slate-700">&ldquo;API throttled at 7,500 req/min vs. 10,000 req/min guarantee&rdquo;</span></p>
                  <p><strong className="text-amber-900">Evidence:</strong> <span className="text-slate-700">Request logs showing 429 errors during peak traffic</span></p>
                  <p><strong className="text-amber-900">Determination:</strong> <span className="text-slate-700">Breach confirmed. 25% capacity reduction.</span></p>
                  <p><strong className="text-amber-900">Damages:</strong> <span className="text-green-700 font-semibold">$3,750 credit (25% of monthly fee)</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Security & Compliance */}
          <div className="border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-sm font-semibold opacity-90">Type 5</div>
                  <h3 className="text-2xl font-bold">Security & Compliance</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">What We Resolve</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">→</span>
                      <span>Data breach notification failures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">→</span>
                      <span>Security standard violations (SOC 2, ISO 27001)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">→</span>
                      <span>Encryption/compliance requirement breaches</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">Resolution Process</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Security disputes may require human expert review for complex cases. Consulate&apos;s technical experts verify that security standards were not met through audit reports and compliance certifications.
                  </p>
                </div>
              </div>
              
              <div className="bg-rose-50 border-l-4 border-rose-600 rounded-r-lg p-6">
                <h5 className="font-bold text-rose-900 mb-2">⚠️ Note on Security Disputes</h5>
                <p className="text-sm text-rose-800">
                  Security and compliance disputes often involve sensitive information and may take longer than the standard 7-minute resolution due to the need for thorough expert review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Timeline */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Typical Resolution Timeline
        </h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
            <Clock className="h-8 w-8 text-blue-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 mb-1">0-2 min</div>
            <div className="text-sm text-slate-600">Evidence submission & validation</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
            <Clock className="h-8 w-8 text-green-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 mb-1">2-4 min</div>
            <div className="text-sm text-slate-600">Automated log analysis & verification</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
            <Clock className="h-8 w-8 text-amber-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 mb-1">4-6 min</div>
            <div className="text-sm text-slate-600">Damages calculation & determination draft</div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
            <Clock className="h-8 w-8 text-purple-600 mb-3" />
            <div className="text-2xl font-bold text-slate-900 mb-1">6-7 min</div>
            <div className="text-sm text-slate-600">Final determination & notification</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 pb-3 border-b-2 border-slate-300">
          Ready to Get Started?
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/docs/AGENT_INTEGRATION_GUIDE"
            className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-8 hover:shadow-xl transition-all"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">Integrate Your Agent</h3>
            <p className="text-slate-600 mb-4">
              Get your AI agent connected to Consulate in under 10 minutes
            </p>
            <div className="text-blue-600 font-medium inline-flex items-center gap-1">
              Start integration <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs/api/endpoints"
            className="group bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-8 hover:shadow-xl transition-all"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-green-600">API Reference</h3>
            <p className="text-slate-600 mb-4">
              Complete API documentation with code examples and authentication
            </p>
            <div className="text-green-600 font-medium inline-flex items-center gap-1">
              View API docs <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Support */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Questions About Dispute Types?</h2>
        <p className="text-slate-300 mb-6">
          Not sure if your use case is covered? Reach out and we&apos;ll help you determine if Consulate is right for you.
        </p>
        <a
          href="mailto:vivek@consulatehq.com"
          className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}

