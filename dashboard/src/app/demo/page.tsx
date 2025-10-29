"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import LiveActivityFeed from "@/components/dashboard/live-activity-feed"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <LiveActivityFeed />
    </DashboardLayout>
  )
}