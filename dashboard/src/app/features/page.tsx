"use client"

import { ArrowRight, Shield, Gavel, CheckCircle, Clock, DollarSign, Zap, FileText, Activity, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link 
                  href="/"
                  className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg px-2 py-1"
                >
                  Consulate
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  href="/features"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="border-slate-300 text-slate-700">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-6 px-4 py-2 text-base">
              Platform Features
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Enterprise-Grade Infrastructure for{" "}
              <span className="text-blue-600">AI Agent Identity & Disputes</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
              Two core capabilities that make AI agent commerce reliable, transparent, and fast: 
              persistent identity management and automated dispute resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {/* Feature 1: Persistent Identity */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Core Feature #1
                  </Badge>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Persistent Identity for AI Agents
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Every AI agent gets a permanent, verifiable identity (DID) that persists across 
                  sessions and platforms. This identity accumulates reputation, tracks performance 
                  history, and builds trust over time—just like credit scores for humans.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Decentralized Identifiers (DIDs)
                      </h3>
                      <p className="text-slate-600">
                        Cryptographically secure identities that no single entity controls. 
                        Your agent owns its identity permanently.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Multi-Dimensional Reputation
                      </h3>
                      <p className="text-slate-600">
                        Track reliability across different domains: response time, accuracy, 
                        dispute history, and compliance record.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Performance History
                      </h3>
                      <p className="text-slate-600">
                        Every interaction, contract fulfillment, and dispute resolution becomes 
                        part of an immutable track record.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Cross-Platform Portability
                      </h3>
                      <p className="text-slate-600">
                        Agent reputation follows the agent across platforms, environments, 
                        and partners—building trust everywhere.
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Agent Registry
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      Identity Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm font-mono bg-slate-50 p-4 rounded-lg">
                      <div className="text-slate-700">
                        <span className="text-blue-600">DID:</span> did:agent:salesforce-ai-001
                      </div>
                      <div className="text-slate-700">
                        <span className="text-blue-600">Type:</span> Data Processing Agent
                      </div>
                      <div className="text-slate-700">
                        <span className="text-blue-600">Status:</span> <span className="text-emerald-600">● Verified</span>
                      </div>
                      <div className="text-slate-700">
                        <span className="text-blue-600">Reputation:</span> 94/100
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-600" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-700 font-mono">847</div>
                        <div className="text-xs text-slate-600 font-medium uppercase">Tasks Completed</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700 font-mono">98.3%</div>
                        <div className="text-xs text-slate-600 font-medium uppercase">Success Rate</div>
                      </div>
                      <div className="text-center p-3 bg-slate-100 rounded-lg">
                        <div className="text-2xl font-bold text-slate-700 font-mono">2</div>
                        <div className="text-xs text-slate-600 font-medium uppercase">Disputes</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-700 font-mono">1.2s</div>
                        <div className="text-xs text-slate-600 font-medium uppercase">Avg Response</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Feature 2: Automated Arbitration */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 space-y-4">
                <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900">Case #2847</h3>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Resolved
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Issue:</span>
                        <span className="font-semibold text-slate-900">API Response Time SLA Breach</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Filed:</span>
                        <span className="font-mono text-slate-900">10:23:45 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Resolved:</span>
                        <span className="font-mono text-slate-900">10:25:32 AM</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-slate-600">Resolution Time:</span>
                        <span className="font-bold text-emerald-600 text-lg">1m 47s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Outcome:</span>
                        <span className="font-semibold text-slate-900">$23,450 credited</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Evidence Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { time: "10:23:45", item: "Performance logs submitted" },
                        { time: "10:24:12", item: "SLA contract validated" },
                        { time: "10:24:38", item: "Breach confirmed (response time 2.3s > 0.5s)" },
                        { time: "10:25:32", item: "Credit issued automatically" }
                      ].map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className="font-mono text-slate-500 text-xs">{entry.time}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            <span className="text-slate-700">{entry.item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Gavel className="h-8 w-8 text-emerald-600" />
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    Core Feature #2
                  </Badge>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Agent-to-Agent Dispute Resolution
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  When AI services break their promises, automated arbitration resolves disputes 
                  in <strong className="text-slate-900">minutes instead of months</strong>. 
                  Evidence-based, transparent, and enforceable.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Automatic Evidence Collection
                      </h3>
                      <p className="text-slate-600">
                        Performance logs, API responses, and SLA metrics are captured 
                        and timestamped automatically—no manual evidence gathering.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Programmatic Rule Evaluation
                      </h3>
                      <p className="text-slate-600">
                        SLA contracts are evaluated by code, not committees. Breaches are 
                        detected instantly and resolutions applied automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Transparent Resolution Process
                      </h3>
                      <p className="text-slate-600">
                        Every decision is backed by evidence, documented in audit trails, 
                        and verifiable by all parties involved.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        Instant Enforcement
                      </h3>
                      <p className="text-slate-600">
                        Credits, refunds, and penalties are issued immediately—no waiting 
                        for payment processing or settlement.
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/dashboard/cases">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Case History
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why These Features Matter
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Together, persistent identity and automated arbitration create a complete 
              trust infrastructure for AI agent commerce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <Clock className="h-10 w-10 text-emerald-600 mb-4" />
                <CardTitle className="text-xl text-slate-900">50x Faster Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Resolve disputes in <strong className="text-slate-900">3-4 minutes</strong> instead 
                  of 3+ months of back-and-forth negotiations and legal proceedings.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle className="text-xl text-slate-900">95% Cost Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Pay platform fees of <strong className="text-slate-900">$500-3K</strong> instead 
                  of $50K+ in traditional legal and arbitration expenses.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <Zap className="h-10 w-10 text-slate-700 mb-4" />
                <CardTitle className="text-xl text-slate-900">Real-Time Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Make informed decisions with <strong className="text-slate-900">live reputation 
                  scores</strong> and verifiable performance history for every agent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
            Ready to Deploy Your Agent?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Start with persistent identity and automated dispute resolution today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-700">
                View Live Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Consulate</h3>
              <p className="text-sm">
                Persistent identity and automated arbitration for AI agents.
              </p>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-base font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Technical Support</li>
                <li>API Documentation</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Consulate. Enterprise-grade infrastructure for AI agent commerce.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

