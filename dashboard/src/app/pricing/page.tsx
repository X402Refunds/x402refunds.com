"use client"

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
              All plans include AI resolution + your review queue. Per-dispute fees apply separately.
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
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
                  onClick={() => window.location.href = 'https://www.x402disputes.com/sign-in/'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Basic AI judge + human review queue
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Precedent learning from your decisions
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Full API + webhooks
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Up to 5 team members
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Resolution in &lt; 10 minutes
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
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
            </motion.div>

            {/* Growth (Popular) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-4 border-emerald-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                  onClick={() => window.location.href = 'https://www.x402disputes.com/sign-in/'}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Everything in Starter
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Custom terms and conditions knowledge base</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Privacy policy judgments</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Advanced analytics + exports
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Up to 15 team members
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Resolution in &lt; 10 minutes
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
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
                  onClick={() => window.location.href = 'mailto:sales@x402disputes.com'}
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
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Per-Dispute Fees */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
              Resolution Pricing
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Per-Dispute Resolution Fees
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Paid separately, in addition to platform access. Simple flat pricing for all disputes.
            </p>
          </div>

          <div className="flex justify-center max-w-2xl mx-auto">
            {/* Flat Fee Card */}
            <Card className="border-4 border-emerald-600 shadow-xl bg-white dark:bg-slate-900 w-full max-w-md">
              <CardHeader className="pb-6 text-center">
                <Badge className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 mx-auto w-fit">All Disputes</Badge>
                <CardTitle className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2">$0.05</CardTitle>
                <p className="text-lg text-slate-600 dark:text-slate-400">per dispute</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                      No tiers. No complexity.
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Same price whether it&apos;s $0.50 or $5,000
                    </p>
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        95% auto-resolved in &lt; 10 minutes
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Cryptographic evidence verification
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Regulation E compliant
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Full chain of custody tracking
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Example: A $0.50 transaction dispute costs <strong>$0.05</strong>. A $500 transaction also costs <strong>$0.05</strong>. Simple.
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
              Three simple steps from dispute to resolution. Your team stays in control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Disputes Come In</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Via webhook, API, or dashboard. From ACP, ATXP, or any payment protocol.
                Regulation E compliant from day one.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">2. AI Analyzes (95%)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pattern matching + precedent learning. High-confidence cases auto-resolved
                in under 10 minutes. ADP chain of custody maintained.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
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

      {/* ROI Calculator */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              ROI Calculator
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              See how much you save vs traditional dispute resolution
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white dark:bg-slate-950 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                  <th className="text-left py-6 px-6 text-slate-900 dark:text-slate-100 font-semibold">Feature</th>
                  <th className="py-6 px-8 bg-emerald-50 dark:bg-emerald-950 border-l-4 border-r-4 border-emerald-600">
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-wide">
                      Consulate
                    </div>
                  </th>
                  <th className="py-6 px-6 text-slate-900 dark:text-slate-100 font-semibold">Traditional Arbitration</th>
                </tr>
              </thead>
              <tbody>
                {/* Cost per dispute */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Cost per dispute</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Average handling cost</div>
                  </td>
                  <td className="py-5 px-8 bg-emerald-50 dark:bg-emerald-950 border-l-4 border-r-4 border-emerald-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-emerald-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">$0.05</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">$50-$200</span>
                  </td>
                </tr>

                {/* Resolution time */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Resolution time</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Time to final decision</div>
                  </td>
                  <td className="py-5 px-8 bg-emerald-50 dark:bg-emerald-950 border-l-4 border-r-4 border-emerald-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-emerald-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">&lt; 10 minutes</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">14-30 days</span>
                  </td>
                </tr>

                {/* Your team stays in control */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Your team makes decisions</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Final authority on edge cases</div>
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

                {/* Regulation E compliance */}
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Regulation E compliance</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Consumer protection built-in</div>
                  </td>
                  <td className="py-5 px-8 bg-emerald-50 dark:bg-emerald-950 border-l-4 border-r-4 border-emerald-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-emerald-600 mr-2 flex-shrink-0" />
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Automated</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-slate-600 dark:text-slate-400">Varies</span>
                  </td>
                </tr>

                {/* Scalability */}
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-5 px-6">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Scalability</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Handle volume spikes</div>
                  </td>
                  <td className="py-5 px-8 bg-emerald-50 dark:bg-emerald-950 border-l-4 border-r-4 border-emerald-600">
                    <div className="flex items-center justify-center">
                      <Check className="h-7 w-7 text-emerald-600 mr-2 flex-shrink-0" />
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
                    <div className="font-bold text-slate-900 dark:text-slate-100">10,000 disputes/month</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total monthly cost</div>
                  </td>
                  <td className="py-6 px-8 bg-emerald-100 dark:bg-emerald-900 border-l-4 border-r-4 border-emerald-600">
                    <div className="text-center">
                      <div className="text-3xl font-black text-emerald-600">$249</div>
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
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                Who makes the final decision on disputes?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                YOU do. Your team reviews all cases that need human judgment (typically 5%).
                Consulate provides AI recommendations based on historical patterns, but you have
                the final say. This is the <strong>Infrastructure Model</strong> - we provide tools,
                you make decisions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                What&apos;s included in the platform fee?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                The platform fee ($0 or $249/month) covers: API access, review queue dashboard, team collaboration,
                precedent AI, webhooks, and support. Dispute resolution fees are separate - a flat $0.05 per dispute
                regardless of transaction amount.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                How does the AI learn from my decisions?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                When you approve or override AI recommendations, we feed that back into the pattern
                matching system. Over time, the AI learns your preferences, industry nuances, and
                edge cases specific to your business. Your overrides become training data that
                improves accuracy for YOUR disputes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                Is this Regulation E compliant?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Yes. Consulate provides the workflow, logging, and timeline management required by
                Regulation E. YOU remain the decision-maker (as required by law for consumer
                protection), we just make the process automated, compliant, and trackable.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                What&apos;s the difference between Starter and Growth?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Growth adds <strong>custom terms and conditions knowledge base</strong> (judges use your T&amp;C for decisions),
                <strong>privacy policy judgments</strong> (privacy-focused dispute resolution), advanced analytics, and more team members (15 vs 5).
                Both have the same per-dispute fees and resolution time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                Is this compatible with the Agentic Dispute Protocol (ADP)?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600">
                Can I integrate with ACP/ATXP payment protocols?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                Absolutely. We have native support for both Agentic Commerce Protocol (ACP) and ATXP.
                Simply configure our webhook endpoint in your payment processor, and disputes will flow
                automatically. API documentation available in the dashboard.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  )
}
