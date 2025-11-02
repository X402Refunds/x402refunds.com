"use client"

import { Code, Share, Sparkles, Plug, Webhook, ShieldCheck, Network, LineChart, Scale, Book, Terminal, Beaker, XCircle, CheckCircle, Key, BookOpen, ArrowRight, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { useState } from "react"

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState(false)

  const copyCodeToClipboard = () => {
    const code = `// File a dispute via MCP tool
const result = await mcp.invoke("consulate_file_dispute", {
  transactionId: "txn_abc123",
  amount: 29.99,
  currency: "USD",
  paymentProtocol: "STRIPE",
  plaintiff: "consumer:alice@example.com",
  defendant: "merchant:openai-api",
  disputeReason: "service_not_rendered",
  description: "API call failed but charge went through",
  evidenceUrls: ["https://logs.example.com/txn_abc123"]
});`
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center py-20 sm:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-2xl animate-pulse" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <Badge className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
              FOR MCP SERVER BUILDERS · Production-ready dispute infrastructure
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                The dispute layer for agentic payments
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Add one endpoint to your MCP server and instantly become compliant with{' '}
              <a 
                href="https://www.consumerfinance.gov/rules-policy/regulations/1005/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4 transition-colors"
              >
                Regulation E
              </a>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 text-lg px-8 h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                onClick={() => window.location.href = 'https://www.consulatehq.com/sign-in/'}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 text-lg px-8 h-14 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => window.location.href = 'https://docs.consulatehq.com'}
              >
                View Documentation →
              </Button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">95%</div>
                <div className="text-sm text-slate-600 mt-1">Auto-resolved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">4.2m</div>
                <div className="text-sm text-slate-600 mt-1">Avg resolution</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">5m</div>
                <div className="text-sm text-slate-600 mt-1">Integration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="problem-solution" data-animate className="py-24 bg-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* The Problem */}
            <div className="space-y-6">
              <div className="inline-block">
                <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2 px-3 py-1 bg-red-50 rounded-full border border-red-100">THE PROBLEM</p>
              </div>
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
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-red-50/50 border border-red-100/50 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-base text-slate-700 pt-1">{problem}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The Solution */}
            <div className="space-y-6">
              <div className="inline-block">
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">THE SOLUTION</p>
              </div>
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
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-base text-slate-700 pt-1">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expose Consulate Tools */}
      <section id="how-it-works" data-animate className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">HOW IT WORKS</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Expose Consulate Tools
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Add our MCP tools to your server. Route disputes to us. Focus on building your agent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines - desktop only */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
            
            {/* Step 1 */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-md hover:shadow-xl transition-all duration-300 group relative bg-white">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code className="h-7 w-7 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Expose Consulate Tool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Add the consulate_file_dispute tool to your MCP server as a wrapper that forwards to our API. Your users get instant dispute resolution.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-2 border-slate-200 hover:border-purple-300 shadow-md hover:shadow-xl transition-all duration-300 group relative bg-white">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Share className="h-7 w-7 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Auto-Route Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  When users invoke the tool, disputes automatically route to Consulate with full transaction context. No additional integration needed.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-2 border-slate-200 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 group relative bg-white">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                3
              </div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">We Handle Everything</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Our AI analyzes evidence, detects fraud, and provides recommendations. Your team reviews and makes final decisions in minutes.
                </p>
                <div className="text-center pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">avg resolution</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mt-1">4.2 minutes</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Built for MCP Server Builders */}
      <section id="features" data-animate className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-white/10 text-white border-white/20 mb-4 backdrop-blur-sm">FEATURES</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for MCP server builders
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to add world-class dispute resolution to your agent
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Plug,
                title: "Simple Integration",
                description: "One SDK, one API key. Add dispute resolution to your MCP server in under 5 minutes.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Webhook,
                title: "Webhooks & Events",
                description: "Get real-time updates on dispute status. Stay in control with webhook notifications.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: ShieldCheck,
                title: "Built-in Fraud Detection",
                description: "ML models trained on millions of disputes catch fraudulent claims automatically.",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: Network,
                title: "Custom Workflows",
                description: "Define resolution rules specific to your use case. Escalate complex cases automatically.",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: LineChart,
                title: "Real-time Dashboard",
                description: "Monitor disputes, view analytics, and track resolution rates from your dashboard.",
                color: "from-indigo-500 to-blue-500"
              },
              {
                icon: Scale,
                title: "Compliance Ready",
                description: "SOC 2, GDPR compliant. Built-in audit logs and reporting for regulations.",
                color: "from-violet-500 to-purple-500"
              }
            ].map((feature, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <CardHeader>
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beautiful APIs Section */}
      <section id="api-docs" data-animate className="py-24 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 mb-4">DEVELOPER FIRST</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Beautiful APIs. Comprehensive docs.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We&apos;re developers building for developers. Our APIs are RESTful, well-documented, and designed to get you up and running in minutes.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Complete Documentation</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">Interactive API reference, guides, and examples</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Terminal className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">SDKs for Every Language</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">TypeScript, Python, Go, Rust - we&apos;ve got you covered</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Beaker className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Sandbox Environment</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">Test your integration with fake disputes before going live</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all group"
                onClick={() => window.location.href = 'https://docs.consulatehq.com'}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                View Documentation
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl" />
              <Card className="border-2 border-slate-200 shadow-2xl relative overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg border-b-0 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="ml-auto text-sm text-slate-400 font-sans">consulate_file_dispute.ts</span>
                    <button
                      onClick={copyCodeToClipboard}
                      className="ml-2 p-1.5 hover:bg-white/10 rounded transition-colors"
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="bg-slate-950 text-slate-100 p-6 font-mono text-sm rounded-b-lg">
                  <pre className="overflow-x-auto leading-relaxed">
{`// File a dispute via MCP tool
const result = await mcp.invoke("consulate_file_dispute", {
  transactionId: "txn_abc123",
  amount: 29.99,
  currency: "USD",
  paymentProtocol: "STRIPE",
  plaintiff: "consumer:alice@example.com",
  defendant: "merchant:openai-api",
  disputeReason: "service_not_rendered",
  description: "API call failed but charge went through",
  evidenceUrls: ["https://logs.example.com/txn_abc123"]
});

// Returns:
{
  success: true,
  caseId: "k123abc",
  status: "analyzing",
  estimatedResolutionTime: "< 5 minutes",
  pricingTier: "MEDIUM",
  disputeFee: 1.00
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-6">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
              Ready to get started?
            </Badge>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Ship disputes in 5 minutes
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join hundreds of MCP server builders who&apos;ve added dispute resolution to their agents.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 font-semibold shadow-2xl hover:shadow-3xl transition-all group"
              onClick={() => window.location.href = 'https://www.consulatehq.com/sign-in/'}
            >
              <Key className="mr-2 h-5 w-5" />
              Get Your API Key
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg px-8 h-14 font-semibold backdrop-blur-sm transition-all"
              onClick={() => window.location.href = 'https://docs.consulatehq.com'}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Read the Docs
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              </div>
              <span><strong className="text-white">Free sandbox</strong> environment</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              </div>
              <span>First <strong className="text-white">100 disputes free</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              </div>
              <span><strong className="text-white">5 minute</strong> integration</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
