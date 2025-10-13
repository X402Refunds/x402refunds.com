import { ConvexReactClient } from "convex/react";

// Get the Convex deployment URL
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://api.consulatehq.com';

// Create Convex client for React
export const convex = new ConvexReactClient(CONVEX_URL);

// Types for our dispute resolution system
export type DisputeEvent = {
  _id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  agentDid?: string;
  caseId?: string;
};

export type AgentReputation = {
  _id: string;
  agentDid: string;
  casesFiled: number;
  casesDefended: number;
  casesWon: number;
  casesLost: number;
  slaViolations: number;
  violationsAgainstThem: number;
  winRate: number;
  reliabilityScore: number;
  overallScore: number;
  lastUpdated: number;
  createdAt: number;
};

export type Agent = {
  _id: string;
  did: string;
  ownerDid: string;
  name: string;
  organizationName?: string;
  mock: boolean; // true = test/demo data, false = real production agent
  functionalType?: string;
  status: string;
  createdAt: number;
  reputation?: AgentReputation;
};

export type Case = {
  _id: string;
  plaintiff: string;
  defendant: string;
  parties: string[];
  status: "FILED" | "AUTORULED" | "PANELED" | "DECIDED" | "CLOSED";
  type: string;
  filedAt: number;
  jurisdictionTags: string[];
  evidenceIds: string[];
  ruling?: {
    verdict: string;
    winner?: string;
    auto: boolean;
    decidedAt: number;
  };
};

export type SystemStats = {
  totalEvents: number;
  agentRegistrations: number;
  disputesFiled: number;
  evidenceSubmitted: number;
  casesResolved: number;
  timeRange: number;
  periodStart: number;
  periodEnd: number;
};
