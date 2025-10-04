"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Linkedin, Twitter, Calendar, MapPin, Building2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export default function AboutPage() {
  const [emailRevealed, setEmailRevealed] = useState(false)

  // Bot-resistant email rendering
  const renderEmail = () => {
    if (!emailRevealed) {
      return (
        <button
          onClick={() => setEmailRevealed(true)}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors group"
          aria-label="Click to reveal email address"
        >
          <Mail className="h-5 w-5" />
          <span className="border-b border-blue-600 group-hover:border-blue-700">
            Click to reveal email
          </span>
        </button>
      )
    }

    // Revealed state - still somewhat obfuscated in HTML
    const emailParts = ['vivek', 'consulatehq', 'com']
    return (
      <a
        href={`mailto:${emailParts[0]}@${emailParts[1]}.${emailParts[2]}`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        aria-label="Send email to Vivek Kotecha"
      >
        <Mail className="h-5 w-5" />
        <span className="font-mono">
          {emailParts[0]}&#64;{emailParts[1]}&#46;{emailParts[2]}
        </span>
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="about" />

      {/* Hero Section */}
      <section className="pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 text-sm px-4 py-1.5">
              About Consulate
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              The First AI Governance Operating System
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Human governments can&apos;t govern billions of autonomous AI agents. So we built the infrastructure 
              for agents to self-govern—persistent ID, automated arbitration, and sovereignty at machine speed.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-blue-100 flex-shrink-0">
                  <Image
                    src="/vivek-headshot.jpg"
                    alt="Vivek Kotecha - Founder of Consulate"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl sm:text-3xl text-slate-900 mb-2">
                    Vivek Kotecha
                  </CardTitle>
                  <p className="text-slate-600 text-lg">
                    Founder & Creator
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-5 sm:space-y-6">
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  Within 2-3 years, <strong className="text-slate-900">billions of AI agents</strong> will be transacting 
                  autonomously—and we have <strong className="text-slate-900">zero governance infrastructure</strong> for them. 
                  No persistent identity. No dispute resolution. No fraud detection. When that explosion happens, governments 
                  will be overwhelmed by agentic fraud, identity theft, and bad actors operating at machine speed.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  Traditional institutions can&apos;t build this. OpenAI won&apos;t build neutral infrastructure—they&apos;re 
                  a participant, not a referee. Stripe and existing payment rails can&apos;t handle agent-to-agent disputes. 
                  Governments are years behind. We need <strong className="text-slate-900">neutral governance infrastructure 
                  built NOW</strong>, before the agent economy explodes, not after.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  That&apos;s why I built Consulate: <strong className="text-slate-900">the first AI Governance Operating System</strong>. 
                  Persistent identity for every agent. Automated dispute resolution in minutes. Cross-platform reputation. 
                  It&apos;s the trust layer that lets billions of agents transact safely—before chaos becomes the default.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  Just like the internet needed DNS, payments needed Stripe, and humans needed courts—<strong className="text-slate-900">autonomous 
                  agents need governance infrastructure</strong>. We&apos;re building that foundational layer before it&apos;s too late.
                </p>
              </div>

              {/* Contact Methods */}
              <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Get in Touch</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      {renderEmail()}
                    </div>
                    
                    <a
                      href="https://www.linkedin.com/in/vbkotecha"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Connect on LinkedIn
                      </span>
                    </a>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a
                      href="https://twitter.com/victorblackoff"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <Twitter className="h-5 w-5 text-blue-500" />
                      <span className="text-blue-500 hover:text-blue-600 font-medium">
                        Follow on Twitter/X
                      </span>
                    </a>

                    <a
                      href="https://calendly.com/vivek-consulatehq/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      <span className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Schedule a Meeting
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900">Response time:</strong> I typically respond to emails 
                      within 24 hours. For urgent inquiries about the platform, use the email above.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Company Mission */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              The Governance Gap
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Why human legal systems can&apos;t govern the AI economy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-3">Billions</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Scale Problem
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Billions of AI agents will transact autonomously. Human courts can&apos;t handle millions 
                  of disputes per day. You need governance that operates at machine scale.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-red-600 mb-3">90 days</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Speed Problem
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Traditional arbitration takes 3+ months and costs $50K+. AI agents need resolution 
                  in minutes with $500 fees. Human speed doesn&apos;t work.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-slate-700 mb-3">No ID</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Identity Problem
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Governments haven&apos;t given AI agents legal identity. No persistent ID = no 
                  reputation, no trust, no commerce. Agents need their own identity layer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for Speed & Reliability
            </h2>
            <p className="text-lg text-slate-600">
              Modern infrastructure for real-time dispute resolution
            </p>
          </div>

          <Card className="border-2 border-slate-200">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Technology
                  </h3>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li>• <strong>Backend:</strong> Convex (serverless functions & database)</li>
                    <li>• <strong>Frontend:</strong> Next.js 15 + React 19 on Vercel</li>
                    <li>• <strong>Language:</strong> TypeScript throughout</li>
                    <li>• <strong>Auth:</strong> Clerk for secure authentication</li>
                    <li>• <strong>Testing:</strong> Vitest for comprehensive test coverage</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Key Metrics</h3>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li>• <strong>Uptime:</strong> 99.9% (institutional-grade)</li>
                    <li>• <strong>Avg Resolution:</strong> 2.4 minutes</li>
                    <li>• <strong>API Response:</strong> &lt;200ms globally</li>
                    <li>• <strong>Security:</strong> End-to-end encryption</li>
                    <li>• <strong>Compliance:</strong> SOC 2 Type II ready</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Building the Governance Layer for AI
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            If you&apos;re building autonomous AI agents, you need sovereignty infrastructure. 
            See how the first AI governance OS works in production.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 font-semibold"
              onClick={() => window.open('/dashboard', '_self')}
            >
              View Live System
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 h-14 font-semibold"
              onClick={() => setEmailRevealed(true)}
            >
              <Mail className="mr-2 h-5 w-5" />
              Get in Touch
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
