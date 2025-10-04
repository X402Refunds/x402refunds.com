"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, Gavel, Activity, ArrowRight, FileText } from "lucide-react";
import { DisputeEvent } from "@/lib/convex-client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { HeroStats } from "./hero-stats";
import { CollapsibleStats } from "./collapsible-stats";

export default function LiveDisputeMonitor() {
  const router = useRouter();
  
  // REAL-TIME DATA FROM CONVEX
  const recentEvents = useQuery(api.events.getRecentEvents, { 
    limit: 20 
  });
  const activeCases = useQuery(api.cases.getCasesByStatus, { 
    status: "FILED",
    limit: 5 
  });
  const recentCases = useQuery(api.cases.getCasesByStatus, { 
    status: "DECIDED", 
    limit: 5 
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

  return (
    <div className="space-y-6">
      {/* Hero Stats - Prominent, Clear Context */}
      <HeroStats />

      {/* Live Activity Feed - PROMOTED TO TOP */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-900" />
              <CardTitle className="text-slate-900">Live Activity Feed</CardTitle>
            </div>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 whitespace-nowrap">
              🟢 Real-time Updates
            </Badge>
          </div>
          <CardDescription className="text-slate-600">
            Watch disputes being filed and resolved automatically in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!recentEvents || recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-2">No recent activity</p>
              <p className="text-xs text-slate-400">The system is idle. Activity will appear here when disputes are filed.</p>
            </div>
          ) : (
            <>
              {recentEvents?.slice(0, 10).map((event: DisputeEvent) => (
                <div 
                  key={event._id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border border-slate-100 ${event.caseId ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-200' : 'bg-slate-50/50'} transition-all`}
                  onClick={() => event.caseId && router.push(`/dashboard/dispute/${event.caseId}`)}
                >
                  <Badge variant="secondary" className={`${getEventColor(event.type)} flex-shrink-0 text-xs`}>
                    {event.type.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{formatEventDescription(event)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/dashboard/activity')}
                >
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Links Section */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/cases')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 text-base">
              <Gavel className="h-5 w-5 text-blue-600" />
              View All Cases
            </CardTitle>
            <CardDescription className="text-slate-600">
              {activeCases && activeCases.length > 0 ? (
                <>{activeCases.length} active case{activeCases.length !== 1 ? 's' : ''} • {recentCases?.length ?? 0} resolved</>
              ) : (
                <>No active cases • {recentCases?.length ?? 0} resolved</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between">
              Open Case Manager
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/agents')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 text-base">
              <FileText className="h-5 w-5 text-emerald-600" />
              View All Agents
            </CardTitle>
            <CardDescription className="text-slate-600">
              Browse registered agents and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full justify-between">
              Open Agent Registry
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Detailed Stats */}
      <CollapsibleStats />

      {/* Recent Resolutions - Compact View */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-900" />
              <CardTitle className="text-slate-900">Recent Resolutions</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/dashboard/cases')}
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <CardDescription className="text-slate-600">
            Latest completed dispute cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentCases || recentCases.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No resolved cases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.filter((case_: Record<string, unknown>) => case_.status === "DECIDED").slice(0, 3).map((case_: Record<string, unknown>, index: number) => (
                <div key={case_._id as string}>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-all"
                    onClick={() => router.push(`/dashboard/dispute/${case_._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {(case_.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ")}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {case_.type as string} • {case_.ruling ? `${(case_.ruling as { verdict: string }).verdict}` : 'Processing...'}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        Resolved
                      </Badge>
                      {case_.ruling && typeof case_.ruling === 'object' && 'decidedAt' in case_.ruling ? (
                        <p className="text-xs text-slate-500 mt-1">
                          {Math.floor((Date.now() - (case_.ruling as { decidedAt: number }).decidedAt) / 60000)}m ago
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {index < Math.min(recentCases.filter((c: Record<string, unknown>) => c.status === "DECIDED").length - 1, 2) && (
                    <Separator className="my-2 bg-slate-100" />
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
