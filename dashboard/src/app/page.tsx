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

export default function HomePage() {
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
        activeAgents: 3,
        totalCases: 12,
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
        activeAgents: Math.floor(Math.random() * 10) + 1,
        totalCases: Math.floor(Math.random() * 50) + 1,
      }))
      setLoading(false)
    }, 500)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Consulate AI - Agent Management & Dispute Resolution
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
                onClick={() => window.open('/health', '_blank')}
              >
                🏥 Health Check
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('/agents', '_blank')}
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
                <span>POST /agents/register</span>
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
      </div>
    </DashboardLayout>
  )
}