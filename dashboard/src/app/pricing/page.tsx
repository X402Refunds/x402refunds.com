"use client"

import { ArrowRight, Check, Webhook, Bot, User, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navigation currentPage="pricing" />

      {/* Hero Section */}
      <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
              Payment Dispute Infrastructure
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              Resolve Payment Disputes in{" "}
              <span className="text-blue-600 border-b-4 border-blue-600">
                Minutes
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Platform access + per-dispute fees. 95% AI automation + your review queue.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Fully{" "}
              <a
                href="https://github.com/consulatehq/agentic-dispute-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                ADP-compliant
                <ExternalLink className="h-3 w-3" />
              </a>
              {" "}per{" "}
              <a
                href="https://github.com/consulatehq/agentic-dispute-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Agentic Dispute Protocol
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Three simple steps from dispute to resolution. Your team stays in control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Disputes Come In</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Via webhook, API, or dashboard. From ACP, ATXP, or any payment protocol.
                Regulation E compliant from day one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">2. AI Analyzes (95%)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pattern matching + precedent learning. High-confidence cases auto-resolved
                in under 10 minutes. ADP chain of custody maintained.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">3. You Review (5%)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complex or low-confidence cases routed to YOUR team. You have the
                context. You make the final call. AI learns from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Per-Dispute Fees */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
              Per-Dispute Fees
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Resolution Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Tiered pricing based on transaction amount. Paid separately from platform access.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {/* Micro Tier */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm bg-white dark:bg-slate-900 transition-colors">
              <CardHeader className="pb-3">
                <Badge className="mb-2 bg-blue-50 text-blue-700 border-blue-200 w-fit">Micro</Badge>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">$0.10</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transactions &lt; $1</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>20k tokens included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>$0.01 per 1k tokens over</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Small Tier */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm bg-white dark:bg-slate-900 transition-colors">
              <CardHeader className="pb-3">
                <Badge className="mb-2 bg-blue-50 text-blue-700 border-blue-200 w-fit">Small</Badge>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">$0.25</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">$1 - $10</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>20k tokens included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>$0.01 per 1k tokens over</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medium Tier */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm bg-white dark:bg-slate-900 transition-colors">
              <CardHeader className="pb-3">
                <Badge className="mb-2 bg-blue-50 text-blue-700 border-blue-200 w-fit">Medium</Badge>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">$1.00</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">$10 - $100</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>20k tokens included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>$0.01 per 1k tokens over</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Large Tier */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm bg-white dark:bg-slate-900 transition-colors">
              <CardHeader className="pb-3">
                <Badge className="mb-2 bg-blue-50 text-blue-700 border-blue-200 w-fit">Large</Badge>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">$5.00</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">$100 - $1,000</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>20k tokens included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>$0.01 per 1k tokens over</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm bg-white dark:bg-slate-900 transition-colors">
              <CardHeader className="pb-3">
                <Badge className="mb-2 bg-slate-900 text-white border-0 w-fit">Enterprise</Badge>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">$25.00</CardTitle>
                <p className="text-xs text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">&gt; $1,000</p>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-slate-700 mt-0.5 flex-shrink-0" />
                      <span>20k tokens included</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check className="h-3 w-3 text-slate-700 mt-0.5 flex-shrink-0" />
                      <span>$0.01 per 1k tokens over</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Example: A $0.05 transaction dispute costs <strong>$0.10</strong> (micro tier). A $500 transaction costs <strong>$5.00</strong> (large tier).
            </p>
          </div>
        </div>
      </section>

      {/* Platform Access Plans */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Platform Access
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Platform Plans</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose your platform tier. All plans include AI resolution + your review queue. Per-dispute fees apply separately.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm transition-colors">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Starter</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">$249</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    Platform access fee
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => window.location.href = '/demo'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Basic AI judge + human review queue
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Precedent learning from your decisions
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Full API + webhooks
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Up to 5 team members
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Resolution in &lt; 10 minutes
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Priority email support
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-100">No disputes included.</strong> Pay per-dispute fees separately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth (Popular) */}
            <Card className="border-4 border-blue-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Growth</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">$999</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    Platform access fee
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = '/demo'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Everything in Starter
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Custom judge system prompts</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Custom domain</strong> (disputes.yourbrand.com)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Advanced analytics + exports
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Up to 15 team members
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Resolution in &lt; 10 minutes
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Priority support (4hr SLA)
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-100">No disputes included.</strong> Pay per-dispute fees separately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm transition-colors">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Enterprise</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">Custom</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    For large-scale operations
                  </p>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => window.location.href = 'mailto:sales@consulatehq.com'}
                >
                  Contact Sales
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Everything in Growth
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Self-hosted deployment option</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Full white-label</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Dedicated infrastructure</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>24/7 support + account manager</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Unlimited team members
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-900 dark:text-slate-100">Volume discounts:</strong> 40-70% off per-dispute fees at 100K+ disputes/month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">ROI Calculator</h2>
            <p className="text-slate-600 dark:text-slate-400">
              See how much you save vs traditional dispute resolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional */}
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-100">Traditional Manual Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Labor cost per dispute:</span>
                    <span className="font-semibold text-red-700 dark:text-red-300">$20-50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to resolution:</span>
                    <span className="font-semibold text-red-700 dark:text-red-300">5-10 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regulation E compliance:</span>
                    <span className="font-semibold text-red-700 dark:text-red-300">Manual tracking</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scalability:</span>
                    <span className="font-semibold text-red-700 dark:text-red-300">Limited by headcount</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-red-200 dark:border-red-900">
                    <span className="font-bold">10,000 disputes/mo:</span>
                    <span className="font-bold text-red-700 dark:text-red-300 text-lg">$200K-500K</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* With Consulate */}
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950">
              <CardHeader>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">With Consulate Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Cost per dispute:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">$0.10-25.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to resolution:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">&lt; 10 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regulation E compliance:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Built-in</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scalability:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Infinite (software)</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-emerald-200 dark:border-emerald-900">
                    <span className="font-bold">10,000 disputes/mo:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">$1,249</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-800 dark:to-blue-900 px-6 py-4 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                99.5% Cost Reduction
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Same compliance, better experience, your control
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Who makes the final decision on disputes?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                YOU do. Your team reviews all cases that need human judgment (typically 5%).
                Consulate provides AI recommendations based on historical patterns, but you have
                the final say. This is the <strong>Infrastructure Model</strong> - we provide tools,
                you make decisions.
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                What&apos;s included in the platform fee?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                The platform fee ($249 or $999/month) covers: API access, review queue dashboard, team collaboration,
                precedent AI, webhooks, and support. Dispute resolution fees are separate - you pay per dispute based
                on transaction value ($0.10 for micro, up to $25.00 for enterprise).
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                How does the AI learn from my decisions?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                When you approve or override AI recommendations, we feed that back into the pattern
                matching system. Over time, the AI learns your preferences, industry nuances, and
                edge cases specific to your business. Your overrides become training data that
                improves accuracy for YOUR disputes.
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Is this Regulation E compliant?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Yes. Consulate provides the workflow, logging, and timeline management required by
                Regulation E. YOU remain the decision-maker (as required by law for consumer
                protection), we just make the process automated, compliant, and trackable.
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                What&apos;s the difference between Starter and Growth?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Growth adds <strong>custom judge system prompts</strong> (define your own dispute resolution logic),
                <strong>custom domain</strong> (disputes.yourbrand.com), advanced analytics, and more team members (15 vs 5).
                Both have the same per-dispute fees and resolution time.
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Is this compatible with the Agentic Dispute Protocol (ADP)?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Yes, 100% ADP-compliant. All disputes maintain cryptographic chain of custody, evidence
                follows the ADP Evidence Message format, and rulings use the ADP Award Message structure.
                Learn more at{" "}
                <a
                  href="https://github.com/consulatehq/agentic-dispute-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  github.com/consulatehq/agentic-dispute-protocol
                </a>
              </p>
            </details>

            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Can I integrate with ACP/ATXP payment protocols?
              </summary>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Absolutely. We have native support for both Agentic Commerce Protocol (ACP) and ATXP.
                Simply configure our webhook endpoint in your payment processor, and disputes will flow
                automatically. API documentation available in the dashboard.
              </p>
            </details>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
