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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live Dispute Resolution Monitor</h1>
          <p className="text-slate-600">
            Real-time AI vendor dispute resolution at institutional scale
          </p>
        </div>

        {/* Status Badges - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 whitespace-nowrap">
              🟢 Dispute Engine Active
            </Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-700 whitespace-nowrap text-xs sm:text-sm">
              Last Updated: {new Date().toLocaleTimeString()}
            </Badge>
            <Badge className="bg-blue-50 text-blue-800 border-blue-200 whitespace-nowrap">
              ⚡ Real-time Data
            </Badge>
          </div>
          <Button 
            variant="outline"
            onClick={() => window.open('/', '_self')}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 w-full sm:w-auto sm:ml-auto"
          >
            ← Back to Landing
          </Button>
        </div>

        {/* Live Dispute Monitor */}
        <LiveDisputeMonitor />

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-amber-900 font-semibold mb-2">🚀 Start the Dispute Engine</h3>
          <p className="text-amber-800 text-sm mb-3">
            To see live disputes, run the AI vendor dispute engine in your terminal:
          </p>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded font-mono text-sm">
            pnpm demo:disputes
          </div>
          <p className="text-amber-700 text-xs mt-2">
            This will generate 10-20 realistic AI vendor disputes per minute with automatic resolution.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
