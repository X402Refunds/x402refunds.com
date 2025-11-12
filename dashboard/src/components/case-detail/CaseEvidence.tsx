"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, ShieldCheck, User, Clock } from "lucide-react";

interface Evidence {
  _id: string;
  agentDid: string;
  uri: string;
  sha256: string;
  ts: number;
  signer: string;
  tool?: string;
}

interface SignedEvidence {
  signature: string;
  signatureVerified: boolean;
  vendorDid: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

interface CaseEvidenceProps {
  evidence?: Evidence[];
  signedEvidence?: SignedEvidence;
  expectedEvidenceCount?: number;
}

export function CaseEvidence({ 
  evidence = [], 
  signedEvidence,
  expectedEvidenceCount = 0
}: CaseEvidenceProps) {
  const totalEvidence = evidence.length + (signedEvidence ? 1 : 0);
  const completeness = expectedEvidenceCount > 0 
    ? Math.min(100, Math.round((totalEvidence / expectedEvidenceCount) * 100))
    : totalEvidence > 0 ? 100 : 0;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence Submitted
          </CardTitle>
          <Badge variant="outline" className="text-base px-3 py-1">
            {totalEvidence} {totalEvidence === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Evidence Completeness */}
        {expectedEvidenceCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Evidence Completeness
              </p>
              <span className="text-sm font-bold text-foreground">
                {totalEvidence} of {expectedEvidenceCount}
              </span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>
        )}

        {/* Signed Evidence (Cryptographically Verified) */}
        {signedEvidence && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-emerald-900">
                    Cryptographically Signed Evidence
                  </h4>
                  <Badge className="bg-emerald-500 text-white text-xs">
                    Verified ✓
                  </Badge>
                </div>
                <p className="text-sm text-emerald-700 mb-3">
                  This evidence has been cryptographically signed and verified by the vendor.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Vendor DID</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-emerald-200 block truncate">
                      {signedEvidence.vendorDid}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Signature Status</p>
                    <p className="text-xs font-mono">
                      {signedEvidence.signatureVerified ? '✓ Valid' : '✗ Invalid'}
                    </p>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="text-xs font-semibold text-emerald-700 cursor-pointer hover:text-emerald-800">
                    View signature details
                  </summary>
                  <div className="mt-2 p-2 bg-white rounded border border-emerald-200">
                    <code className="text-xs break-all">
                      {signedEvidence.signature}
                    </code>
                  </div>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Regular Evidence Items */}
        {evidence.length > 0 ? (
          <div className="space-y-3">
            {evidence.map((item, index) => (
              <div 
                key={item._id} 
                className="flex items-start gap-3 p-4 bg-muted rounded-lg border"
              >
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      Evidence Item #{index + 1}
                    </h4>
                    {item.tool && (
                      <Badge variant="outline" className="text-xs">
                        {item.tool}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-2 text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {item.agentDid}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.ts).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground">
                      View technical details
                    </summary>
                    <div className="mt-2 space-y-1 text-xs">
                      <div>
                        <span className="font-semibold">SHA-256:</span>
                        <code className="ml-2 bg-background px-1 py-0.5 rounded text-xs break-all">
                          {item.sha256}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold">URI:</span>
                        <code className="ml-2 bg-background px-1 py-0.5 rounded text-xs break-all">
                          {item.uri}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold">Signer:</span>
                        <code className="ml-2 bg-background px-1 py-0.5 rounded text-xs break-all">
                          {item.signer}
                        </code>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        ) : !signedEvidence ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No evidence submitted yet</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

