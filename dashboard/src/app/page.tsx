"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowRight, Clock, DollarSign, Shield, Zap, CheckCircle, Activity, Gavel, FileText, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSystemStats } from "@/hooks/use-system-stats"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"


// Animation hooks
function useCountUp(target: number, duration: number, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const countRef = useRef(0)
  const frameId = useRef<number | undefined>(undefined)
  const startTime = useRef<number | undefined>(undefined)

  const easeOutCubic = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }, [])

  const animate = useCallback((timestamp: number) => {
    if (!startTime.current) {
      startTime.current = timestamp + delay
      frameId.current = requestAnimationFrame(animate)
      return
    }

    if (timestamp < startTime.current) {
      frameId.current = requestAnimationFrame(animate)
      return
    }

    const elapsed = timestamp - startTime.current
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeOutCubic(progress)
    
    const currentCount = Math.floor(easedProgress * target)
    countRef.current = currentCount
    setCount(currentCount)

    if (progress < 1) {
      frameId.current = requestAnimationFrame(animate)
    }
  }, [target, duration, delay, easeOutCubic])

  const start = useCallback(() => {
    if (!isActive) {
      setIsActive(true)
      startTime.current = undefined
      frameId.current = requestAnimationFrame(animate)
    }
  }, [isActive, animate])

  // Reset animation when target changes
  useEffect(() => {
    setCount(0)
    setIsActive(false)
    startTime.current = undefined
    countRef.current = 0
  }, [target])

  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current)
      }
    }
  }, [])

  return { count, start, isActive }
}

function useInView(threshold: number = 0.3) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isInView, threshold])

  return { ref, isInView }
}

export default function HomePage() {
  // Fetch cached stats using shared hook (instant load - updated every 5 minutes by cron)
  const stats = useSystemStats()
  
  // Animation state for metrics
  const { ref: metricsRef, isInView } = useInView(0.3)
  
  // Use cached data (shows real numbers from database)
  const companiesTarget = stats.activeAgents
  const disputesTarget = stats.resolvedCases
  const avgResolutionMinutes = stats.avgResolutionTimeMinutes || 2.4
  
  const companiesCount = useCountUp(companiesTarget, 2000, 0)
  const disputesCount = useCountUp(disputesTarget, 2500, 500)

  // Trigger animations when section comes into view AND when targets change
  useEffect(() => {
    if (isInView && companiesTarget > 0) {
      companiesCount.start()
    }
  }, [isInView, companiesTarget, companiesCount])

  useEffect(() => {
    if (isInView && disputesTarget > 0) {
      disputesCount.start()
    }
  }, [isInView, disputesTarget, disputesCount])

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="space-y-8 sm:space-y-10">
                <div className="space-y-6 sm:space-y-7">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                    Resolve AI Agent Disputes in{" "}
                    <span className="text-blue-600 border-b-4 border-blue-600">
                      minutes
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-slate-600 max-w-2xl leading-relaxed">
                    When AI services fail to deliver what they promised, we resolve the disputes <strong className="text-slate-900">automatically in minutes</strong> instead of 
                    months of <strong className="text-slate-900">expensive legal battles</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 pt-2">
                  <Button 
                    size="lg" 
                    className="bg-slate-900 text-white hover:bg-slate-800 text-lg px-8 h-14 font-semibold w-full sm:w-auto"
                    onClick={() => window.open('/dashboard', '_self')}
                  >
                    View Live System
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Live Metrics Card - Hidden on mobile, shown on lg+ */}
            <div ref={metricsRef} className="hidden lg:block lg:col-span-5 lg:mt-0">
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Live System Metrics</CardTitle>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs">
                      ● Real-time
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                    Production system currently resolving disputes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="text-center p-3 sm:p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mb-0.5 sm:mb-1">
                        {companiesCount.count}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wide">Active Agents</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums mb-0.5 sm:mb-1">
                        {disputesCount.count}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-600 uppercase tracking-wide">Disputes Resolved</div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Avg Resolution Time</span>
                      <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                        {avgResolutionMinutes.toFixed(1)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Total Cases</span>
                      <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">{stats.totalCases}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 sm:py-2">
                      <span className="text-slate-600 font-medium">Pending Cases</span>
                      <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">{stats.pendingCases}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Mobile-only Simple Metrics */}
      <section className="lg:hidden py-12 bg-slate-50/30 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 font-mono mb-2">
                {companiesTarget}
              </div>
              <div className="text-sm text-slate-600 font-medium">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 font-mono mb-2">
                {disputesTarget}
              </div>
              <div className="text-sm text-slate-600 font-medium">Disputes Resolved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {/* Feature 1: Persistent Identity */}
            <div id="feature-identity" className="grid lg:grid-cols-2 gap-12 items-center">
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

                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open('/dashboard', '_self')}
                >
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Agent Registry
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Button>
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
            <div id="feature-dispute" className="grid lg:grid-cols-2 gap-12 items-center">
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

                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => window.open('/dashboard/cases', '_self')}
                >
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Case History
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Button>
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


      {/* Demo Cases */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-14 md:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-5">
              Proven Resolution Cases
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">
              Real scenarios where institutional automation delivers results
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {/* Case 1 */}
            <Card className="border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-center">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-0.5 sm:mb-1">Salesforce vs OpenAI</h3>
                    <p className="text-xs sm:text-sm text-slate-600">API downtime SLA breach</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-600">$23K</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Revenue Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-emerald-600">1m 47s</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Resolution Time</div>
                  </div>
                  <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center sm:justify-start space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-emerald-600 font-medium">Resolved Automatically</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case 2 */}
            <Card className="border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-center">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-0.5 sm:mb-1">Uber vs Google Maps</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Response time SLA violation</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-600">$38K</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Efficiency Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-emerald-600">2m 33s</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Resolution Time</div>
                  </div>
                  <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center sm:justify-start space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-emerald-600 font-medium">API Credits Issued</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case 3 */}
            <Card className="border-l-4 border-l-slate-600 shadow-sm">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 items-center">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-0.5 sm:mb-1">Anthropic vs Azure</h3>
                    <p className="text-xs sm:text-sm text-slate-600">Compute allocation failure</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-red-600">$45K</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Training Delay</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-emerald-600">1m 58s</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">Resolution Time</div>
                  </div>
                  <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center sm:justify-start space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-emerald-600 font-medium">Credits + Free Month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live API Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 sm:mb-6">
                Enterprise-Grade API
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8">
                Sovereign-deployable infrastructure. Test it now or integrate directly into your jurisdiction.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    24/7 Uptime
                  </Badge>
                  <span className="text-slate-300 text-xs sm:text-sm">Institutional reliability</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Real-time
                  </Badge>
                  <span className="text-slate-300 text-xs sm:text-sm">Constitutional-speed resolution</span>
                </div>
              </div>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white flex items-center justify-between text-base sm:text-lg">
                  <span>Live API Endpoints</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    Online
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm break-all">
                  Base URL: https://youthful-orca-358.convex.site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-mono">
                  {[
                    { endpoint: "GET /health", desc: "System Status", color: "emerald" },
                    { endpoint: "GET /agents", desc: "List Agents", color: "blue" },
                    { endpoint: "POST /agents/simple", desc: "Register Agent", color: "blue" },
                    { endpoint: "POST /evidence", desc: "Submit Evidence", color: "amber" },
                    { endpoint: "POST /disputes", desc: "File Dispute", color: "red" }
                  ].map(({ endpoint, desc, color }) => (
                    <div key={endpoint} className="flex justify-between items-center p-2 sm:p-2.5 bg-slate-900/50 rounded border border-slate-600 gap-2">
                      <span className="text-slate-300 text-[10px] sm:text-xs truncate">{endpoint}</span>
                      <Badge variant="outline" className={`text-${color}-400 border-${color}-500/30 text-[10px] whitespace-nowrap flex-shrink-0`}>
                        {desc}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="pt-2 sm:pt-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base h-10 sm:h-11"
                    onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')}
                  >
                    Test API Now
                    <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 sm:mb-6">
            Deploy Your AI Agent
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-slate-300">
            Join {companiesTarget}+ agents resolving disputes automatically
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-slate-900 hover:bg-slate-100 h-14 text-lg px-8"
              onClick={() => window.open('/dashboard', '_self')}
            >
              View Live Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
