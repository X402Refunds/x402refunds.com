"use client"

import { Code, Share, Sparkles, Plug, Webhook, ShieldCheck, Network, LineChart, Scale, Book, Terminal, Beaker, XCircle, CheckCircle, Key, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-slate-100 text-slate-700 border-slate-300 text-sm font-medium px-4 py-1.5">
              FOR MCP SERVER BUILDERS · Production-ready dispute infrastructure
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
              The dispute layer for agentic payments
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Don&apos;t build dispute resolution from scratch. Add one endpoint to your MCP server and route all disputes to our AI-powered platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-8 h-14 font-semibold"
                onClick={() => window.open('/dashboard', '_self')}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 text-lg px-8 h-14 font-semibold"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View Documentation →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* The Problem */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">THE PROBLEM</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                Every payment agent needs disputes. Nobody wants to build them.
              </h2>
              
              <div className="space-y-4">
                {[
                  "Building dispute logic takes months of development",
                  "Fraud detection requires specialized ML expertise",
                  "Compliance and regulations are constantly changing",
                  "Manual dispute handling doesn't scale with agents"
                ].map((problem, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-slate-700">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The Solution */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">THE SOLUTION</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                One API. Full dispute infrastructure.
              </h2>
              
              <div className="space-y-4">
                {[
                  "Integrate disputes in minutes with one SDK call",
                  "AI agents handle 95% of disputes automatically",
                  "Built-in fraud detection and compliance",
                  "Scale to millions of disputes without ops overhead"
                ].map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-slate-700">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-xl text-slate-600">
              Expose one endpoint. Route all disputes to us. Focus on building your agent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-slate-700" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">1</div>
                <CardTitle className="text-2xl">Add the SDK</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Install our SDK and add a file_dispute tool to your MCP server. The tool wraps our dispute API.
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                  npm install @disputeflow/sdk
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Share className="h-6 w-6 text-slate-700" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">2</div>
                <CardTitle className="text-2xl">Route Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  When users call file_dispute on your server, it automatically routes to our platform with full context.
                </p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                  disputeflow.disputes.create()
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-slate-700" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">3</div>
                <CardTitle className="text-2xl">We Handle Everything</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Our AI agents analyze, detect fraud, communicate with parties, and resolve disputes in minutes.
                </p>
                <div className="text-center pt-2">
                  <div className="text-sm text-slate-600 font-medium">avg resolution:</div>
                  <div className="text-2xl font-bold text-slate-900">4.2 minutes</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Built for MCP Server Builders */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for MCP server builders</h2>
            <p className="text-xl text-slate-300">
              Everything you need to add world-class dispute resolution to your agent
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Plug,
                title: "Simple Integration",
                description: "One SDK, one API key. Add dispute resolution to your MCP server in under 5 minutes."
              },
              {
                icon: Webhook,
                title: "Webhooks & Events",
                description: "Get real-time updates on dispute status. Stay in control with webhook notifications."
              },
              {
                icon: ShieldCheck,
                title: "Built-in Fraud Detection",
                description: "ML models trained on millions of disputes catch fraudulent claims automatically."
              },
              {
                icon: Network,
                title: "Custom Workflows",
                description: "Define resolution rules specific to your use case. Escalate complex cases automatically."
              },
              {
                icon: LineChart,
                title: "Real-time Dashboard",
                description: "Monitor disputes, view analytics, and track resolution rates from your dashboard."
              },
              {
                icon: Scale,
                title: "Compliance Ready",
                description: "SOC 2, GDPR compliant. Built-in audit logs and reporting for regulations."
              }
            ].map((feature, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beautiful APIs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">DEVELOPER FIRST</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Beautiful APIs. Comprehensive docs.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We&apos;re developers building for developers. Our APIs are RESTful, well-documented, and designed to get you up and running in minutes.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Book, title: "Complete Documentation", description: "Interactive API reference, guides, and examples" },
                  { icon: Terminal, title: "SDKs for Every Language", description: "TypeScript, Python, Go, Rust - we&apos;ve got you covered" },
                  { icon: Beaker, title: "Sandbox Environment", description: "Test your integration with fake disputes before going live" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                className="bg-slate-900 text-white hover:bg-slate-800 text-base px-6"
                onClick={() => window.open('/dashboard', '_self')}
              >
                View Documentation →
              </Button>
            </div>

            <div className="relative">
              <Card className="border-2 border-slate-200 shadow-lg">
                <CardHeader className="bg-slate-900 text-white rounded-t-lg border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="ml-auto text-sm text-slate-400">API Reference</span>
                  </div>
                </CardHeader>
                <CardContent className="bg-slate-900 text-slate-100 p-6 font-mono text-sm rounded-b-lg">
                  <pre className="overflow-x-auto">
{`// Create a dispute
const dispute = await disputeflow.disputes.create({
  transaction_id: "txn_abc123",
  amount: 29.99,
  currency: "USD",
  reason: "product_not_received",
  customer: {
    id: "cus_xyz789",
    email: "user@example.com"
  },
  metadata: {
    order_id: "ord_456"
  }
});

// Returns:
{
  id: "dsp_123",
  status: "analyzing",
  estimated_resolution: "2024-01-15T10:30:00Z",
  fraud_score: 0.12
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ship disputes in 5 minutes
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join hundreds of MCP server builders who&apos;ve added dispute resolution to their agents.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 font-semibold"
              onClick={() => window.open('/dashboard', '_self')}
            >
              <Key className="mr-2 h-5 w-5" />
              Get Your API Key
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-slate-600 text-white hover:bg-slate-800 text-lg px-8 h-14 font-semibold"
              onClick={() => window.open('/dashboard', '_self')}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Read the Docs
            </Button>
          </div>

          <p className="text-slate-400 mt-8">
            <strong className="text-white">Free sandbox</strong> · First 100 disputes free · 5 minute integration
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
