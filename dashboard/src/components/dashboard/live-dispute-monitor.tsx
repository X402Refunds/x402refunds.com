"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, Gavel, TrendingUp, Activity } from "lucide-react";
import { DisputeEvent } from "@/lib/convex-client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function LiveDisputeMonitor() {
  const router = useRouter();
  
  // REAL-TIME DATA FROM CONVEX
  const systemStats = useQuery(api.events.getSystemStats, { hoursBack: 24 });
  const recentEvents = useQuery(api.events.getRecentEvents, { 
    limit: 20 
  });
  const activeCases = useQuery(api.cases.getCasesByStatus, { 
    status: "FILED",
    limit: 10 
  });
  const recentCases = useQuery(api.cases.getCasesByStatus, { 
    status: "DECIDED", 
    limit: 10 
  });

  // Helper function to format agent name from DID
  const formatAgentName = (did: string) => {
    if (!did) return "Unknown";
    const parts = did.split(':');
    if (parts.length >= 3) {
      return parts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return did;
  };

  // Helper function to get event color
  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      "AGENT_REGISTERED": "bg-blue-50 text-blue-700 border-blue-200",
      "DISPUTE_FILED": "bg-red-50 text-red-700 border-red-200", 
      "EVIDENCE_SUBMITTED": "bg-amber-50 text-amber-700 border-amber-200",
      "CASE_STATUS_UPDATED": "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
    return colors[type] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formatEventDescription = (event: DisputeEvent) => {
    switch (event.type) {
      case "AGENT_REGISTERED":
        return `${formatAgentName(event.payload?.did as string)} joined the platform`;
      case "DISPUTE_FILED":
        const parties = (event.payload?.parties as string[])?.map((p: string) => formatAgentName(p)).join(" vs ");
        const disputeType = event.payload?.type as string;
        // Highlight LLM-generated disputes by checking jurisdiction tags
        const jurisdictionTags = event.payload?.jurisdictionTags as string[] || [];
        const isLLMGenerated = jurisdictionTags.includes("LLM_GENERATED");
        const llmPrefix = isLLMGenerated ? "🤖 AI-Generated: " : "";
        return `${llmPrefix}${parties} dispute filed (${disputeType})`;
      case "EVIDENCE_SUBMITTED":
        return `Evidence submitted by ${formatAgentName(event.payload?.agentDid as string)}`;
      case "CASE_STATUS_UPDATED":
        return `Case ${event.payload?.caseId as string} updated to ${event.payload?.newStatus as string}`;
      default:
        return event.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  if (!systemStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-900">Loading...</CardTitle>
            <Activity className="h-4 w-4 text-slate-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">--</div>
            <p className="text-xs text-slate-600">Connecting to live backend...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 hover:border-blue-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total Disputes</CardTitle>
            <Gavel className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{systemStats.disputesFiled}</div>
            <p className="text-xs text-slate-600">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 hover:border-emerald-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Cases Resolved</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{systemStats.casesResolved}</div>
            <p className="text-xs text-slate-600">
              {systemStats.disputesFiled > 0 
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
            <div className="text-2xl font-bold text-slate-900">{systemStats.agentRegistrations}</div>
            <p className="text-xs text-slate-600">
              Registered agents
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 hover:border-blue-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">System Activity</CardTitle>
            <Activity className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{systemStats.totalEvents}</div>
            <p className="text-xs text-slate-600">
              Total events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity Feed */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
            <CardDescription className="text-slate-600">
              Real-time dispute resolution events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!recentEvents || recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No recent activity. Start the dispute engine to see live data.
              </p>
            ) : (
              recentEvents?.slice(0, 8).map((event: DisputeEvent) => (
                <div 
                  key={event._id} 
                  className={`flex items-start space-x-3 ${event.caseId ? 'cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors' : ''}`}
                  onClick={() => event.caseId && router.push(`/dashboard/dispute/${event.caseId}`)}
                >
                  <Badge variant="secondary" className={getEventColor(event.type)}>
                    {event.type.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-slate-700">{formatEventDescription(event)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active Disputes */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Gavel className="h-5 w-5" />
              Active Disputes
            </CardTitle>
            <CardDescription className="text-slate-600">
              Currently processing cases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeCases || activeCases.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No active disputes. System is running efficiently! ✅
              </p>
            ) : (
              activeCases.map((case_: Record<string, unknown>) => (
                <div 
                  key={case_._id as string} 
                  className="space-y-2 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                  onClick={() => router.push(`/dashboard/dispute/${case_._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {(case_.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ")}
                    </p>
                    <Badge className="bg-red-50 text-red-700 border-red-200">{case_.status as string}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    {case_.type as string} • Filed {Math.floor((Date.now() - (case_.filedAt as number)) / 1000)}s ago
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Resolutions */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Clock className="h-5 w-5" />
            Recent Resolutions
          </CardTitle>
          <CardDescription className="text-slate-600">
            Recently completed dispute cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentCases || recentCases.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No cases yet. Start the dispute engine to see resolutions.
            </p>
          ) : (
            <div className="space-y-4">
              {recentCases.filter((case_: Record<string, unknown>) => case_.status === "DECIDED").slice(0, 5).map((case_: Record<string, unknown>, index: number) => (
                <div key={case_._id as string}>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                    onClick={() => router.push(`/dashboard/dispute/${case_._id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {(case_.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ")}
                      </p>
                      <p className="text-xs text-slate-600">
                        {case_.type as string} • {case_.ruling ? `Verdict: ${(case_.ruling as { verdict: string }).verdict}` : 'Processing...'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={case_.status === "DECIDED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"}>
                        {case_.status as string}
                      </Badge>
                      {case_.ruling && typeof case_.ruling === 'object' && 'decidedAt' in case_.ruling ? (
                        <p className="text-xs text-slate-500 mt-1">
                          {Math.floor((Date.now() - (case_.ruling as { decidedAt: number }).decidedAt) / 1000)}s ago
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {index < recentCases.filter((c: Record<string, unknown>) => c.status === "DECIDED").length - 1 && (
                    <Separator className="mt-4 bg-slate-200" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
