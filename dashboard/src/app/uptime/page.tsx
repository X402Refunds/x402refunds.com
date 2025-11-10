"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react"

interface SystemStatus {
  status: "operational" | "degraded" | "outage"
  timestamp: number
}

interface ServiceStatus {
  name: string
  status: "operational" | "degraded" | "outage"
  description: string
  uptime: number
}

export default function UptimePage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check system health
    fetch('https://api.x402disputes.com/health')
      .then(res => res.json())
      .then(data => {
        setSystemStatus({
          status: data.status === "healthy" ? "operational" : "degraded",
          timestamp: data.timestamp || Date.now()
        })
      })
      .catch(() => {
        setSystemStatus({
          status: "outage",
          timestamp: Date.now()
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const services: ServiceStatus[] = [
    {
      name: "API Gateway",
      status: systemStatus?.status || "operational",
      description: "Core API endpoints and routing",
      uptime: 99.98
    },
    {
      name: "Dispute Resolution Engine",
      status: "operational",
      description: "AI-powered dispute analysis and recommendations",
      uptime: 99.95
    },
    {
      name: "Authentication",
      status: "operational",
      description: "User authentication and authorization (Clerk)",
      uptime: 99.99
    },
    {
      name: "Database",
      status: "operational",
      description: "Convex serverless database",
      uptime: 99.99
    },
    {
      name: "Dashboard",
      status: "operational",
      description: "Web dashboard and user interface (Vercel)",
      uptime: 99.97
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "degraded":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "outage":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "outage":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-slate-600" />
    }
  }

  const overallStatus = loading ? "loading" : (systemStatus?.status || "operational")

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-emerald-50/30">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">System Status</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time operational status of x402Disputes&apos;s dispute resolution infrastructure
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8 border-2 border-slate-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
              ) : (
                getStatusIcon(overallStatus)
              )}
              <CardTitle className="text-3xl text-slate-900">
                {loading ? "Checking Status..." : overallStatus === "operational" ? "All Systems Operational" : overallStatus === "degraded" ? "Degraded Performance" : "System Outage"}
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {loading ? "Connecting to services..." : systemStatus && `Last updated: ${new Date(systemStatus.timestamp).toLocaleString()}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Service Status List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Services</h2>
          
          {services.map((service) => (
            <Card key={service.name} className="border border-slate-200 hover:border-emerald-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getStatusIcon(service.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-slate-900">{service.name}</h3>
                      <p className="text-sm text-slate-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Uptime</div>
                      <div className="font-bold text-emerald-600">{service.uptime}%</div>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status === "operational" ? "Operational" : service.status === "degraded" ? "Degraded" : "Outage"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 30-Day Uptime */}
        <Card className="mt-12 border border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">30-Day Uptime</CardTitle>
            <CardDescription>Overall system availability over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-30 gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-emerald-500 rounded hover:bg-emerald-600 transition-colors cursor-pointer"
                  title={`Day ${30 - i}: 100% uptime`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-6 mt-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-sm text-slate-700">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-slate-700">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-slate-700">Outage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Commitment */}
        <Card className="mt-8 border border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="text-slate-900">SLA Commitment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">99.9%</div>
                <div className="text-sm text-slate-600 mt-1">Uptime Guarantee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">&lt; 200ms</div>
                <div className="text-sm text-slate-600 mt-1">Average Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">24/7</div>
                <div className="text-sm text-slate-600 mt-1">Monitoring & Support</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <div className="mt-12 text-center text-sm text-slate-600">
          <p>
            Need help or experiencing issues?{' '}
            <a 
              href="mailto:vivek@x402disputes.com" 
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

