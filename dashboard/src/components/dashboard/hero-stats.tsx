"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Activity } from "lucide-react";
import { useSystemStats } from "@/hooks/use-system-stats";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function HeroStats() {
  const cachedStats = useSystemStats();
  const systemStats = useQuery(api.events.getSystemStats, { hoursBack: 24 });
  
  const resolvedCount = systemStats?.casesResolved ?? 0;
  const avgResolutionMinutes = cachedStats.avgResolutionTimeMinutes || 2.4;
  const activeAgents = cachedStats.activeAgents;
  const isSystemActive = activeAgents > 0 || resolvedCount > 0;

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600">
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              AI Dispute Resolution System
            </h2>
            <p className="text-blue-100 text-sm sm:text-base">
              Automated arbitration resolving disputes in minutes, not months
            </p>
          </div>
          <Badge className={`${isSystemActive ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300' : 'bg-slate-500/20 text-slate-100 border-slate-300'} whitespace-nowrap`}>
            {isSystemActive ? '🟢 Live' : '⚪ Idle'}
          </Badge>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Disputes Resolved */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-300" />
              <span className="text-xs sm:text-sm text-blue-100 font-medium uppercase tracking-wide">
                Disputes Resolved
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-white font-mono tabular-nums">
              {resolvedCount}
            </div>
            <p className="text-xs text-blue-200 mt-1">Last 24 hours</p>
          </div>

          {/* Average Resolution Time */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-300" />
              <span className="text-xs sm:text-sm text-blue-100 font-medium uppercase tracking-wide">
                Avg Resolution
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-white font-mono tabular-nums">
              {avgResolutionMinutes.toFixed(1)}
              <span className="text-2xl sm:text-3xl ml-1">min</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Automated arbitration</p>
          </div>

          {/* Active Agents */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-amber-300" />
              <span className="text-xs sm:text-sm text-blue-100 font-medium uppercase tracking-wide">
                Active Agents
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-white font-mono tabular-nums">
              {activeAgents}
            </div>
            <p className="text-xs text-blue-200 mt-1">Currently operational</p>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-white text-sm sm:text-base text-center">
            {isSystemActive ? (
              <>
                ✅ <strong>System is operational</strong> and actively resolving disputes
              </>
            ) : (
              <>
                ⏸️ System is idle. No active disputes at this time.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
