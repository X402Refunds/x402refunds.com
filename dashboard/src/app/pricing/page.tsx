"use client"

export const dynamic = 'force-dynamic'

import { ArrowRight, Check, Webhook, Bot, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { motion } from "framer-motion"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navigation currentPage="pricing" />

      {/* Platform Access Plans */}
      <section className="py-12 sm:py-16 lg:py-20">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge variant="outline" className="mb-4">
              Platform Access Plans
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Choose Your Platform Tier
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              All plans include refund request intake + your review queue. Per-request fees apply separately.
            </p>
          </motion.div>

          <motion.div 
            className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-2 border-slate-200 hover:border-blue-300 shadow-sm transition-colors">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Starter</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">$0</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    Platform access fee
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => window.location.href = '/sign-in/'}
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
                      Refund request review queue
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Clear status trail for each request
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Full API
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
                      Fast processing for straightforward requests
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
                      <strong className="text-slate-900 dark:text-slate-100">No requests included.</strong> Pay per-refund-request fees separately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Growth (Popular) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-4 border-blue-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Growth</CardTitle>
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
                  className="w-full"
                  onClick={() => window.location.href = '/sign-in/'}
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
                      <strong>Custom terms and conditions knowledge base</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Privacy policy judgments</strong>
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
                      Fast processing for straightforward requests
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
                      <strong className="text-slate-900 dark:text-slate-100">No requests included.</strong> Pay per-refund-request fees separately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
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
                  onClick={() => window.location.href = 'mailto:sales@x402refunds.com'}
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
                      <strong className="text-slate-900 dark:text-slate-100">Volume discounts:</strong> Available for high request volume (contact sales)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Per-Request Fees */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
              Request Pricing
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Per-Refund-Request Fees
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Paid separately, in addition to platform access. Simple flat pricing for all refund requests.
            </p>
          </div>

          <div className="flex justify-center max-w-2xl mx-auto">
            {/* Flat Fee Card */}
            <Card className="border-4 border-blue-600 shadow-xl bg-white dark:bg-slate-900 w-full max-w-md">
              <CardHeader className="pb-6 text-center">
                <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200 mx-auto w-fit">All Requests</Badge>
                <CardTitle className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2">$0.05</CardTitle>
                <p className="text-lg text-slate-600 dark:text-slate-400">per refund request</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      No tiers. No complexity.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Same price whether it&apos;s $0.50 or $5,000
                    </p>
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Direct refund requests (permissionless)
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Optional supporting evidence
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Clear audit trail
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Status tracking from request → outcome
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Example: A $0.50 transaction refund request costs <strong>$0.05</strong>. A $500 transaction also costs <strong>$0.05</strong>. Simple.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Three simple steps from request to outcome. Your team stays in control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Refund Requests Come In</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Via API or dashboard. From your payment flow, webhook, or internal tooling.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">2. Evidence Review</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Transaction hashes validated. Supporting evidence reviewed when provided.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">3. Approval & Processing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your team approves or rejects the request. Track processing status and outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              ROI Calculator
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              See how much you save vs manual refund handling
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-slate-950 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                  <th className="text-left py-6 px-6 text-slate-900 dark:text-slate-100 font-semibold">Feature</th>
                  <th className="py-6 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-wide">
                      X402Refunds
                    </div>
                  </th>
                  <th className="py-6 px-6 text-slate-900 dark:text-slate-100 font-semibold">Manual Refund Handling</th>
                </tr>
              </thead>
              <tbody>
                {/* Cost per request */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Cost per request</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Average handling cost</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">$0.05</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">$50-$200</span>
                  </td>
                </tr>

                {/* Processing time */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Processing time</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Time to outcome</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">&lt; 10 minutes</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">Depends on your process</span>
                  </td>
                </tr>

                {/* Your team stays in control */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Your team stays in control</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Approve or reject requests</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600" />
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex items-center justify-center text-slate-400 text-2xl">×</div>
                  </td>
                </tr>

                {/* Audit trail */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Audit trail</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Status + decision history</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Built-in</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">Inconsistent</span>
                  </td>
                </tr>

                {/* Scalability */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Scalability</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Handle volume spikes</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Infinite</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">Limited by panel</span>
                  </td>
                </tr>

                {/* AI learning */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">AI learns from your decisions</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Continuous improvement</div>
                  </td>
                  <td className="py-5 px-8 bg-blue-50 dark:bg-blue-950 border-l-4 border-r-4 border-blue-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-blue-600" />
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex items-center justify-center text-slate-400 text-2xl">×</div>
                  </td>
                </tr>

                {/* Total cost comparison */}
                <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="py-6 px-6">
                    <div className="font-bold text-slate-900 dark:text-slate-100">10,000 requests/month</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total monthly cost</div>
                  </td>
                  <td className="py-6 px-8 bg-blue-100 dark:bg-blue-900 border-l-4 border-r-4 border-blue-600">
                    <div className="text-center">
                      <div className="text-3xl font-black text-blue-600">$249</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">99.9% cost reduction</div>
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">$500K-$2M</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Who makes the final decision on refund requests?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                You do. Your team reviews requests and makes the final call.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                What&apos;s included in the platform fee?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                The platform fee covers API access, the refund request review queue, team collaboration, and support.
                Refund request fees are separate: a flat $0.05 per request regardless of transaction amount.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                How does the AI learn from my decisions?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Over time, we can incorporate your review outcomes to improve suggestions and triage for your workflow.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Do you support compliance workflows?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                We provide workflow, logging, and a clear audit trail. You remain the decision-maker.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                What&apos;s the difference between Starter and Growth?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Growth adds advanced analytics, exports, and more team members (15 vs 5).
                Both have the same per-refund-request fee.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Is this compatible with X-402 payments?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Yes. Refund requests are tied to X-402 payment proof (e.g. transaction hashes) and are trackable via API.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                Can I integrate with ACP/ATXP payment protocols?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Absolutely. We have native support for both Agentic Commerce Protocol (ACP) and ATXP.
                Configure the integration in your payment processor, and refund requests will flow automatically.
                API documentation is available in the dashboard.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  )
}
