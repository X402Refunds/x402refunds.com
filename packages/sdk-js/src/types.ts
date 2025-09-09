import { z } from 'zod';

// Model information schema
export const ModelInfoSchema = z.object({
  provider: z.string(),
  name: z.string(),
  version: z.string(),
  seed: z.number().optional(),
  temp: z.number().min(0).max(2).optional(),
});

// Tool call entry schema
export const ToolCallEntrySchema = z.object({
  tool: z.string(),
  inputHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  outputHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  requestTs: z.number(),
  responseTs: z.number(),
  model: ModelInfoSchema,
});

// Agent Evidence Bundle schema
export const AEBSchema = z.object({
  version: z.literal('1.0'),
  agentDid: z.string(),
  ownerDid: z.string(),
  entries: z.array(ToolCallEntrySchema),
  contextHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
  signer: z.string(),
  signature: z.string(),
  aebHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

// Evidence manifest schema
export const EvidenceManifestSchema = z.object({
  agentDid: z.string(),
  sha256: z.string(),
  uri: z.string(),
  signer: z.string(),
  model: ModelInfoSchema,
  tool: z.string().optional(),
  caseId: z.string().optional(),
});

// Case schema
export const CaseSchema = z.object({
  parties: z.array(z.string()),
  type: z.string(),
  jurisdictionTags: z.array(z.string()),
  evidenceIds: z.array(z.string()),
});

// Type exports
export type ModelInfo = z.infer<typeof ModelInfoSchema>;
export type ToolCallEntry = z.infer<typeof ToolCallEntrySchema>;
export type AEB = z.infer<typeof AEBSchema>;
export type EvidenceManifest = z.infer<typeof EvidenceManifestSchema>;
export type Case = z.infer<typeof CaseSchema>;

// Storage configuration
export interface StorageConfig {
  driver: 'r2' | 'b2';
  accountId?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
}

// Agent configuration
export interface AgentConfig {
  did: string;
  ownerDid: string;
  privateKey: string; // hex encoded
  courtApiUrl: string;
  storage: StorageConfig;
}

// Tool wrapper options
export interface WrapperOptions {
  toolName: string;
  model: ModelInfo;
  context?: Record<string, any>;
}
