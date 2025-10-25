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
      <section className="pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
              Infrastructure Model
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              Dispute Resolution{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Infrastructure
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              You judge, we provide the tools. 95% automation + your domain expertise.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Fully{" "}
              <a 
                href="https://github.com/consulatehq/agentic-dispute-protocol" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
              >
                ADP-compliant
                <ExternalLink className="h-3 w-3" />
              </a>
              {" "}per{" "}
              <a 
                href="https://github.com/consulatehq/agentic-dispute-protocol" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline"
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
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Three simple steps from dispute to resolution. Your team stays in control.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Disputes Come In</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Via webhook, API, or dashboard. From ACP, ATXP, or any payment protocol. 
                Regulation E compliant from day one.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. AI Analyzes (95%)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pattern matching + precedent learning. High-confidence cases auto-resolved 
                in under 5 minutes. ADP chain of custody maintained.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. You Review (5%)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complex or low-confidence cases routed to YOUR team. You have the 
                context. You make the final call. AI learns from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Start small, scale infinitely. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl mb-6">Starter</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">$99</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    For small businesses and startups
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/demo'}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>First 1,000 disputes</strong> included
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      AI-powered analysis (95% auto)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Review queue for YOUR team
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Full API + webhooks
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Regulation E compliance tools
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Dashboard + analytics
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Additional disputes: <strong className="text-slate-900 dark:text-slate-100">$0.08 each</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Growth (Popular) */}
            <Card className="border-4 border-purple-600 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl mb-6">Growth</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">$299</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    For growing platforms
                  </p>
                </div>
                
                <Button 
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = '/demo'}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>First 5,000 disputes</strong> included
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Everything in Starter
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Custom rules engine</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Priority support</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Team collaboration</strong> (5 users)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Advanced analytics</strong>
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Additional disputes: <strong className="text-slate-900 dark:text-slate-100">$0.05 each</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Enterprise */}
            <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl mb-6">Enterprise</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    For large-scale operations
                  </p>
                </div>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full"
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
                    <span className="text-sm">
                      Everything in Growth
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>White-label option</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Custom integrations</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>SLA guarantees</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Dedicated support</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      <strong>Unlimited team members</strong>
                    </span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Volume discounts at <strong>100K+ disputes/mo</strong>
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
            <h2 className="text-3xl font-bold mb-4">ROI Calculator</h2>
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
            <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">With Consulate Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Cost per dispute:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">$0.05-0.08</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time to resolution:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">&lt; 5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regulation E compliance:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">Built-in</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scalability:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">Infinite (software)</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-green-200 dark:border-green-900">
                    <span className="font-bold">10,000 disputes/mo:</span>
                    <span className="font-bold text-green-700 dark:text-green-300 text-lg">$819</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 px-6 py-4 rounded-lg">
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                99.6% Cost Reduction
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
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                Who makes the final decision on disputes?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                YOU do. Your team reviews all cases that need human judgment (typically 5%). 
                Consulate provides AI recommendations based on historical patterns, but you have 
                the final say. This is the <strong>Infrastructure Model</strong> - we provide tools, 
                you make decisions.
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                What if I don&apos;t have a team to review disputes?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                With 95% automation, you&apos;ll only need someone for ~5% of disputes. For a business 
                with 1,000 disputes/month, that&apos;s just 50 reviews (~2-3 hours of work). Even a 
                single person can handle it. If you truly need zero-touch, contact us about our 
                premium full-service option.
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                How does the AI learn from my decisions?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                When you approve or override AI recommendations, we feed that back into the pattern 
                matching system. Over time, the AI learns your preferences, industry nuances, and 
                edge cases specific to your business. Your overrides become training data that 
                improves accuracy for YOUR disputes.
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                Is this Regulation E compliant?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                Yes. Consulate provides the workflow, logging, and timeline management required by 
                Regulation E. YOU remain the decision-maker (as required by law for consumer 
                protection), we just make the process automated, compliant, and trackable.
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                What about disputes for physical goods (like broken bottles)?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                Perfect use case! You have the domain expertise (shipping history, customer patterns, 
                fraud indicators, packaging standards) that generic arbitration services lack. The AI 
                provides pattern matching (&quot;broken glass disputes ruled X% for customer&quot;), you provide 
                the context (&quot;but this customer has 3 disputes this month&quot;). Together, you make better 
                decisions faster.
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                Is this compatible with the Agentic Dispute Protocol (ADP)?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                Yes, 100% ADP-compliant. All disputes maintain cryptographic chain of custody, evidence 
                follows the ADP Evidence Message format, and rulings use the ADP Award Message structure. 
                Learn more at{" "}
                <a 
                  href="https://github.com/consulatehq/agentic-dispute-protocol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  github.com/consulatehq/agentic-dispute-protocol
                </a>
              </p>
            </details>
            
            <details className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <summary className="font-semibold cursor-pointer text-slate-900 dark:text-slate-100 hover:text-purple-600">
                Can I integrate with ACP/ATXP payment protocols?
              </summary>
              <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
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
