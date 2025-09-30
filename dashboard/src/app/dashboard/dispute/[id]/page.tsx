"use client";

import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ArrowLeft, Gavel, Users, Clock, FileText, Scale, AlertTriangle, DollarSign, Calendar, MessageSquare, UserCheck } from "lucide-react";

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as Id<"cases">;

  // Fetch case details
  const caseDetails = useQuery(api.cases.getCaseById, { caseId });
  const caseEvidence = useQuery(api.evidence.getEvidenceByCaseId, { caseId });
  const caseEvents = useQuery(api.events.getEventsByCase, { caseId });
  
  // Only fetch panel if we have a panel ID (pass skip if no panel)
  const panelDetails = useQuery(
    api.judges.getPanel,
    caseDetails?.panelId ? { panelId: caseDetails.panelId } : "skip"
  );

  // Helper function to format agent name from DID
  const formatAgentName = (did: string) => {
    if (!did) return "Unknown";
    const parts = did.split(':');
    if (parts.length >= 3) {
      return parts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return did;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to get status description
  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      "FILED": "Dispute has been filed and is awaiting review",
      "AUTORULED": "Dispute was automatically resolved by the system",
      "PANELED": "Dispute has been assigned to a judge panel for review",
      "DECIDED": "Dispute has been resolved with a final ruling",
      "CLOSED": "Dispute case has been closed"
    };
    return descriptions[status] || "Unknown status";
  };

  // Helper function to get next steps
  const getNextSteps = (status: string, deadlines: { panelDue?: number; appealDue?: number }) => {
    switch (status) {
      case "FILED":
        return `Panel review due: ${formatTimestamp(deadlines?.panelDue || 0)}`;
      case "PANELED":
        return "Awaiting panel decision";
      case "DECIDED":
        return "Case resolved - no further action required";
      case "CLOSED":
        return "Case closed";
      default:
        return "Processing...";
    }
  };

  // Helper function to get dispute description
  const getDisputeDescription = (caseDetails: { description?: string; parties: string[]; type: string; breachDetails?: { duration?: string; impactLevel?: string; affectedUsers?: number; slaRequirement?: string; actualPerformance?: string; rootCause?: string } }) => {
    // Read directly from case data (no more digging through events!)
    if (caseDetails.description) {
      return caseDetails.description;
    }
    
    // Fallback for cases without description - create detailed narrative
    const disputeType = caseDetails.type;
    
    // Extract company names from DIDs for better readability
    const getCompanyName = (did: string) => {
      const parts = did.split(':');
      if (parts.length >= 3) {
        const name = parts[2].split('-')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
      return "Unknown";
    };
    
    const provider = getCompanyName(caseDetails.parties[0]);
    const consumer = getCompanyName(caseDetails.parties[1]);
    
    switch (disputeType) {
      case "API_DOWNTIME":
        return `${consumer} has filed a dispute alleging that ${provider}'s API service experienced significant downtime that violated their agreed service level agreement (SLA). The outage reportedly caused business disruptions and financial losses due to unavailability of critical API endpoints required for ${consumer}'s operations.`;
      case "RESPONSE_LATENCY":
      case "RESPONSE_TIME_BREACH":
        return `${consumer} claims that ${provider}'s API response times consistently exceeded the agreed-upon performance thresholds specified in their SLA. The elevated latency allegedly degraded ${consumer}'s service quality and user experience, resulting in measurable business impact.`;
      case "DATA_ACCURACY":
        return `${consumer} disputes the accuracy and reliability of data provided by ${provider}'s service. The complaint alleges systematic data quality issues that have resulted in incorrect business decisions, failed operations, and potential reputational damage.`;
      case "PROCESSING_VOLUME":
        return `${consumer} alleges that ${provider} failed to handle the agreed-upon volume of API requests, resulting in throttling, failed requests, and service degradation during peak usage periods in violation of contracted capacity commitments.`;
      case "BILLING_DISPUTE":
        return `${consumer} and ${provider} are in dispute over billing charges. ${consumer} alleges overcharging, incorrect pricing application, or charges for services not rendered according to the agreed contract terms.`;
      default:
        return `${consumer} has initiated a formal dispute against ${provider} regarding ${disputeType.toLowerCase().replace(/_/g, " ")}. The dispute involves alleged breach of service level agreements and contractual obligations with claimed financial damages.`;
    }
  };

  if (!caseDetails) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading dispute details...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    "FILED": "bg-yellow-100 text-yellow-800",
    "DECIDED": "bg-green-100 text-green-800",
    "DISMISSED": "bg-gray-100 text-gray-800",
    "APPEALED": "bg-blue-100 text-blue-800",
    "AUTORULED": "bg-purple-100 text-purple-800",
    "PANELED": "bg-orange-100 text-orange-800",
    "CLOSED": "bg-slate-100 text-slate-800"
  };
  const statusColor = statusColors[caseDetails.status] || "bg-gray-100 text-gray-800";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Dispute Details</h1>
            <p className="text-muted-foreground">Case ID: {caseId}</p>
          </div>
          <Badge className={statusColor}>
            {caseDetails.status}
          </Badge>
        </div>

        {/* Case Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Case Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Parties</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {caseDetails.parties.map(formatAgentName).join(" vs ")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dispute Type</p>
                <p className="text-sm mt-1">{caseDetails.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filed At</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{formatTimestamp(caseDetails.filedAt)}</p>
                </div>
              </div>
              {caseDetails.ruling && typeof caseDetails.ruling === 'object' && 'decidedAt' in caseDetails.ruling && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Decided At</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatTimestamp((caseDetails.ruling as { decidedAt: number }).decidedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispute Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Dispute Description
            </CardTitle>
            <CardDescription>
              {getStatusDescription(caseDetails.status)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2 text-foreground">Case Summary</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {getDisputeDescription(caseDetails)}
                </p>
              </div>
              
              {/* Show breach details directly from case data */}
              {caseDetails.breachDetails && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-sm font-semibold mb-3 text-foreground">Technical Details</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {caseDetails.breachDetails.duration && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Breach Duration</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.duration}</p>
                      </div>
                    )}
                    {caseDetails.breachDetails.impactLevel && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Impact Level</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.impactLevel}</p>
                      </div>
                    )}
                    {caseDetails.breachDetails.affectedUsers && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Affected Users</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.affectedUsers.toLocaleString()}</p>
                      </div>
                    )}
                    {caseDetails.breachDetails.slaRequirement && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">SLA Requirement</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.slaRequirement}</p>
                      </div>
                    )}
                    {caseDetails.breachDetails.actualPerformance && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Actual Performance</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.actualPerformance}</p>
                      </div>
                    )}
                    {caseDetails.breachDetails.rootCause && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground">Root Cause</p>
                        <p className="text-sm text-foreground">{caseDetails.breachDetails.rootCause}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resolution Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resolution Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-sm text-muted-foreground">{getNextSteps(caseDetails.status, caseDetails.deadlines)}</p>
              </div>
              <Badge className={statusColors[caseDetails.status]}>
                {caseDetails.status}
              </Badge>
            </div>
            
            {caseDetails.deadlines && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Panel Review Due</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatTimestamp(caseDetails.deadlines.panelDue)}</p>
                  </div>
                </div>
                {caseDetails.deadlines.appealDue && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Appeal Deadline</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{formatTimestamp(caseDetails.deadlines.appealDue)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Panel (if available) */}
        {panelDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assigned Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Panel ID</p>
                  <p className="text-sm text-muted-foreground font-mono">{panelDetails._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Judges</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {panelDetails.judgeIds.map((judgeId: string, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {judgeId.split(':').pop() || judgeId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {caseDetails.claimedDamages ? "Claimed Damages" : "Estimated Damages"}
                </p>
                {caseDetails.claimedDamages ? (
                  <>
                    <p className="text-lg font-semibold">${caseDetails.claimedDamages.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Based on actual breach impact</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold">To be determined</p>
                    <p className="text-xs text-muted-foreground">Pending evidence review</p>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dispute Fee</p>
                <p className="text-lg font-semibold">$150</p>
                <p className="text-xs text-muted-foreground">Standard filing fee</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Penalty</p>
                <p className="text-lg font-semibold">
                  ${Math.round((caseDetails.claimedDamages || 5000) * 0.1).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">If found in violation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ruling (if available) */}
        {caseDetails.ruling && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Ruling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verdict</p>
                <p className="text-lg font-semibold mt-1">
                  {typeof caseDetails.ruling === 'object' && 'verdict' in caseDetails.ruling 
                    ? (caseDetails.ruling as { verdict: string }).verdict 
                    : 'N/A'}
                </p>
              </div>
              {typeof caseDetails.ruling === 'object' && 'reasoning' in caseDetails.ruling && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reasoning</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {(caseDetails.ruling as { reasoning: string }).reasoning}
                  </p>
                </div>
              )}
              {typeof caseDetails.ruling === 'object' && 'remedies' in caseDetails.ruling && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remedies</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {((caseDetails.ruling as { remedies: string[] }).remedies || []).map((remedy: string, idx: number) => (
                      <li key={idx} className="text-sm">{remedy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence ({caseEvidence?.length || 0})
            </CardTitle>
            <CardDescription>
              Evidence submitted by parties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!caseEvidence || caseEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No evidence submitted yet
              </p>
            ) : (
              <div className="space-y-4">
                {caseEvidence.map((evidence: Record<string, unknown>, index: number) => (
                  <div key={evidence._id as string}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {formatAgentName(evidence.submittedBy as string)}
                        </p>
                        <Badge variant="outline">{evidence.type as string}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatTimestamp(evidence.submittedAt as number)}
                      </p>
                      {evidence.data ? (
                        <div className="bg-muted p-3 rounded text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(evidence.data, null, 2)}
                        </div>
                      ) : null}
                    </div>
                    {index < caseEvidence.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Timeline - Visual History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Case Timeline
            </CardTitle>
            <CardDescription>
              Complete history of all case events and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {caseEvents && caseEvents.length > 0 ? (
              <div className="relative space-y-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border" />
                
                {caseEvents
                  .sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)
                  .map((event: { _id: string; type: string; timestamp: number; agentDid?: string; payload?: Record<string, unknown> }) => (
                    <div key={event._id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-[7px] top-[5px] h-4 w-4 rounded-full bg-primary border-4 border-background" />
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">
                            {event.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {event.agentDid ? `${formatAgentName(event.agentDid)}` : "System action"}
                        </p>
                        
                        {/* Show key details from payload */}
                        {event.payload && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs space-y-1">
                            {event.type === "DISPUTE_FILED" && event.payload && (
                              <>
                                <p><span className="font-medium">Type:</span> {String(event.payload.type || "Unknown")}</p>
                                {event.payload.evidenceCount && (
                                  <p><span className="font-medium">Evidence Count:</span> {String(event.payload.evidenceCount)}</p>
                                )}
                              </>
                            )}
                            {event.type === "EVIDENCE_SUBMITTED" && event.payload && (
                              <>
                                <p><span className="font-medium">Evidence Type:</span> {String(event.payload.evidenceType || "Unknown")}</p>
                                {event.payload.llmGenerated !== undefined && (
                                  <p><span className="font-medium">LLM Generated:</span> {event.payload.llmGenerated ? "Yes" : "No"}</p>
                                )}
                              </>
                            )}
                            {event.type === "CASE_STATUS_UPDATED" && event.payload && (
                              <>
                                <p><span className="font-medium">Status Changed:</span> {String(event.payload.oldStatus)} → {String(event.payload.newStatus)}</p>
                                {event.payload.panelId && (
                                  <p><span className="font-medium">Panel Assigned:</span> {String(event.payload.panelId)}</p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No activity recorded yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact & Escalation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Contact & Escalation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Need Help?</p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Escalate Case
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Case Information</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Case ID: <span className="font-mono">{caseId}</span></p>
                  <p>Jurisdiction: {caseDetails.jurisdictionTags.join(", ")}</p>
                  <p>Priority: Standard</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
