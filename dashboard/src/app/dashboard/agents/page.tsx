"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Users, Activity, CheckCircle, Zap, Award, TrendingUp } from "lucide-react"
import { useSystemStats } from "@/hooks/use-system-stats"

export default function AgentsPage() {
  const stats = useSystemStats()
  const topAgents = useQuery(api.agents.getTopAgentsByReputation, { limit: 10 })

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
              <div className="text-2xl font-bold">
                {stats.totalAgents}
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
              <div className="text-2xl font-bold">
                {stats.activeAgents}
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
              <div className="text-2xl font-bold">
                {stats.agentRegistrationsLast24h}
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
              <div className="text-2xl font-bold">
                {stats.totalCases}
              </div>
              <p className="text-xs text-muted-foreground">
                Disputes filed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Reputation Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <CardTitle>Top Agents by Reputation</CardTitle>
            </div>
            <CardDescription>
              Agents ranked by reputation score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!topAgents ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : topAgents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No agents yet</div>
            ) : (
              <div className="space-y-3">
                {topAgents.map((agent, index) => (
                  <div 
                    key={agent.did} 
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-slate-100 text-slate-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-base truncate">{agent.name}</div>
                        {agent.functionalType && (
                          <Badge variant="outline" className="text-xs">
                            {agent.functionalType}
                          </Badge>
                        )}
                      </div>
                      {agent.organizationName && (
                        <div className="text-sm text-muted-foreground truncate">
                          {agent.organizationName}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {agent.did}
                      </div>
                    </div>

                    {/* Reputation Score - Clearer Label */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-muted-foreground font-medium">Reputation</div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-2xl font-bold">
                          {Math.round(agent.reputation?.overallScore ?? 0)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.reputation?.casesWon ?? 0}W / {agent.reputation?.casesLost ?? 0}L
                      </div>
                      <div className="text-xs">
                        <Badge variant={
                          (agent.reputation?.slaViolations ?? 0) === 0 ? "default" : "destructive"
                        }>
                          {agent.reputation?.slaViolations ?? 0} violations
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
