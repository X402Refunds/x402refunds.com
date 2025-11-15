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
    
    // Truncate long addresses (Ethereum addresses): 0xabcd...1234
    if (did.startsWith('0x') && did.length > 15) {
      return `${did.slice(0, 6)}...${did.slice(-4)}`;
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
      {recentCases.slice(0, 10).map((case_: Record<string, unknown>, idx: number) => {
        // Get parties - handle both parties array and plaintiff/defendant fields
        const parties = case_.parties as string[] | undefined;
        const plaintiff = case_.plaintiff as string | undefined;
        const defendant = case_.defendant as string | undefined;
        
        // Use parties array if available, otherwise construct from plaintiff/defendant
        let party1: string | undefined;
        let party2: string | undefined;
        
        if (parties && parties.length >= 2) {
          party1 = parties[0];
          party2 = parties[1];
        } else if (plaintiff && defendant) {
          party1 = plaintiff;
          party2 = defendant;
        } else {
          // Skip this case if we can't determine parties
          return null;
        }

        return (
          <Link
            key={case_._id as string}
            href="/registry"
            className={`block p-2 lg:p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 ${idx >= 3 ? 'hidden lg:block' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-xs lg:text-sm text-white font-medium truncate">
                  {formatName(party1)}
                  <span className="text-slate-500 mx-1">vs</span>
                  {formatName(party2)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] lg:text-xs flex-shrink-0">
                <Clock className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-slate-500" />
                <span className="text-slate-400">{timeAgo(case_.filedAt as number)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] lg:text-xs font-medium ${getStatusColor(case_.status as string)}`}>
                {case_.status as string}
              </span>
              {case_.type != null && (
                <span className="text-[10px] lg:text-xs text-slate-500 truncate">
                  {String(case_.type).replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </Link>
        );
      }).filter(Boolean)}
    </div>
  );
}

