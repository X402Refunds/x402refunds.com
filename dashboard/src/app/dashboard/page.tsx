"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import LiveDisputeMonitor from "@/components/dashboard/live-dispute-monitor"

export default function DashboardPage() {

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dispute Resolution Monitor</h1>
          <p className="text-slate-600">
            AI Agent dispute resolution dashboard
          </p>
        </div>


        {/* Live Dispute Monitor */}
        <LiveDisputeMonitor />
      </div>
    </DashboardLayout>
  )
}
