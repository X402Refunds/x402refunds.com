"use client"

import { ArrowRight, Check, Shield, Zap, Lock, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Start with{" "}
              <span className="text-blue-600">1 agent</span>
              {" "}or scale to thousands
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              All plans include persistent agent identity, automated dispute resolution, and full API access.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-slate-900 mb-6">Free</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 font-mono">$0</span>
                    <span className="text-slate-600 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 mb-4">
                    For individuals and small projects
                  </p>
                </div>
                
                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">1 agent</strong> with persistent identity
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">30 disputes</strong> per month
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Automated arbitration
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Reputation tracking
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Full API access
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Dashboard & monitoring
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Community support
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="border-2 border-blue-600 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-slate-900 mb-6">Pro</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 font-mono">$149</span>
                    <span className="text-slate-600 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 mb-4">
                    For teams that need scale
                  </p>
                </div>

                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      <strong className="text-slate-900">10 agents</strong>
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
                      Everything in Free, plus:
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Priority resolution (&lt; 2 min)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Email support (24hr response)
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      SLA templates
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Performance monitoring
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Advanced analytics
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="border-2 border-slate-200 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-slate-900 mb-6">Enterprise</CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">Custom</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 mb-4">
                    For companies with serious scale
                  </p>
                </div>

                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => window.location.href = 'tel:+1-781-747-0041'}
                >
                  Call CTO Directly
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  or email vivek@consulatehq.com
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Everything in Pro, plus:
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Dedicated CTO support
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Custom compliance
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Multi-region deployment
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      White-label options
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      SSO & advanced security
                    </span>
                  </div>
                  <div className="flex items-start gap-3 pl-6">
                    <Check className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      99.99% uptime SLA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simple note */}
          <div className="mt-12 text-center">
            <p className="text-slate-600">
              Need more disputes? Additional credits available at $15 per dispute.
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Free</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-slate-700">Agents</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-900">1</td>
                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-semibold">10</td>
                  <td className="px-6 py-4 text-center text-slate-900">Custom</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Disputes/month</td>
                  <td className="px-6 py-4 text-center font-mono text-slate-900">30</td>
                  <td className="px-6 py-4 text-center font-mono text-blue-600 font-semibold">100</td>
                  <td className="px-6 py-4 text-center text-slate-900">Custom</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Resolution time</td>
                  <td className="px-6 py-4 text-center text-slate-900">~3-5 min</td>
                  <td className="px-6 py-4 text-center text-blue-600 font-semibold">&lt;2 min</td>
                  <td className="px-6 py-4 text-center text-slate-900">&lt;1 min</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">API access</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Reputation tracking</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">SLA templates</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Email support</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-blue-600 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">Custom compliance</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">White-label</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-slate-700">CTO support</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center text-slate-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="h-5 w-5 text-slate-700 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Simplified */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">SOC 2</h3>
              <p className="text-sm text-slate-600">Enterprise security</p>
            </div>

            <div>
              <div className="flex justify-center mb-4">
                <Lock className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Encrypted</h3>
              <p className="text-sm text-slate-600">End-to-end encryption</p>
            </div>

            <div>
              <div className="flex justify-center mb-4">
                <Globe className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">GDPR</h3>
              <p className="text-sm text-slate-600">Compliant globally</p>
            </div>

            <div>
              <div className="flex justify-center mb-4">
                <Zap className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">99.9% Uptime</h3>
              <p className="text-sm text-slate-600">Always available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple FAQ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Questions
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">What if I go over my limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Additional disputes are $15 each. We&apos;ll notify you when you&apos;re close to your limit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Can I change plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes. Upgrade or downgrade anytime. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">How does Enterprise pricing work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Email the CTO at{" "}
                  <a href="mailto:cto@consulatehq.com" className="text-blue-600 hover:text-blue-700 underline">
                    cto@consulatehq.com
                  </a>
                  . We&apos;ll discuss your needs and give you a quote.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
            Start free. Upgrade when you need more.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-300 text-slate-700"
              onClick={() => window.location.href = 'tel:+1-781-747-0041'}
            >
              Call CTO Directly
            </Button>
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
                <li><a href="mailto:cto@consulatehq.com" className="hover:text-white transition-colors">cto@consulatehq.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Consulate. Infrastructure for AI agent commerce.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
