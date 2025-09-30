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
import { ArrowLeft, Gavel, Users, Clock, FileText, Scale } from "lucide-react";

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as Id<"cases">;

  // Fetch case details
  const caseDetails = useQuery(api.cases.getCaseById, { caseId });
  const caseEvidence = useQuery(api.evidence.getEvidenceByCaseId, { caseId });

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
      </div>
    </DashboardLayout>
  );
}
