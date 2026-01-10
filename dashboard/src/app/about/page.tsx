"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Linkedin, Twitter, Calendar, MapPin, Key, ArrowRight, BookOpen, CheckCircle } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

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
    const emailParts = ['vivek', 'x402refunds', 'com']
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
        <motion.div 
          className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 text-sm px-4 py-1.5">
              About X402Refunds
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Payment Refund Requests for X-402
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              X402Refunds makes it simple to request, review, and process refunds for X-402 payments — with a clear status trail.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Founder Section */}
      <section className="py-6 sm:py-8 lg:py-12">
        <motion.div 
          className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex items-start gap-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-blue-100 flex-shrink-0">
                  <Image
                    src="/vivek-headshot.jpg"
                    alt="Vivek Kotecha - Founder of X402Refunds"
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
                  AI agents transact autonomously, and payments can fail in mundane ways: timeouts, errors, and non-delivery after payment.
                  Refund handling is often ad-hoc and hard to track across systems.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  X402Refunds focuses on one simple thing: a practical workflow for refund requests tied to X-402 payment proof,
                  with a clear, queryable status trail.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  That&apos;s why I built X402Refunds: a lightweight dashboard + API for refund requests that&apos;s designed for agents and merchants.
                </p>
                
                <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                  If you&apos;re integrating X-402 and want a clean refund-request workflow, I&apos;d love to hear what you need.
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
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
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
        </motion.div>
      </section>

      {/* Company Mission */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Why Refund Requests Need Better Infrastructure
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Refund handling shouldn&apos;t be a pile of spreadsheets and ad-hoc support tickets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-3">Billions</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Scale
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Billions of AI agents will transact autonomously. Human courts can&apos;t handle millions 
                  of refund requests per day. You need a workflow that operates at machine scale.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-red-600 mb-3">90 days</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Speed
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Manual back-and-forth slows refunds down. Teams need fast triage, clear status, and predictable handling.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-slate-700 mb-3">No ID</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Traceability
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Without a status trail, refunds get lost. Each request should have a clear lifecycle and history.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-6">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
              Ready to get started?
            </Badge>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Ship refund requests in 5 minutes
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Add refund request handling to your X-402 payment flow with a simple API + dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 h-14 font-semibold shadow-2xl hover:shadow-3xl transition-all group"
              onClick={() => window.location.href = '/sign-in/'}
            >
              <Key className="mr-2 h-5 w-5" />
              Open Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="bg-blue-600 text-white hover:bg-blue-500 text-lg px-8 h-14 font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/docs'}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Read the Docs
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-blue-400" />
              </div>
              <span><strong className="text-white">Free sandbox</strong> environment</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-blue-400" />
              </div>
              <span>First <strong className="text-white">100 requests free</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-blue-400" />
              </div>
              <span><strong className="text-white">5 minute</strong> integration</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
