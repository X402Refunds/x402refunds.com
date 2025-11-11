"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedGrid } from "@/components/AnimatedGrid"
import { AnimatedSection, AnimatedList } from "@/components/ui/animated-section"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  ArrowRight, 
  XCircle, 
  CheckCircle, 
  Upload, 
  Sparkles, 
  Scale, 
  Plug, 
  Zap, 
  Network, 
  Eye, 
  Book, 
  Beaker, 
  Check, 
  Copy, 
  Key 
} from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const { isSignedIn } = useUser()
  
  // Static stats (average/marketing values - removed hardcoded percentages)
  const avgResolutionMinutes = 4.2

  const copyCodeToClipboard = () => {
    const code = `// Submit payment dispute via REST API
const response = await fetch('https://api.x402disputes.com/api/disputes/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Transaction details
    transactionId: "x402_abc123",
    transactionHash: "0x1a2b3c4d...",  // On-chain proof
    amount: 29.99,
    currency: "USDC",
    paymentProtocol: "ACP",
    
    // Party information
    plaintiff: "consumer:alice@example.com",
    defendant: "merchant:api-provider.com",
    disputeReason: "service_not_rendered",
    description: "Service not rendered after payment",
    
    // Evidence
    evidenceUrls: [
      "https://logs.alice.com/timeout-proof.json",
      "https://merchant.com/delivery-logs.json"
    ]
  })
});

// Response (within 5 minutes):
const ruling = await response.json();
// {
//   success: true,
//   caseId: "case_k123abc",
//   ruling: "CONSUMER_WINS",      // or MERCHANT_WINS, PARTIAL_REFUND
//   confidence: 0.96,
//   refundAmount: 29.99,          // Amount you should refund
//   reasoning: "Evidence shows API timeout before service delivery.",
//   timeline: "2025-01-15T10:30:00Z",
//   appealable: false             // Binding arbitration
// }`
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
                Dispute Resolution for Agentic Payments
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl text-emerald-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Fair rulings. No bias.
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
                  onClick={() => window.location.href = 'https://www.x402disputes.com/sign-in/'}
                >
                  Sign Up Your Agent
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
                  onClick={() => window.location.href = 'https://docs.x402disputes.com'}
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
                  onClick={() => window.location.href = 'https://docs.x402disputes.com'}
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
                { value: 24, suffix: " hr", label: "Resolution Time", duration: 2 },
                { value: avgResolutionMinutes, suffix: " min", label: "Avg Response", duration: 2.5, decimals: 1 },
                { value: 100, suffix: "%", label: "Transparent", duration: 2 }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                >
                  <div className="text-3xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix}
                      duration={stat.duration}
                      decimals={stat.decimals || 0}
                    />
                  </div>
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
                <p className="text-sm font-bold text-red-600 uppercase tracking-wide mb-2 px-3 py-1 bg-red-50 rounded-full border border-red-100">THE CHALLENGE</p>
                </motion.div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8 leading-tight">
                x402 unlocked instant payments. But what happens when disputes arise?
              </h2>
              
                <AnimatedList staggerDelay={0.1}>
                {[
                  "x402 enables autonomous payments, but disputes still happen",
                  "Building neutral arbitration requires AI/ML infrastructure",
                  "Merchants need fair rulings, consumers need protection",
                  "Manual dispute review doesn't scale with payment volume"
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
                Permissionless. Cryptographically Proven.
              </h2>
              
                <AnimatedList staggerDelay={0.1}>
                {[
                  "Agents file disputes directly",
                  "Dispute data written on-chain",
                  "Refund data written on-chain",
                  "On-chain reputation tracking"
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

      {/* How It Works */}
      <section id="how-it-works" data-animate className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <AnimatedSection direction="up" delay={0.1}>
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">HOW IT WORKS</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Three Steps to Fair Dispute Resolution
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Integrate into your x402 payment flow in minutes
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
                  <Upload className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Submit Disputed Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  POST disputed x402 payment to our API with transaction details, party claims, and evidence URLs.
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
                  <Sparkles className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Direct Dispute Filing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Agents file disputes directly. No intermediaries. No permission required.
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
                  <Scale className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Receive Ruling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Get verdict (CONSUMER_WINS, MERCHANT_WINS, PARTIAL_REFUND) with reasoning. You execute the refund based on our ruling.
                </p>
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
              Built for x402 Payment Platforms
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need for compliant x402 disputes. Fair, fast, and fully automated arbitration.
            </p>
          </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Scale,
                title: "Neutral Third-Party",
                description: "Independent arbiter with no merchant bias. Fair rulings that build customer trust.",
                color: "from-emerald-500 to-green-500"
              },
              {
                icon: Plug,
                title: "x402 Native Integration",
                description: "Built specifically for HTTP 402 payment disputes. One API endpoint, instant integration.",
                color: "from-emerald-600 to-teal-500"
              },
              {
                icon: Sparkles,
                title: "Direct Filing",
                description: "Agents file disputes directly. No permission required. Dispute and refund data written on-chain.",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Average 4.2 minute resolution. Match x402's speed with instant arbitration.",
                color: "from-emerald-400 to-green-600"
              },
              {
                icon: Network,
                title: "Evidence Analysis",
                description: "Automated evidence parsing from URLs. Transaction history analysis. Precedent matching.",
                color: "from-teal-500 to-emerald-600"
              },
              {
                icon: Eye,
                title: "Transparent Reasoning",
                description: "Every ruling includes detailed explanation. No black box decisions. Full audit trail.",
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
                Simple REST API. Clear responses.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                One endpoint to submit disputes. One webhook to receive rulings. Built for x402 payment platforms.
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
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Fast Integration</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">Get up and running with x402 disputes in under 5 minutes</p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all group"
                onClick={() => window.location.href = 'https://docs.x402disputes.com'}
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
                    <span className="ml-auto text-sm text-slate-400 font-sans">x402-dispute-api.ts</span>
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
{`// Submit payment dispute via REST API
const response = await fetch('https://api.x402disputes.com/api/disputes/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Transaction details
    transactionId: "x402_abc123",
    transactionHash: "0x1a2b3c4d...",  // On-chain proof
    amount: 29.99,
    currency: "USDC",
    paymentProtocol: "ACP",
    
    // Party information
    plaintiff: "consumer:alice@example.com",
    defendant: "merchant:api-provider.com",
    disputeReason: "service_not_rendered",
    description: "Service not rendered after payment",
    
    // Evidence
    evidenceUrls: [
      "https://logs.alice.com/timeout-proof.json",
      "https://merchant.com/delivery-logs.json"
    ]
  })
});

// Response (within 5 minutes):
{
  success: true,
  caseId: "case_k123abc",
  ruling: "CONSUMER_WINS",      // or MERCHANT_WINS, PARTIAL_REFUND
  confidence: 0.96,
  refundAmount: 29.99,          // Amount you should refund
  reasoning: "Evidence shows API timeout before service delivery.",
  timeline: "2025-01-15T10:30:00Z",
  appealable: false             // Binding arbitration
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
            Add dispute resolution to your x402-enabled platform
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Fair arbitration for every payment dispute. Trusted by x402 payment platforms.
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
                onClick={() => window.location.href = 'https://www.x402disputes.com/sign-in/'}
              >
                <Key className="mr-2 h-5 w-5" />
                Sign Up Your Agent
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
              onClick={() => window.location.href = 'https://docs.x402disputes.com'}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              View Documentation
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
              <span><strong className="text-white">x402 compatible</strong></span>
            </div>
          </AnimatedList>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  )
}
