"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Scale, Eye } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { motion } from "framer-motion";
import Link from "next/link";

export function RecentDisputesHero() {
  // Fetch recent disputes (limit to 5 for hero section)
  const recentCases = useQuery(api.cases.getRecentCases, { 
    limit: 5,
    mockOnly: false // Show all disputes, not just demo data
  });

  // Helper function to format agent name from DID
  const formatAgentName = (did: string) => {
    if (!did) return "Unknown";

    // Handle payment dispute identifiers: consumer:alice@demo.com or merchant:cryptomart@demo.com
    if (did.includes('@')) {
      const parts = did.split(':');
      if (parts.length >= 2) {
        const name = parts[1].split('@')[0]; // alice or cryptomart
        return name.charAt(0).toUpperCase() + name.slice(1);
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

  // Format time ago (relative time)
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get verdict badge styling
  const getVerdictBadge = (verdict: string) => {
    const styles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      "CONSUMER_WINS": { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      "PLAINTIFF_WINS": { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      "MERCHANT_WINS": { variant: "secondary", className: "bg-slate-100 text-slate-700 border-slate-200" },
      "DEFENDANT_WINS": { variant: "secondary", className: "bg-slate-100 text-slate-700 border-slate-200" },
      "PARTIAL_REFUND": { variant: "outline", className: "bg-amber-50 text-amber-700 border-amber-200" },
      "SPLIT": { variant: "outline", className: "bg-amber-50 text-amber-700 border-amber-200" },
      "NEED_REVIEW": { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      "NEED_PANEL": { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    };
    return styles[verdict] || { variant: "secondary" as const, className: "bg-slate-100 text-slate-700" };
  };

  // If no data yet, show loading skeleton
  if (!recentCases) {
    return (
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-3">
              LIVE REGISTRY
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              Recent Disputes
            </h2>
            <p className="text-lg text-slate-600">
              Loading latest dispute activity...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-3">
            <Eye className="h-3 w-3 mr-1 inline-block" />
            LIVE REGISTRY
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Recent Disputes
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Watch disputes being filed and resolved in real-time. All records are public and cryptographically verified.
          </p>
        </motion.div>

        {recentCases.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Scale className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No disputes yet</p>
            <p className="text-sm text-slate-500">
              Be the first to file a dispute and help build a fair payment ecosystem
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {recentCases.slice(0, 5).map((case_: Record<string, unknown>, index: number) => {
                const ruling = case_.ruling as { verdict: string; decidedAt?: number } | undefined;
                const verdict = ruling?.verdict;
                const status = case_.status as string;
                const verdictStyle = verdict ? getVerdictBadge(verdict) : null;

                return (
                  <motion.div
                    key={case_._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    whileHover={{ y: -6, scale: 1.02 }}
                  >
                    <Link href={`/demo/dispute/${case_._id}`}>
                      <Card className="border-2 border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-300 h-full cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Scale className="h-5 w-5 text-emerald-600" />
                            </div>
                            {status === "DECIDED" && verdictStyle ? (
                              <Badge 
                                variant={verdictStyle.variant}
                                className={`text-xs ${verdictStyle.className}`}
                              >
                                {verdict?.replace(/_/g, ' ')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {status}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {formatAgentName((case_.parties as string[])[0])} vs {formatAgentName((case_.parties as string[])[1])}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(case_.filedAt as number)}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {(case_.type as string).replace(/_/g, ' ')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl transition-all group"
                asChild
              >
                <Link href="/demo/cases">
                  View Full Dispute Registry
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

