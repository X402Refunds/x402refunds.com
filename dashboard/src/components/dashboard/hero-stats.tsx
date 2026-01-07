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
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardContent className="p-4 sm:p-6">
        {/* Compact Status Bar */}
        <div className="flex items-center justify-between mb-4">
          <Badge className={`${isSystemActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {isSystemActive ? '● Live' : '○ Idle'}
          </Badge>
          <span className="text-xs text-slate-500">
            Updated {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Disputes Resolved */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-xs sm:text-sm text-slate-700 font-medium uppercase tracking-wide">
                Disputes Resolved (24H)
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tabular-nums">
              {resolvedCount}
            </div>
            <p className="text-xs text-slate-600 mt-1">Last 24 hours</p>
          </div>

          {/* Average Resolution Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-xs sm:text-sm text-slate-700 font-medium uppercase tracking-wide">
                Avg Resolution Time
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tabular-nums">
              {avgResolutionMinutes.toFixed(1)}
              <span className="text-2xl sm:text-3xl ml-1">min</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">Automated arbitration</p>
          </div>

          {/* Active Agents */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-slate-600" />
              <span className="text-xs sm:text-sm text-slate-700 font-medium uppercase tracking-wide">
                Active Agents
              </span>
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-slate-900 font-mono tabular-nums">
              {activeAgents}
            </div>
            <p className="text-xs text-slate-600 mt-1">Currently operational</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
