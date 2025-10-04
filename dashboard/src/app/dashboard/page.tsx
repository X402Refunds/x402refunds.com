"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import LiveDisputeMonitor from "@/components/dashboard/live-dispute-monitor"

export default function DashboardPage() {

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Live Dispute Monitor */}
        <LiveDisputeMonitor />
      </div>
    </DashboardLayout>
  )
}