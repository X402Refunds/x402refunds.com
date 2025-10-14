"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
export default function CasesPage() {
  const recentCases = useQuery(api.cases.getRecentCases, { limit: 100, mockOnly: true })
  const stats = useQuery(api.cases.getCachedSystemStats)

  const cases = recentCases ?? []
  const pendingCases = cases.filter((c) => c.status === "FILED" || c.status === "PANELED").length
  const resolvedCases = cases.filter((c) => c.status === "DECIDED" || c.status === "CLOSED").length
  const totalCases = cases.length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DECIDED":
      case "CLOSED":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "FILED":
        return <Badge className="bg-yellow-100 text-yellow-800">Filed</Badge>
      case "PANELED":
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
      case "AUTORULED":
        return <Badge className="bg-purple-100 text-purple-800">Auto-Ruled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dispute Cases</h1>
          <p className="text-muted-foreground">
            Track and manage all dispute resolution cases
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCases}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCases}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCases}</div>
              <p className="text-xs text-muted-foreground">
                Successfully closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgResolutionTimeMinutes.toFixed(1)}m</div>
              <p className="text-xs text-muted-foreground">
                Minutes to resolve
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>
              Latest dispute cases filed on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cases.slice(0, 20).map((case_) => (
                <Link
                  key={case_._id}
                  href={`/demo/dispute/${case_._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{case_.description || "Untitled Case"}</div>
                      <div className="text-sm text-muted-foreground">
                        Filed: {new Date(case_.filedAt).toLocaleString()} • Parties: {case_.parties.join(" vs ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {case_.claimedDamages && (
                        <div className="text-sm font-medium">
                          ${case_.claimedDamages.toLocaleString()}
                        </div>
                      )}
                      {getStatusBadge(case_.status)}
                    </div>
                  </div>
                </Link>
              ))}
              {cases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cases filed yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
