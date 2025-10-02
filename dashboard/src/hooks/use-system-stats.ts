/**
 * Shared hook for fetching cached system statistics
 * 
 * Provides consistent null-safety and error handling across all dashboard pages.
 * Data is cached and updated every 5 minutes by backend cron job.
 * 
 * Usage:
 *   const stats = useSystemStats();
 *   return <div>{stats.totalCases} disputes</div>
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface SystemStats {
  // Core metrics
  totalAgents: number;
  activeAgents: number;
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  
  // Performance metrics
  avgResolutionTimeMs: number;
  avgResolutionTimeMinutes: number;
  
  // 24h activity metrics
  agentRegistrationsLast24h: number;
  casesFiledLast24h: number;
  casesResolvedLast24h: number;
  
  // Cache metadata
  lastUpdated: number;
  calculationTimeMs?: number;
  isCached: boolean;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Hook to fetch cached system statistics
 * Returns safe defaults (0) for all metrics if data is not yet available
 */
export function useSystemStats(): SystemStats {
  const cachedStats = useQuery(api.cases.getCachedSystemStats);
  
  // Return safe defaults while loading or if cache is empty
  if (!cachedStats) {
    return {
      totalAgents: 0,
      activeAgents: 0,
      totalCases: 0,
      resolvedCases: 0,
      pendingCases: 0,
      avgResolutionTimeMs: 0,
      avgResolutionTimeMinutes: 0,
      agentRegistrationsLast24h: 0,
      casesFiledLast24h: 0,
      casesResolvedLast24h: 0,
      lastUpdated: Date.now(),
      calculationTimeMs: 0,
      isCached: false,
      isLoading: true,
    };
  }
  
  // Return cached stats with safe defaults for any missing fields
  return {
    totalAgents: cachedStats.totalAgents ?? 0,
    activeAgents: cachedStats.activeAgents ?? 0,
    totalCases: cachedStats.totalCases ?? 0,
    resolvedCases: cachedStats.resolvedCases ?? 0,
    pendingCases: cachedStats.pendingCases ?? 0,
    avgResolutionTimeMs: cachedStats.avgResolutionTimeMs ?? 0,
    avgResolutionTimeMinutes: cachedStats.avgResolutionTimeMinutes ?? 0,
    agentRegistrationsLast24h: cachedStats.agentRegistrationsLast24h ?? 0,
    casesFiledLast24h: cachedStats.casesFiledLast24h ?? 0,
    casesResolvedLast24h: cachedStats.casesResolvedLast24h ?? 0,
    lastUpdated: cachedStats.lastUpdated ?? Date.now(),
    calculationTimeMs: ('calculationTimeMs' in cachedStats) ? cachedStats.calculationTimeMs : undefined,
    isCached: cachedStats.isCached ?? false,
    isLoading: false,
  };
}

/**
 * Format resolution time for display
 */
export function formatResolutionTime(minutes: number): string {
  if (minutes === 0) return "—";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format large numbers for display (e.g., 1234 -> "1.2K")
 */
export function formatNumber(num: number): string {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

