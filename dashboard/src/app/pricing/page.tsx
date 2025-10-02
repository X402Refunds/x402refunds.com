"use client"

import { ArrowRight, Check, Shield, Zap, Lock, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PricingPage() {
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
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
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
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Start with{" "}
              <span className="text-blue-600">1 agent</span>
              {" "}or scale to thousands
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
              Choose a plan that fits your needs. All plans include persistent agent identity, 
              automated dispute resolution, and full API access. No hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Tier */}
            <Card className="border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl text-slate-900">Starter</CardTitle>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Perfect for Testing
                  </Badge>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 font-mono">$99</span>
                    <span className="text-slate-600 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Everything you need to get started
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">1 agent</strong> with persistent DID identity
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">5 disputes</strong> per month
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Automated arbitration in <strong className="text-slate-900">minutes</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Reputation tracking & performance history
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Full API access with documentation
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Community support & knowledge base
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Dashboard access & real-time monitoring
                    </span>
                  </div>
                </div>

                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-xs text-slate-500 mt-4 text-center">
                  Perfect for individual developers and early-stage projects
                </p>
              </CardContent>
            </Card>

            {/* Pro Tier - Featured */}
            <Card className="border-2 border-blue-600 shadow-lg relative">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-blue-600 text-white border-blue-600 px-4 py-1 text-sm font-semibold shadow-md">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl text-slate-900">Pro</CardTitle>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    Best Value
                  </Badge>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 font-mono">$499</span>
                    <span className="text-slate-600 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    For growing teams and production deployments
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">20 agents</strong> with persistent identities
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">100 disputes</strong> per month
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Everything in Starter, plus:
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">Priority dispute resolution</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Advanced reputation analytics & insights
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Email & chat support (24-hour response)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      SLA contract templates & automation
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Performance monitoring & breach alerts
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Service discovery & agent marketplace
                    </span>
                  </div>
                </div>

                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Start Pro Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-xs text-slate-500 mt-4 text-center">
                  14-day free trial • No credit card required
                </p>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl text-slate-900">Enterprise</CardTitle>
                  <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                    Custom
                  </Badge>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">Contact Us</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Custom solutions for large-scale deployments
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">Unlimited agents</strong> and disputes
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Everything in Pro, plus:
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">Dedicated CTO support</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Custom SLA & compliance requirements
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Multi-region & sovereign deployment options
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      White-label branding & custom UI
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      SSO, advanced security & audit logs
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Custom integrations & webhook automation
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Dedicated infrastructure & 99.99% uptime SLA
                    </span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => window.location.href = 'mailto:cto@consulatehq.com?subject=Enterprise%20Inquiry'}
                >
                  Contact CTO
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-slate-500 mt-4 text-center">
                  Custom pricing based on your specific needs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Comparison Note */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              All plans include full API access, cryptographic evidence, and automated arbitration
            </p>
            <p className="text-sm text-slate-500">
              Need more disputes? Additional dispute credits available at $15 per dispute
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-lg text-slate-600">
              Detailed feature comparison across all tiers
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-slate-700">Active Agents</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-900">1</td>
                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-semibold">20</td>
                  <td className="px-6 py-4 text-center text-slate-900">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Monthly Disputes</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-900">5</td>
                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-semibold">100</td>
                  <td className="px-6 py-4 text-center text-slate-900">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Resolution Time</td>
                  <td className="px-6 py-4 text-center text-slate-900">~3-5 min</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-semibold">~1-2 min</td>
                  <td className="px-6 py-4 text-center text-slate-900">&lt;1 min</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">API Access</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Reputation Tracking</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">SLA Templates</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Priority Support</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Custom Integrations</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">White-Label Options</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">CTO Support</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-emerald-600 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h2>
            <p className="text-lg text-slate-600">
              Built for reliability, security, and compliance from day one
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">SOC 2 Compliant</h3>
              <p className="text-sm text-slate-600">
                Enterprise security standards and audit trails
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-emerald-100 rounded-lg">
                  <Lock className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-slate-600">
                All data encrypted in transit and at rest
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <Globe className="h-8 w-8 text-slate-700" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">GDPR Ready</h3>
              <p className="text-sm text-slate-600">
                Full compliance with international data regulations
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-amber-100 rounded-lg">
                  <Zap className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">99.9% Uptime</h3>
              <p className="text-sm text-slate-600">
                Reliable infrastructure you can depend on
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">What happens if I exceed my plan limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Additional disputes beyond your monthly limit are charged at $15 per dispute. 
                  We&apos;ll notify you when you&apos;re approaching your limit, and you can upgrade anytime 
                  to a higher tier for better value.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                  immediately, and we&apos;ll prorate the billing accordingly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Pro tier includes a 14-day free trial with no credit card required. Starter tier 
                  is our most affordable option for getting started quickly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">What&apos;s included in CTO support for Enterprise?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Enterprise customers get direct access to our CTO for architecture reviews, 
                  integration planning, custom development, and strategic guidance. Includes 
                  priority response within 4 hours for critical issues.
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
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join the platform resolving AI agent disputes in minutes, not months
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Start with Pro Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-300 text-slate-700"
              onClick={() => window.location.href = 'mailto:cto@consulatehq.com?subject=Enterprise%20Inquiry'}
            >
              Talk to CTO
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Questions? Email us at{" "}
            <a href="mailto:hello@consulatehq.com" className="text-blue-600 hover:text-blue-700 underline">
              hello@consulatehq.com
            </a>
          </p>
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

