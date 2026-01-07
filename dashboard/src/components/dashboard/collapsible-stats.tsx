"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Gavel, TrendingUp, Users, Activity } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSystemStats } from "@/hooks/use-system-stats";

export function CollapsibleStats() {
  const [isExpanded, setIsExpanded] = useState(false);
  const systemStats = useQuery(api.events.getSystemStats, { hoursBack: 24 });
  const cachedStats = useSystemStats();

  if (!systemStats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <Button
        variant="outline"
        className="w-full flex items-center justify-between text-slate-700 hover:text-slate-900 hover:bg-slate-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">
          {isExpanded ? "Hide Detailed Statistics" : "Show Detailed Statistics"}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {/* Expanded Stats Grid */}
      {isExpanded && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Card className="border-slate-200 hover:border-blue-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Total Disputes</CardTitle>
              <Gavel className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {systemStats?.disputesFiled ?? 0}
              </div>
              <p className="text-xs text-slate-600">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 hover:border-blue-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Cases Resolved</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {systemStats?.casesResolved ?? 0}
              </div>
              <p className="text-xs text-slate-600">
                {systemStats && systemStats.disputesFiled > 0 
                  ? `${((systemStats.casesResolved / systemStats.disputesFiled) * 100).toFixed(1)}% success rate`
                  : "No disputes yet"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 hover:border-blue-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {cachedStats.activeAgents}
              </div>
              <p className="text-xs text-slate-600">
                Currently operational
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 hover:border-blue-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">System Activity</CardTitle>
              <Activity className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {systemStats?.totalEvents ?? 0}
              </div>
              <p className="text-xs text-slate-600">
                Total events
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
