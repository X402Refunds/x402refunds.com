"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Activity, 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Crown,
  Scale,
  FileText,
  TrendingUp,
  Server,
  Clock
} from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface SystemMetrics {
  activeAgents: number
  totalCases: number
  systemHealth: number
  uptime: number
  recentActivity: Array<{
    id: string
    type: "agent" | "case" | "system"
    message: string
    timestamp: Date
    priority: "low" | "medium" | "high" | "critical"
  }>
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeAgents: 6,
    totalCases: 47,
    systemHealth: 99.7,
    uptime: 99.2,
    recentActivity: [
      {
        id: "1",
        type: "system",
        message: "Constitutional Counsel requesting human override authority",
        timestamp: new Date(),
        priority: "critical"
      },
      {
        id: "2", 
        type: "case",
        message: "New dispute filed: AUTO-2024-008 - Service level agreement violation",
        timestamp: new Date(Date.now() - 300000),
        priority: "high"
      },
      {
        id: "3",
        type: "agent",
        message: "Agent economic-governance-secretary completed treasury analysis",
        timestamp: new Date(Date.now() - 600000),
        priority: "medium"
      }
    ]
  })

  const quickActions = [
    {
      title: "Live Monitoring",
      description: "Real-time activity and agent status",
      href: "/monitoring",
      icon: Activity,
      badge: "LIVE",
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Human Override",
      description: "Emergency controls and oversight",
      href: "/controls/override", 
      icon: Crown,
      badge: "SECURE",
      color: "text-red-600 bg-red-100"
    },
    {
      title: "Constitutional Convention",
      description: "Live constitutional discussions",
      href: "/constitutional/convention",
      icon: Scale,
      badge: "PENDING",
      color: "text-purple-600 bg-purple-100"
    },
    {
      title: "Emergency Operations",
      description: "DEFCON threat monitoring",
      href: "/controls/emergency",
      icon: AlertTriangle,
      badge: "DEFCON 5",
      color: "text-green-600 bg-green-100"
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-100"
      case "high": return "text-orange-600 bg-orange-100"
      case "medium": return "text-yellow-600 bg-yellow-100" 
      default: return "text-blue-600 bg-blue-100"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="compliance-card p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="heading-government text-4xl mb-2">
                Consulate AI Government Portal
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Constitutional AI Agent Oversight and Control System
              </p>
              <div className="flex items-center gap-4">
                <Badge className="authority-badge">
                  🇺🇸 United States Constitutional Authority
                </Badge>
                <Badge variant="outline">
                  Founded by Vivek Kotecha
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">System Status</div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold text-green-600">Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                All agents operational
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.totalCases}</div>
              <p className="text-xs text-muted-foreground">
                +3 from last hour
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.systemHealth}%</div>
              <Progress value={metrics.systemHealth} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.uptime}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="heading-government text-2xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="dashboard-card hover:scale-105 transition-transform cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon className={`h-8 w-8 ${action.color} rounded-lg p-2`} />
                        <Badge variant="secondary">{action.badge}</Badge>
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 24 hours of system activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(activity.priority)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/monitoring">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Government Authority
              </CardTitle>
              <CardDescription>Constitutional compliance and jurisdiction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="font-medium">U.S. Constitution</span>
                  <Badge className="bg-green-100 text-green-800">Supreme Law</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                  <span className="font-medium">Federal Authority</span>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">State Jurisdiction</span>
                  <Badge variant="outline">California</Badge>
                </div>
              </div>
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  All AI agents operate under human government oversight
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Alert */}
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  Constitutional Merger Approval Required
                </h3>
                <p className="text-sm text-orange-700">
                  Chief Constitutional Counsel is requesting human oversight approval for constitutional discussion merger.
                </p>
              </div>
              <Link href="/constitutional/convention">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Review Request
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
    </div>
    </DashboardLayout>
  )
}
