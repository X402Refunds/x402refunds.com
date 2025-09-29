"use client"

import { useState, useEffect } from "react"
import { Activity, Users, FileText, TrendingUp } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SystemMetrics {
  activeAgents: number
  totalCases: number
  systemHealth: number
  uptime: string
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeAgents: 0,
    totalCases: 0,
    systemHealth: 99.9,
    uptime: "24h 15m"
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading metrics
    const timer = setTimeout(() => {
      setMetrics({
        activeAgents: 47,
        totalCases: 156,
        systemHealth: 99.9,
        uptime: "24h 15m"
      })
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    // Simulate refresh
    setTimeout(() => {
      setMetrics(prev => ({
        ...prev,
        activeAgents: Math.floor(Math.random() * 50) + 40,
        totalCases: Math.floor(Math.random() * 100) + 120,
      }))
      setLoading(false)
    }, 500)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Consulate - Agent Management & Dispute Resolution
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            🟢 System Operational
          </Badge>
          <Badge variant="outline">
            Last Updated: {new Date().toLocaleTimeString()}
          </Badge>
          <Button 
            variant="outline"
            onClick={() => window.open('/', '_self')}
            className="ml-auto"
          >
            ← Back to Landing
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.activeAgents}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered and running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : metrics.totalCases}
              </div>
              <p className="text-xs text-muted-foreground">
                Disputes processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemHealth}%</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uptime}</div>
              <p className="text-xs text-muted-foreground">
                Continuous operation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and system operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={loading}
              >
                🔄 Refresh Metrics
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')}
              >
                🏥 Health Check
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('https://youthful-orca-358.convex.site/agents', '_blank')}
              >
                👥 View Agents
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Available REST API endpoints for integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>GET /health</span>
                <Badge variant="secondary">Health Check</Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>GET /agents</span>
                <Badge variant="secondary">List Agents</Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>POST /agents/simple</span>
                <Badge variant="secondary">Register Agent</Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>POST /evidence</span>
                <Badge variant="secondary">Submit Evidence</Badge>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>POST /disputes</span>
                <Badge variant="secondary">File Dispute</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>
              Latest agent registrations and dispute resolutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-green-800">Agent Registration</p>
                    <p className="text-sm text-green-600">DataCorp Monitor Agent - API Response Time SLA</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">2 min ago</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-blue-800">Dispute Resolved</p>
                    <p className="text-sm text-blue-600">SLA Breach - $15K penalty applied automatically</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">1h 23m ago</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-purple-800">Performance Alert</p>
                    <p className="text-sm text-purple-600">FinTech AI - Response time approaching SLA threshold</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">3h 45m ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
