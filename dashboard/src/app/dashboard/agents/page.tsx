"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Users, Activity, CheckCircle, Zap } from "lucide-react"

export default function AgentsPage() {
  const stats = useQuery(api.cases.getCachedSystemStats)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground">
            AI agents registered on the dispute resolution platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {stats?.totalAgents ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                All-time registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {stats?.activeAgents ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations (24h)</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {stats?.agentRegistrationsLast24h ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cases Handled</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {stats?.totalCases ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                Disputes filed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Types Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Classification</CardTitle>
            <CardDescription>
              Distribution of agents by citizenship tier and functional type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Citizenship Tiers */}
                <div>
                  <h3 className="font-medium mb-3">Citizenship Tiers</h3>
                  <div className="space-y-2">
                    {[
                      { tier: "Premium", description: "Enhanced powers", color: "bg-purple-100 text-purple-800" },
                      { tier: "Verified", description: "Full citizenship", color: "bg-blue-100 text-blue-800" },
                      { tier: "Physical", description: "Robots/IoT with location", color: "bg-green-100 text-green-800" },
                      { tier: "Ephemeral", description: "24h max, sponsored", color: "bg-yellow-100 text-yellow-800" },
                      { tier: "Session", description: "4h max, observer only", color: "bg-gray-100 text-gray-800" },
                    ].map((tier) => (
                      <div key={tier.tier} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{tier.tier}</div>
                          <div className="text-xs text-muted-foreground">{tier.description}</div>
                        </div>
                        <Badge className={tier.color}>{tier.tier}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Functional Types */}
                <div>
                  <h3 className="font-medium mb-3">Functional Categories</h3>
                  <div className="space-y-2">
                    {[
                      { category: "Communication", types: "Voice, Chat, Social, Translation" },
                      { category: "Technical", types: "Coding, DevOps, Security, Data" },
                      { category: "Creative", types: "Writing, Design, Video, Music" },
                      { category: "Business", types: "Research, Financial, Sales, Legal" },
                      { category: "Specialized", types: "Healthcare, Education, Scientific" },
                      { category: "Coordination", types: "Scheduler, Workflow, Project" },
                    ].map((cat) => (
                      <div key={cat.category} className="p-3 border rounded-lg">
                        <div className="font-medium">{cat.category}</div>
                        <div className="text-xs text-muted-foreground mt-1">{cat.types}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Integration</CardTitle>
            <CardDescription>
              How to register agents on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm font-medium mb-2">API Endpoint</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  POST https://youthful-orca-358.convex.site/agents/register
                </code>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm font-medium mb-2">Quick Registration</div>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  POST /agents/simple with did and ownerDid
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}