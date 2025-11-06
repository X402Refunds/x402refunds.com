"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SignedEvidenceCardProps {
  signedEvidence: {
    request: {
      method: string;
      path: string;
      headers?: Record<string, string | number | boolean>;
      body?: Record<string, unknown> | string;
    };
    response: {
      status: number;
      headers?: {
        contentType?: string;
        disputeUrl?: string;
        consulateAdp?: string;
        vendorDid?: string;
        other?: Record<string, unknown>;
      };
      body: string;
    };
    signature: string;
    signatureVerified: boolean;
    vendorDid: string;
  };
  description?: string;
}

export function SignedEvidenceCard({ signedEvidence, description }: SignedEvidenceCardProps) {
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [responseExpanded, setResponseExpanded] = useState(true);
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const copyToClipboard = async (text: string, type: 'request' | 'response') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'request') {
        setCopiedRequest(true);
        setTimeout(() => setCopiedRequest(false), 2000);
      } else {
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (obj: unknown) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-600";
    if (status >= 400 && status < 500) return "text-amber-600";
    if (status >= 500) return "text-red-600";
    return "text-slate-600";
  };

  return (
    <Card className="border-l-4 border-l-purple-600">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <CardTitle>What Happened (Signed Evidence)</CardTitle>
              {description && (
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-medium">Dispute Reason:</span> {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {signedEvidence.signatureVerified ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-red-50 text-red-700 border-red-200">
                <XCircle className="h-3 w-3 mr-1" />
                Unverified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Request Section */}
        <div>
          <button
            onClick={() => setRequestExpanded(!requestExpanded)}
            className="flex items-center gap-2 w-full text-left mb-2 hover:text-slate-900"
          >
            {requestExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Request (from Consumer)
            </h3>
          </button>

          <AnimatePresence>
            {requestExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-slate-400 hover:text-white h-8"
                    onClick={() => copyToClipboard(
                      `${signedEvidence.request.method} ${signedEvidence.request.path}\n${formatJson(signedEvidence.request.headers)}\n\n${formatJson(signedEvidence.request.body)}`,
                      'request'
                    )}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedRequest ? 'Copied!' : 'Copy'}
                  </Button>
                  
                  <pre className="text-sm font-mono text-slate-100 overflow-x-auto">
                    <div className="text-blue-400 font-semibold mb-2">
                      {signedEvidence.request.method} {signedEvidence.request.path}
                    </div>
                    
                    {signedEvidence.request.headers && (
                      <div className="text-slate-300 mb-2 text-xs">
                        {Object.entries(signedEvidence.request.headers).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-green-400">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {signedEvidence.request.body && (
                      <div className="mt-2 text-slate-200">
                        {formatJson(signedEvidence.request.body)}
                      </div>
                    )}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Response Section */}
        <div>
          <button
            onClick={() => setResponseExpanded(!responseExpanded)}
            className="flex items-center gap-2 w-full text-left mb-2 hover:text-slate-900"
          >
            {responseExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Response (from Merchant)
            </h3>
          </button>

          <AnimatePresence>
            {responseExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-slate-400 hover:text-white h-8"
                    onClick={() => copyToClipboard(
                      `Status: ${signedEvidence.response.status}\n${formatJson(signedEvidence.response.headers)}\n\n${signedEvidence.response.body}`,
                      'response'
                    )}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedResponse ? 'Copied!' : 'Copy'}
                  </Button>
                  
                  <pre className="text-sm font-mono text-slate-100 overflow-x-auto">
                    <div className={`font-semibold mb-2 ${getStatusColor(signedEvidence.response.status)}`}>
                      Status: {signedEvidence.response.status}
                    </div>
                    
                    {signedEvidence.response.headers && (
                      <div className="text-slate-300 mb-2 text-xs">
                        {signedEvidence.response.headers.contentType && (
                          <div>
                            <span className="text-green-400">Content-Type:</span> {signedEvidence.response.headers.contentType}
                          </div>
                        )}
                        {signedEvidence.response.headers.vendorDid && (
                          <div>
                            <span className="text-green-400">X-Vendor-DID:</span> {signedEvidence.response.headers.vendorDid}
                          </div>
                        )}
                        {signedEvidence.response.headers.disputeUrl && (
                          <div>
                            <span className="text-green-400">X-Dispute-URL:</span> {signedEvidence.response.headers.disputeUrl}
                          </div>
                        )}
                        {signedEvidence.response.headers.consulateAdp && (
                          <div>
                            <span className="text-green-400">X-Consulate-ADP:</span> {signedEvidence.response.headers.consulateAdp}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2 text-slate-200">
                      {signedEvidence.response.body}
                    </div>
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Signature Info */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            {signedEvidence.signatureVerified ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Signature verified from {signedEvidence.vendorDid}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 font-medium">
                  Signature verification failed
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono truncate">
            Signature: {signedEvidence.signature.substring(0, 64)}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

