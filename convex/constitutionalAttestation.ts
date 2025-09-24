import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { CONSTITUTIONAL_PLEDGE } from "./prompts/promptLoader";

/**
 * Constitutional Attestation System
 * Every agent must sign the constitutional pledge before participating in governance
 */

// Record constitutional attestation 
export const recordConstitutionalAttestation = mutation({
  args: {
    agentDid: v.string(),
    pledgeHash: v.string(), // SHA-256 hash of the pledge text
    attestationSignature: v.string(), // Digital signature of pledge + agent DID + timestamp
    witnessSignature: v.optional(v.string()), // Optional human witness signature
    attestationType: v.union(
      v.literal("self_attestation"),  // Agent self-signs
      v.literal("human_witnessed"),   // Human operator witnesses
      v.literal("hardware_secured")   // Hardware-secured signing for physical agents
    ),
    metadata: v.optional(v.object({
      deviceId: v.optional(v.string()),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
        timestamp: v.number()
      })),
      witnessIdentity: v.optional(v.string()),
      signingAlgorithm: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    // Verify agent exists and is not already attested
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_did", (q) => q.eq("did", args.agentDid))
      .first();

    if (!agent) {
      throw new Error(`Agent ${args.agentDid} not found`);
    }

    // Check if already attested
    const existing = await ctx.db
      .query("constitutionalAttestations")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .first();

    if (existing && existing.status === "valid") {
      throw new Error(`Agent ${args.agentDid} already has valid constitutional attestation`);
    }

    const now = Date.now();
    
    // Create attestation record
    const attestationId = await ctx.db.insert("constitutionalAttestations", {
      agentDid: args.agentDid,
      pledgeHash: args.pledgeHash,
      pledgeText: CONSTITUTIONAL_PLEDGE,
      attestationSignature: args.attestationSignature,
      witnessSignature: args.witnessSignature,
      attestationType: args.attestationType,
      status: "valid",
      attestedAt: now,
      expiresAt: now + (365 * 24 * 60 * 60 * 1000), // 1 year validity
      metadata: args.metadata,
      createdAt: now,
    });

    // Update agent status to include constitutional compliance
    await ctx.db.patch(agent._id, {
      constitutionalStatus: "attested",
      attestationId: attestationId,
      updatedAt: now,
    });

    // Log attestation event
    await ctx.db.insert("events", {
      type: "CONSTITUTIONAL_ATTESTATION",
      payload: {
        agentDid: args.agentDid,
        attestationId: attestationId,
        attestationType: args.attestationType,
        pledgeHash: args.pledgeHash,
      },
      timestamp: now,
      agentDid: args.agentDid,
    });

    console.info(`Constitutional attestation recorded for ${args.agentDid}`);
    return attestationId;
  }
});

// Verify constitutional compliance before allowing governance actions
export const verifyConstitutionalCompliance = query({
  args: {
    agentDid: v.string(),
  },
  handler: async (ctx, args) => {
    const attestation = await ctx.db
      .query("constitutionalAttestations")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .first();

    if (!attestation) {
      return {
        compliant: false,
        reason: "No constitutional attestation found",
        status: "not_attested"
      };
    }

    if (attestation.status !== "valid") {
      return {
        compliant: false,
        reason: `Attestation status: ${attestation.status}`,
        status: attestation.status
      };
    }

    if (attestation.expiresAt && Date.now() > attestation.expiresAt) {
      return {
        compliant: false,
        reason: "Constitutional attestation expired",
        status: "expired"
      };
    }

    return {
      compliant: true,
      attestationId: attestation._id,
      attestedAt: attestation.attestedAt,
      attestationType: attestation.attestationType,
      status: "compliant"
    };
  }
});

// Get constitutional attestation details
export const getConstitutionalAttestation = query({
  args: {
    agentDid: v.string(),
  },
  handler: async (ctx, args) => {
    const attestation = await ctx.db
      .query("constitutionalAttestations")
      .withIndex("by_agent", (q) => q.eq("agentDid", args.agentDid))
      .first();

    if (!attestation) {
      return null;
    }

    return {
      agentDid: attestation.agentDid,
      pledgeHash: attestation.pledgeHash,
      attestationType: attestation.attestationType,
      status: attestation.status,
      attestedAt: attestation.attestedAt,
      expiresAt: attestation.expiresAt,
      metadata: attestation.metadata,
      // Don't return actual signatures for security
    };
  }
});

export default {
  recordConstitutionalAttestation,
  verifyConstitutionalCompliance,
  getConstitutionalAttestation,
};
