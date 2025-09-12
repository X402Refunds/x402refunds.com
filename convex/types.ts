// Type definitions for Agent Court
import { z } from "zod";

export interface Owner {
  did: string;
  verificationTier: "basic" | "verified" | "premium";
  pubkeys: string[];
  createdAt: number;
}

export interface Agent {
  did: string;
  ownerDid: string;
  buildHash?: string;
  configHash?: string;
  agentType: "session" | "ephemeral" | "physical" | "verified" | "premium";
  tier: "basic" | "verified" | "premium";
  stake?: number;
  status: "active" | "suspended" | "banned" | "expired";
  
  // Agent lifecycle fields
  expiresAt?: number;
  sponsor?: string;
  maxLifetime?: number;
  
  // Physical agent attestation
  deviceAttestation?: {
    deviceId: string;
    location?: {
      lat: number;
      lng: number;
      timestamp: number;
      accuracy?: number;
    };
    capabilities: string[];
    hardwareSignature?: string;
  };
  
  // Voting rights by agent type
  votingRights?: {
    constitutional: boolean;
    judicial: boolean;
  };
  
  createdAt: number;
}

export interface Constitution {
  version: string;
  policyHash: string;
  bundleUrl: string;
  signature: string;
  activeFrom: number;
  meta: {
    title: string;
    description: string;
    author: string;
  };
}

// Note: Case validation is handled by Convex schema, not Zod

export const EvidenceManifestSchema = z.object({
  caseId: z.string().optional(),
  agentDid: z.string(),
  sha256: z.string(),
  uri: z.string(),
  signer: z.string(),
  ts: z.number(),
  model: z.object({
    provider: z.string(),
    name: z.string(),
    version: z.string(),
    seed: z.number().optional(),
    temp: z.number().optional(),
  }),
  tool: z.string().optional(),
});

export const PanelSchema = z.object({
  judgeIds: z.array(z.string()),
  assignedAt: z.number(),
  dueAt: z.number(),
  votes: z.array(z.object({
    judgeId: z.string(),
    code: z.string(),
    reasons: z.string(),
  })).optional(),
});

export const RulingSchema = z.object({
  caseId: z.string(),
  verdict: z.enum(["UPHELD", "DISMISSED", "SPLIT", "NEED_PANEL"]),
  code: z.string(),
  reasons: z.string(),
  auto: z.boolean(),
  decidedAt: z.number(),
  proof: z.object({
    merkleRoot: z.string(),
    rekorId: z.string().optional(),
  }).optional(),
});

export const PrecedentSchema = z.object({
  code: z.string(),
  summary: z.string(),
  rulingId: z.string(),
  ts: z.number(),
});

export const ReputationSchema = z.object({
  agentDid: z.string(),
  score: z.number(),
  strikes: z.number(),
  volume: z.number(),
  lastUpdate: z.number(),
});

export const EventSchema = z.object({
  type: z.string(),
  payload: z.any(),
  ts: z.number(),
});

// Type exports
export type EvidenceManifest = z.infer<typeof EvidenceManifestSchema>;
export type Panel = z.infer<typeof PanelSchema>;
export type Ruling = z.infer<typeof RulingSchema>;
export type Precedent = z.infer<typeof PrecedentSchema>;
export type Reputation = z.infer<typeof ReputationSchema>;
export type Event = z.infer<typeof EventSchema>;

// New interfaces for agent lifecycle management
export interface Sponsorship {
  sponsorDid: string;
  sponsoredDid: string;
  maxLiability: number;
  purposes: string[];
  expiresAt: number;
  currentLiability: number;
  active: boolean;
  createdAt: number;
}

export interface AgentCleanupTask {
  agentDid: string;
  agentType: string;
  expiresAt: number;
  cleanupActions: string[];
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  createdAt: number;
  completedAt?: number;
}

export interface PhysicalEvidence {
  evidenceId: string;
  agentDid: string;
  location: {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy?: number;
  };
  sensorData?: {
    type: string;
    reading: any;
    calibration?: any;
  };
  actuatorCommands?: {
    device: string;
    command: any;
    executionResult: any;
  };
  environmentContext?: {
    temperature?: number;
    lighting: string;
    weatherConditions?: string;
    surroundingObjects?: string[];
  };
  createdAt: number;
}
