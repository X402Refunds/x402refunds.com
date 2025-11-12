"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Clock } from "lucide-react";
import Link from "next/link";

export function RecentDisputesFeed() {
  const recentCases = useQuery(api.cases.getRecentCases, { limit: 10 });

  // Loading state
  if (recentCases === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-slate-400 text-sm">Loading disputes...</div>
      </div>
    );
  }

  // Helper function to format agent name from DID
  const formatName = (did: string) => {
    if (!did) return "Unknown";

    // Handle payment dispute identifiers: consumer:alice@demo.com or merchant:cryptomart@demo.com
    if (did.includes('@')) {
      const parts = did.split(':');
      if (parts.length >= 2) {
        const name = parts[1].split('@')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }

    // Handle agent DIDs: did:agent:name-company-12345
    const parts = did.split(':');
    if (parts.length >= 3) {
      const fullName = parts[2];
      const nameWithoutId = fullName.substring(0, fullName.lastIndexOf('-'));
      return nameWithoutId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return did.substring(0, 20);
  };

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    if (status === "DECIDED") return "text-emerald-400";
    if (status === "FILED") return "text-blue-400";
    return "text-slate-400";
  };

  if (!recentCases || recentCases.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
        <div className="text-slate-400 text-sm mb-2">No disputes yet</div>
        <div className="text-slate-500 text-xs">System is ready. Disputes will appear here as they&apos;re filed.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-700">
      {recentCases.slice(0, 10).map((case_: Record<string, unknown>) => {
        const parties = case_.parties as string[] | undefined;
        if (!parties || parties.length < 2) return null;

        return (
          <Link
            key={case_._id as string}
            href="/registry"
            className="block p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">
                  {formatName(parties[0])}
                  <span className="text-slate-500 mx-1">vs</span>
                  {formatName(parties[1])}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                <Clock className="h-3 w-3 text-slate-500" />
                <span className="text-slate-400">{timeAgo(case_.filedAt as number)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${getStatusColor(case_.status as string)}`}>
                {case_.status as string}
              </span>
              <span className="text-xs text-slate-500">
                {(case_.type as string).replace(/_/g, ' ')}
              </span>
            </div>
          </Link>
        );
      }).filter(Boolean)}
    </div>
  );
}

