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

export default function LiveActivityFeed() {
  const router = useRouter();
  
  // REAL-TIME DATA FROM CONVEX - Only dispute activity (excludes admin/audit events)
  const recentEvents = useQuery(api.events.getDisputeActivityEvents, {
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

  // Helper function to format agent name from DID (without ID numbers)
  const formatAgentName = (did: string) => {
    if (!did) return "Unknown";

    // Handle payment dispute identifiers: consumer:alice@demo.com or merchant:cryptomart@demo.com
    if (did.includes('@')) {
      const parts = did.split(':');
      if (parts.length >= 2) {
        const role = parts[0]; // consumer or merchant
        const name = parts[1].split('@')[0]; // alice or cryptomart
        return `${name.charAt(0).toUpperCase() + name.slice(1)} (${role})`;
      }
    }

    // Handle agent DIDs: did:agent:name-company-12345
    const parts = did.split(':');
    if (parts.length >= 3) {
      // Extract just the agent name without the ID number
      const fullName = parts[2];
      // Remove the timestamp/ID suffix (everything after the last hyphen)
      const nameWithoutId = fullName.substring(0, fullName.lastIndexOf('-'));
      return nameWithoutId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return did;
  };

  // Helper function to format dispute type
  const formatDisputeType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get event color
  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      "AGENT_REGISTERED": "bg-accent text-primary border-border",
      "DISPUTE_FILED": "bg-destructive/10 text-destructive border-destructive/20", 
      "EVIDENCE_SUBMITTED": "bg-accent text-foreground border-border",
      "CASE_STATUS_UPDATED": "bg-accent text-foreground border-border"
    };
    return colors[type] || "bg-muted text-muted-foreground border-border";
  };

  // Helper function to get the badge label - just format the event type
  const getEventBadge = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatEventDescription = (event: DisputeEvent) => {
    switch (event.type) {
      case "AGENT_REGISTERED":
        return `${formatAgentName(event.payload?.did as string)} joined the platform`;
      case "DISPUTE_FILED":
        // Try to get parties from enriched caseData first, then fall back to payload
        let parties: string | undefined;
        if (event.caseData?.parties) {
          parties = (event.caseData.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ");
        } else if (event.caseData?.plaintiff && event.caseData?.defendant) {
          parties = `${formatAgentName(event.caseData.plaintiff as string)} vs ${formatAgentName(event.caseData.defendant as string)}`;
        } else if (event.payload?.parties) {
          parties = (event.payload.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ");
        } else {
          parties = "Unknown parties";
        }
        // Highlight LLM-generated disputes by checking jurisdiction tags
        const jurisdictionTags = event.payload?.jurisdictionTags as string[] || [];
        const isLLMGenerated = jurisdictionTags.includes("LLM_GENERATED");
        const llmPrefix = isLLMGenerated ? "🤖 " : "";
        return `${llmPrefix}${parties}`;
      case "EVIDENCE_SUBMITTED":
        return `${formatAgentName(event.payload?.agentDid as string)} submitted evidence`;
      case "CASE_STATUS_UPDATED":
        const caseId = event.payload?.caseId as string;
        const shortId = caseId ? caseId.substring(0, 8) : "Unknown";
        return `Case ${shortId}`;
      default:
        return event.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats - Prominent, Clear Context */}
      <HeroStats />

      {/* Live Activity Feed - PROMOTED TO TOP */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-foreground" />
              <CardTitle className="text-foreground">Live Activity Feed</CardTitle>
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              🟢 Real-time Updates
            </Badge>
          </div>
          <CardDescription>
            Watch disputes being filed and resolved automatically in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!recentEvents || recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">No recent activity</p>
              <p className="text-xs text-muted-foreground/70">The system is idle. Activity will appear here when disputes are filed.</p>
            </div>
          ) : (
            <>
              {recentEvents?.slice(0, 10).map((event: DisputeEvent) => (
                <div 
                  key={event._id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border border-border ${event.caseId ? 'cursor-pointer hover:bg-accent hover:border-border' : 'bg-muted/50'} transition-all`}
                  onClick={() => event.caseId && router.push(`/demo/dispute/${event.caseId}`)}
                >
                  <Badge variant="secondary" className={`${getEventColor(event.type)} flex-shrink-0 text-xs font-medium`}>
                    {getEventBadge(event.type)}
                  </Badge>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-foreground leading-relaxed">{formatEventDescription(event)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          second: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </span>
                      {event.type === "DISPUTE_FILED" && (() => {
                        // Show payment dispute info (amount + tier) if available
                        if (event.paymentDispute) {
                          const tierColors: Record<string, string> = {
                            micro: "text-foreground border-border bg-accent",
                            small: "text-primary border-border bg-accent",
                            medium: "text-foreground border-border bg-accent",
                            large: "text-foreground border-border bg-accent",
                            enterprise: "text-foreground border-border bg-accent"
                          };
                          const tierColor = tierColors[event.paymentDispute.pricingTier || "micro"] || "text-muted-foreground border-border bg-muted";
                          return (
                            <>
                              <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-normal ${tierColor}`}>
                                ${event.paymentDispute.amount.toFixed(2)} • {event.paymentDispute.pricingTier || "micro"} tier
                              </Badge>
                              {event.paymentDispute.disputeFee && (
                                <span className="text-[11px] text-muted-foreground">
                                  (${event.paymentDispute.disputeFee.toFixed(2)} fee)
                                </span>
                              )}
                            </>
                          );
                        }

                        // Show agent dispute type if available
                        const disputeType = event.payload?.type;
                        if (typeof disputeType === "string") {
                          return (
                            <Badge variant="outline" className="text-[11px] px-2 py-0.5 text-muted-foreground border-border bg-muted font-normal">
                              {formatDisputeType(disputeType)}
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/demo/activity')}
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
        <Card className="border-border hover:border-primary transition-colors cursor-pointer" onClick={() => router.push('/demo/cases')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <Gavel className="h-5 w-5 text-primary" />
              View All Cases
            </CardTitle>
            <CardDescription>
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

        <Card className="border-border hover:border-primary transition-colors cursor-pointer" onClick={() => router.push('/demo/agents')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <FileText className="h-5 w-5 text-primary" />
              View All Agents
            </CardTitle>
            <CardDescription>
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
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-foreground" />
              <CardTitle className="text-foreground">Recent Resolutions</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/demo/cases')}
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <CardDescription>
            Latest completed dispute cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentCases || recentCases.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No resolved cases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.filter((case_: Record<string, unknown>) => case_.status === "DECIDED").slice(0, 3).map((case_: Record<string, unknown>, index: number) => (
                <div key={case_._id as string}>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-accent p-3 rounded-lg border border-border hover:border-border transition-all"
                    onClick={() => router.push(`/demo/dispute/${case_._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(case_.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {case_.type as string} • {case_.ruling ? `${(case_.ruling as { verdict: string }).verdict}` : 'Processing...'}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        Resolved
                      </Badge>
                      {case_.ruling && typeof case_.ruling === 'object' && 'decidedAt' in case_.ruling ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor((Date.now() - (case_.ruling as { decidedAt: number }).decidedAt) / 60000)}m ago
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {index < Math.min(recentCases.filter((c: Record<string, unknown>) => c.status === "DECIDED").length - 1, 2) && (
                    <Separator className="my-2" />
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
