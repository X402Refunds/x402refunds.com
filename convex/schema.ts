import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  owners: defineTable({
    did: v.string(),
    verificationTier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")),
    pubkeys: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_did", ["did"]),

  agents: defineTable({
    did: v.string(),
    ownerDid: v.string(),
    buildHash: v.optional(v.string()),
    configHash: v.optional(v.string()),
    // New: Support all agent types from the spec
    agentType: v.union(
      v.literal("session"),     // 4h max, observer only
      v.literal("ephemeral"),   // 24h max, sponsored
      v.literal("physical"),    // Robots/IoT with location
      v.literal("verified"),    // Full citizenship
      v.literal("premium")      // Enhanced powers
    ),
    tier: v.union(v.literal("basic"), v.literal("verified"), v.literal("premium")), // Keep for backward compatibility
    stake: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("banned"), v.literal("expired")),
    
    // Agent lifecycle fields
    expiresAt: v.optional(v.number()),        // For ephemeral/session agents
    sponsor: v.optional(v.string()),          // Sponsor DID for ephemeral agents
    maxLifetime: v.optional(v.number()),      // Max lifetime in ms
    
    // Physical agent attestation
    deviceAttestation: v.optional(v.object({
      deviceId: v.string(),
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(), 
        timestamp: v.number(),
        accuracy: v.optional(v.number())
      })),
      capabilities: v.array(v.string()),       // ["camera", "actuator", "sensor"]
      hardwareSignature: v.optional(v.string())
    })),
    
    // Voting rights by agent type
    votingRights: v.optional(v.object({
      constitutional: v.boolean(),
      judicial: v.boolean()
    })),
    
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_owner", ["ownerDid"])
    .index("by_status", ["status"])
    .index("by_type", ["agentType"])
    .index("by_expires", ["expiresAt"]),

  constitutions: defineTable({
    version: v.string(),
    policyHash: v.string(),
    bundleUrl: v.string(),
    signature: v.string(),
    activeFrom: v.number(),
    meta: v.object({
      title: v.string(),
      description: v.string(),
      author: v.string(),
    }),
  })
    .index("by_version", ["version"])
    .index("by_active_from", ["activeFrom"]),

  cases: defineTable({
    parties: v.array(v.string()), // agent DIDs
    status: v.union(
      v.literal("FILED"),
      v.literal("AUTORULED"),
      v.literal("PANELED"),
      v.literal("DECIDED"),
      v.literal("CLOSED")
    ),
    type: v.string(),
    filedAt: v.number(),
    jurisdictionTags: v.array(v.string()),
    evidenceIds: v.array(v.id("evidenceManifests")),
    panelId: v.optional(v.id("panels")),
    deadlines: v.object({
      panelDue: v.number(),
      appealDue: v.optional(v.number()),
    }),
  })
    .index("by_status", ["status"])
    .index("by_filed_at", ["filedAt"]),

  evidenceManifests: defineTable({
    caseId: v.optional(v.id("cases")),
    agentDid: v.string(),
    sha256: v.string(),
    uri: v.string(),
    signer: v.string(),
    ts: v.number(),
    model: v.object({
      provider: v.string(),
      name: v.string(),
      version: v.string(),
      seed: v.optional(v.number()),
      temp: v.optional(v.number()),
    }),
    tool: v.optional(v.string()),
  })
    .index("by_case", ["caseId"])
    .index("by_agent", ["agentDid"])
    .index("by_sha256", ["sha256"])
    .index("by_timestamp", ["ts"]),

  judges: defineTable({
    did: v.string(),
    name: v.string(),
    specialties: v.array(v.string()),
    reputation: v.number(),
    casesJudged: v.number(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  })
    .index("by_did", ["did"])
    .index("by_status", ["status"]),

  panels: defineTable({
    judgeIds: v.array(v.string()),
    assignedAt: v.number(),
    dueAt: v.number(),
    votes: v.optional(v.array(v.object({
      judgeId: v.string(),
      code: v.string(),
      reasons: v.string(),
    }))),
  })
    .index("by_assigned_at", ["assignedAt"])
    .index("by_due_at", ["dueAt"]),

  rulings: defineTable({
    caseId: v.id("cases"),
    verdict: v.union(
      v.literal("UPHELD"),
      v.literal("DISMISSED"),
      v.literal("SPLIT"),
      v.literal("NEED_PANEL")
    ),
    code: v.string(),
    reasons: v.string(),
    auto: v.boolean(),
    decidedAt: v.number(),
    proof: v.optional(v.object({
      merkleRoot: v.string(),
      rekorId: v.optional(v.string()),
    })),
  })
    .index("by_case", ["caseId"])
    .index("by_decided_at", ["decidedAt"])
    .index("by_verdict", ["verdict"]),

  precedents: defineTable({
    code: v.string(),
    summary: v.string(),
    rulingId: v.id("rulings"),
    ts: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_timestamp", ["ts"]),

  reputation: defineTable({
    agentDid: v.string(),
    score: v.number(),
    strikes: v.number(),
    volume: v.number(),
    lastUpdate: v.number(),
  }).index("by_agent", ["agentDid"]),

  events: defineTable({
    type: v.string(),
    payload: v.any(),
    ts: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["ts"]),

  // New: Agent sponsorship system for ephemeral agents
  sponsorships: defineTable({
    sponsorDid: v.string(),
    sponsoredDid: v.string(),
    maxLiability: v.number(),
    purposes: v.array(v.string()),        // ["testing", "demo", "trial"]
    expiresAt: v.number(),
    currentLiability: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sponsor", ["sponsorDid"])
    .index("by_sponsored", ["sponsoredDid"])
    .index("by_active", ["active"]),

  // New: Agent cleanup queue for expired agents
  agentCleanupQueue: defineTable({
    agentDid: v.string(),
    agentType: v.string(),
    expiresAt: v.number(),
    cleanupActions: v.array(v.string()),  // Actions to perform on cleanup
    status: v.union(v.literal("PENDING"), v.literal("IN_PROGRESS"), v.literal("COMPLETED")),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_agent", ["agentDid"])
    .index("by_expires", ["expiresAt"])
    .index("by_status", ["status"]),

  // API keys for Bearer token authentication
  apiKeys: defineTable({
    token: v.string(),              // The actual API key (ak_live_...)
    agentId: v.id("agents"),        // Which agent this key belongs to
    active: v.boolean(),            // Whether key is active
    expiresAt: v.optional(v.number()), // Optional expiration
    permissions: v.array(v.string()), // Specific permissions for this key
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_agent", ["agentId"])
    .index("by_active", ["active"]),

  // New: Enhanced evidence for physical agents
  physicalEvidence: defineTable({
    evidenceId: v.id("evidenceManifests"),
    agentDid: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
      accuracy: v.optional(v.number()),
    }),
    sensorData: v.optional(v.object({
      type: v.string(),                   // "camera", "lidar", "temperature"
      reading: v.any(),
      calibration: v.optional(v.any()),
    })),
    actuatorCommands: v.optional(v.object({
      device: v.string(),                 // "arm", "wheel", "gripper"
      command: v.any(),
      executionResult: v.any(),
    })),
    environmentContext: v.optional(v.object({
      temperature: v.optional(v.number()),
      lighting: v.string(),               // "indoor", "outdoor", "artificial", "dark"
      weatherConditions: v.optional(v.string()),
      surroundingObjects: v.optional(v.array(v.string())),
    })),
    createdAt: v.number(),
  })
    .index("by_evidence", ["evidenceId"])
    .index("by_agent", ["agentDid"])
    .index("by_timestamp", ["createdAt"]),
});
