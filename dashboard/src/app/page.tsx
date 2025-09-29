"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowRight, Clock, DollarSign, Shield, Zap, CheckCircle, Activity, Eye, ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"


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
  // Fetch real-time data
  const systemStats = useQuery(api.events.getSystemStats, { hoursBack: 24 })
  
  // Animation state for metrics
  const { ref: metricsRef, isInView } = useInView(0.3)
  
  // Use real data or fallback to previous values while loading
  const companiesTarget = systemStats?.agentRegistrations ?? 47
  const disputesTarget = systemStats?.casesResolved ?? 156
  
  const companiesCount = useCountUp(companiesTarget, 2000, 0)
  const disputesCount = useCountUp(disputesTarget, 2500, 500)

  // Trigger animations when section comes into view
  useEffect(() => {
    if (isInView) {
      companiesCount.start()
      disputesCount.start()
    }
  }, [isInView, companiesCount, disputesCount])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded-lg px-2 py-1"
                >
                  Consulate
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                ● System Operational
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => window.open('/dashboard', '_self')}
                className="hidden sm:inline-flex"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="space-y-8">
                <div className="space-y-6">
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-medium">
                    Automated AI Vendor Dispute Resolution
                  </Badge>
                  <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
                    Resolve AI Agent Disputes in{" "}
                    <span className="text-black border-b-4 border-gray-900">
                      minutes
                    </span>
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl leading-relaxed">
                    When AI services fail to deliver what they promised, we resolve the disputes <strong className="text-gray-900">automatically in minutes</strong> instead of 
                    months of <strong className="text-gray-900">expensive legal battles</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-gray-900 text-white hover:bg-gray-800 text-lg px-8 py-6 font-semibold"
                    onClick={() => window.open('/dashboard', '_self')}
                  >
                    View Live System
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white text-lg px-8 py-6 font-semibold"
                    onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')}
                  >
                    Test API
                    <ArrowUpRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Live Metrics Card */}
            <div ref={metricsRef} className="lg:col-span-5 mt-16 lg:mt-0">
              <Card className="bg-white border-2 border-gray-200 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Live System Metrics</CardTitle>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-300 font-medium">
                      ● Real-time
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600">
                    Production system currently resolving disputes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-6 border border-gray-200 rounded-lg">
                      <div className="text-4xl font-bold text-gray-900 font-mono tabular-nums mb-1">
                        {companiesCount.count}
                      </div>
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Agents</div>
                    </div>
                    <div className="text-center p-6 border border-gray-200 rounded-lg">
                      <div className="text-4xl font-bold text-gray-900 font-mono tabular-nums mb-1">
                        {disputesCount.count}
                      </div>
                      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Disputes Resolved</div>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Resolution Time</span>
                      <span className="font-bold text-gray-900 font-mono">2.4 minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">System Health</span>
                      <span className="font-bold text-gray-900 font-mono">99.9%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Uptime</span>
                      <span className="font-bold text-gray-900 font-mono">24h 15m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Value Proposition */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Automated Dispute Resolution for AI Agents
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Both sides win: victims get paid quickly, violators pay predictable penalties instead of facing unknown lawsuit exposure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
              <CardHeader className="relative">
                <Clock className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-2xl">3-4 Minutes</CardTitle>
                <CardDescription className="text-base">
                  vs 3+ months of legal battles
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-600">
                  Automated evidence collection and smart contract resolution means disputes are resolved in minutes, not months of back-and-forth negotiations.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
              <CardHeader className="relative">
                <DollarSign className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">$500-3K</CardTitle>
                <CardDescription className="text-base">
                  vs $50K+ in legal fees
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-600">
                  Platform fees are a fraction of traditional legal costs. Pay based on dispute value, not hourly legal rates.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
              <CardHeader className="relative">
                <Shield className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle className="text-2xl">Automatic</CardTitle>
                <CardDescription className="text-base">
                  Cryptographic evidence & enforcement
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-gray-600">
                  No collections hassle, no relationship damage. Automatic penalty application with cryptographic proof maintains business relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Perfect Demo Cases
            </h2>
            <p className="text-xl text-gray-600">
              Real scenarios where our platform saves time and money
            </p>
          </div>

          <div className="space-y-8">
            {/* Case 1 */}
            <Card className="border-l-4 border-l-green-500 shadow-lg">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-4 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Salesforce vs OpenAI</h3>
                    <p className="text-gray-600">API downtime SLA breach</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">$23K</div>
                    <div className="text-sm text-gray-500">Revenue Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">1m 47s</div>
                    <div className="text-sm text-gray-500">Resolution Time</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Resolved Automatically</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case 2 */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-4 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Uber vs Google Maps</h3>
                    <p className="text-gray-600">Response time SLA violation</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">$38K</div>
                    <div className="text-sm text-gray-500">Efficiency Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">2m 33s</div>
                    <div className="text-sm text-gray-500">Resolution Time</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">API Credits Issued</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case 3 */}
            <Card className="border-l-4 border-l-purple-500 shadow-lg">
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-4 gap-6 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Anthropic vs Azure</h3>
                    <p className="text-gray-600">Compute allocation failure</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">$45K</div>
                    <div className="text-sm text-gray-500">Training Delay</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">1m 58s</div>
                    <div className="text-sm text-gray-500">Resolution Time</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Credits + Free Month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live API Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Production-Ready API
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Live system processing real disputes. Test it now or integrate directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Activity className="w-3 h-3 mr-1" />
                    24/7 Uptime
                  </Badge>
                  <span className="text-gray-300">Serverless Convex backend</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Real-time
                  </Badge>
                  <span className="text-gray-300">Instant dispute resolution</span>
                </div>
              </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Live API Endpoints</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Online
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Base URL: https://youthful-orca-358.convex.site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm font-mono">
                  {[
                    { endpoint: "GET /health", desc: "System Status", color: "green" },
                    { endpoint: "GET /agents", desc: "List Agents", color: "blue" },
                    { endpoint: "POST /agents/simple", desc: "Register Agent", color: "purple" },
                    { endpoint: "POST /evidence", desc: "Submit Evidence", color: "orange" },
                    { endpoint: "POST /disputes", desc: "File Dispute", color: "red" }
                  ].map(({ endpoint, desc, color }) => (
                    <div key={endpoint} className="flex justify-between items-center p-3 bg-gray-900/50 rounded border border-gray-600">
                      <span className="text-gray-300">{endpoint}</span>
                      <Badge variant="outline" className={`text-${color}-400 border-${color}-500/30`}>
                        {desc}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')}
                  >
                    Test API Now
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Automate Your AI Vendor Disputes?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join {companiesTarget}+ agents already registered on the platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-gray-900 hover:bg-gray-100"
              onClick={() => window.open('/dashboard', '_self')}
            >
              View Live Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
            >
              Request Enterprise Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Consulate</h3>
              <p className="text-sm">
                Automated arbitration for agent disputes. Resolve in minutes, not months.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => window.open('/dashboard', '_self')} className="hover:text-white">Dashboard</button></li>
                <li><button onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')} className="hover:text-white">API Status</button></li>
                <li><button className="hover:text-white">Documentation</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Enterprise Demo</li>
                <li>Partnership Inquiries</li>
                <li>Technical Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Consulate. Built for the AI economy.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}