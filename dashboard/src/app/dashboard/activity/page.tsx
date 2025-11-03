"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Activity, TrendingUp, Zap } from "lucide-react"
import { Id } from "@convex/_generated/dataModel"
import { motion } from "framer-motion"

type Event = {
  _id: Id<"events">;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  agentDid?: string;
  caseId?: Id<"cases">;
}

export default function ActivityPage() {
  // User authentication handled by Clerk + Convex

  // Get current user and organization
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )

  // Get organization-specific events
  const recentEvents = useQuery(
    api.events.getOrganizationEvents,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 100 } : "skip"
  )

  // Get organization-specific stats
  const stats = useQuery(
    api.events.getOrganizationStats,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )

  const events = recentEvents ?? []

  const getEventIcon = (type: string) => {
    switch (type) {
      case "case_filed":
        return "📋"
      case "case_resolved":
        return "✅"
      case "evidence_submitted":
        return "📎"
      case "agent_registered":
        return "🤖"
      default:
        return "📌"
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "case_filed":
        return "bg-blue-100 text-blue-800"
      case "case_resolved":
        return "bg-green-100 text-green-800"
      case "evidence_submitted":
        return "bg-purple-100 text-purple-800"
      case "agent_registered":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
          <p className="text-muted-foreground">
            Real-time activity feed for your organization
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid gap-4 md:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            { icon: Activity, title: "Total Events", value: stats?.totalEvents ?? 0, subtitle: "Your organization events" },
            { icon: TrendingUp, title: "Active Cases", value: stats?.pendingCases ?? 0, subtitle: "Currently processing" },
            { icon: Zap, title: "Avg Resolution", value: `${stats?.avgResolutionTimeMinutes?.toFixed(1) ?? '0.0'}m`, subtitle: "Lightning fast" }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest events involving your organization&apos;s agents and cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 50).map((event: Event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-2xl">{getEventIcon(event.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getEventColor(event.type)}>
                          {event.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.payload && (
                        <div className="text-sm text-muted-foreground">
                          {JSON.stringify(event.payload, null, 2)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {events.length === 0 && (
                  <motion.div 
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    No activity recorded yet
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
