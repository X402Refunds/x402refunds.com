"use client"

import { Code, Share, Sparkles, Plug, Webhook, ShieldCheck, Network, LineChart, Scale, Book, Beaker, XCircle, CheckCircle, Key, BookOpen, ArrowRight, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { AnimatedGrid } from "@/components/AnimatedGrid"
import { AnimatedSection, AnimatedList } from "@/components/ui/animated-section"
import { motion } from "framer-motion"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const { isSignedIn } = useUser()

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
      <section className="relative overflow-hidden min-h-[calc(100vh-80px)] flex items-center py-20 sm:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        {/* Professional animated grid background */}
        <AnimatedGrid color="#10b981" />
        
        {/* Subtle corner accents */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-green-500/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full text-center relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                The dispute layer for AI agents
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Payment disputes. Support tickets. One API.
            </motion.p>

            {!isSignedIn && (
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-400 hover:to-green-500 text-lg px-8 h-14 font-semibold shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/60 transition-all duration-200 group"
                    onClick={() => window.location.href = 'https://www.consulatehq.com/sign-in/'}
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 text-lg px-8 h-14 font-semibold shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-200"
                    onClick={() => window.location.href = 'https://docs.consulatehq.com'}
                  >
                    View Documentation →
                  </Button>
                </motion.div>
              </motion.div>
            )}
            {isSignedIn && (
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 text-lg px-8 h-14 font-semibold shadow-sm hover:shadow-md backdrop-blur-sm transition-all duration-200"
                    onClick={() => window.location.href = 'https://docs.consulatehq.com'}
                  >
                    View Documentation →
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Stats bar */}
            <motion.div 
              className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                { value: "95%", label: "Auto-resolved" },
                { value: "4.2m", label: "Avg resolution" },
                { value: "5m", label: "Integration" }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                >
                  <div className="text-3xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">{stat.value}</div>
                  <div className="text-sm text-emerald-200/70 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="problem-solution" data-animate className="py-24 bg-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* The Problem */}
            <AnimatedSection direction="right" delay={0.1}>
              <div className="space-y-6">
                <motion.div 
                  className="inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2 px-3 py-1 bg-red-50 rounded-full border border-red-100">THE PROBLEM</p>
                </motion.div>
                <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                  Every AI agent needs disputes. Nobody wants to build them.
                </h2>
                
                <AnimatedList staggerDelay={0.1}>
                  {[
                    "Building dispute logic takes months of development",
                    "Fraud detection requires specialized ML expertise",
                    "Compliance and regulations are constantly changing",
                    "Manual dispute handling doesn't scale with agents"
                  ].map((problem, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-red-50/50 border border-red-100/50 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <p className="text-base text-slate-700 pt-1">{problem}</p>
                    </motion.div>
                  ))}
                </AnimatedList>
              </div>
            </AnimatedSection>

            {/* The Solution */}
            <AnimatedSection direction="left" delay={0.2}>
              <div className="space-y-6">
                <motion.div 
                  className="inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">THE SOLUTION</p>
                </motion.div>
                <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                  One API. Full dispute infrastructure.
                </h2>
                
                <AnimatedList staggerDelay={0.1}>
                  {[
                    "Integrate disputes in minutes with one SDK call",
                    "AI agents handle 95% of disputes automatically",
                    "Built-in fraud detection and compliance",
                    "Scale to millions of disputes without ops overhead"
                  ].map((solution, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-base text-slate-700 pt-1">{solution}</p>
                    </motion.div>
                  ))}
                </AnimatedList>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Expose Consulate Tools */}
      <section id="how-it-works" data-animate className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">HOW IT WORKS</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                Expose Consulate Tools
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Add our MCP tools to your server. Route disputes to us. Focus on building your agent.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines - desktop only */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
            
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8 }}
            >
              <Card className="border-2 border-slate-200 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 group relative bg-white">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Expose Consulate Tool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Add the consulate_file_dispute tool to your MCP server as a wrapper that forwards to our API. Your users get instant dispute resolution.
                </p>
                </CardContent>
            </Card>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8 }}
            >
              <Card className="border-2 border-slate-200 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 group relative bg-white">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Share className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Auto-Route Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  When users invoke the tool, disputes automatically route to Consulate with full transaction context. No additional integration needed.
                </p>
                </CardContent>
            </Card>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -8 }}
            >
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
                  <div className="text-3xl font-bold text-emerald-600 mt-1">4.2 minutes</div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Built for MCP Server Builders */}
      <section id="features" data-animate className="py-24 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <Badge className="bg-white/10 text-white border-white/20 mb-4 backdrop-blur-sm">FEATURES</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Built for MCP server builders
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Everything you need to add world-class dispute resolution to your agent
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Plug,
                title: "Simple Integration",
                description: "One SDK, one API key. Add dispute resolution to your MCP server in under 5 minutes.",
                color: "from-emerald-500 to-green-500"
              },
              {
                icon: Webhook,
                title: "Webhooks & Events",
                description: "Get real-time updates on dispute status. Stay in control with webhook notifications.",
                color: "from-emerald-600 to-teal-500"
              },
              {
                icon: ShieldCheck,
                title: "Built-in Fraud Detection",
                description: "ML models trained to catch fraudulent dispute claims automatically.",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: Network,
                title: "Custom Workflows",
                description: "Define resolution rules specific to your use case. Escalate complex cases automatically.",
                color: "from-emerald-400 to-green-600"
              },
              {
                icon: LineChart,
                title: "Real-time Dashboard",
                description: "Monitor disputes, view analytics, and track resolution rates from your dashboard.",
                color: "from-teal-500 to-emerald-600"
              },
              {
                icon: Scale,
                title: "Compliance Ready",
                description: "SOC 2, GDPR compliant. Built-in audit logs and reporting for regulations.",
                color: "from-emerald-500 to-emerald-700"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl group">
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beautiful APIs Section */}
      <section id="api-docs" data-animate className="py-24 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="right" delay={0.1}>
              <div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">DEVELOPER FIRST</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Beautiful APIs. Comprehensive docs.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We&apos;re developers building for developers. Our APIs are RESTful, well-documented, and designed to get you up and running in minutes.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Book className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Complete Documentation</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">Interactive API reference, guides, and examples</p>
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
            </AnimatedSection>

            <AnimatedSection direction="left" delay={0.2}>
              <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-2xl" />
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
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500 to-green-500 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedSection direction="up" delay={0.1}>
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
            {!isSignedIn && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 font-semibold shadow-2xl hover:shadow-3xl transition-all group"
                  onClick={() => window.location.href = 'https://www.consulatehq.com/sign-in/'}
                >
                  <Key className="mr-2 h-5 w-5" />
                  Get Your API Key
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-emerald-600 text-white hover:bg-emerald-500 text-lg px-8 h-14 font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => window.location.href = 'https://docs.consulatehq.com'}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Read the Docs
              </Button>
            </motion.div>
          </div>

          {/* Feature highlights */}
          <AnimatedList staggerDelay={0.1} className="flex flex-wrap justify-center gap-6 text-sm">
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
          </AnimatedList>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  )
}
