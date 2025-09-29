"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import LiveDisputeMonitor from "@/components/dashboard/live-dispute-monitor"

export default function DashboardPage() {

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Live Dispute Resolution Monitor</h1>
          <p className="text-muted-foreground">
            Real-time AI vendor dispute resolution at scale
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            🟢 Dispute Engine Active
          </Badge>
          <Badge variant="outline">
            Last Updated: {new Date().toLocaleTimeString()}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            ⚡ Real-time Data
          </Badge>
          <Button 
            variant="outline"
            onClick={() => window.open('/', '_self')}
            className="ml-auto"
          >
            ← Back to Landing
          </Button>
        </div>

        {/* Live Dispute Monitor */}
        <LiveDisputeMonitor />

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-amber-800 font-semibold mb-2">🚀 Start the Dispute Engine</h3>
          <p className="text-amber-700 text-sm mb-3">
            To see live disputes, run the AI vendor dispute engine in your terminal:
          </p>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
            pnpm demo:disputes
          </div>
          <p className="text-amber-600 text-xs mt-2">
            This will generate 10-20 realistic AI vendor disputes per minute with automatic resolution.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
