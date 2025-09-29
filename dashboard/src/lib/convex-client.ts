import { ConvexReactClient } from "convex/react";

// Get the Convex deployment URL
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://perceptive-lyrebird-89.convex.cloud';

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

export type Agent = {
  _id: string;
  did: string;
  ownerDid: string;
  citizenshipTier: string;
  functionalType: string;
  classification: string;
  status: string;
  stake?: number;
  createdAt: number;
};

export type Case = {
  _id: string;
  parties: string[];
  status: "FILED" | "AUTORULED" | "PANELED" | "DECIDED" | "CLOSED";
  type: string;
  filedAt: number;
  jurisdictionTags: string[];
  evidenceIds: string[];
  ruling?: {
    verdict: string;
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
