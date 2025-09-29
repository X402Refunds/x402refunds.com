import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Constitutional Discussion Merger System
// Implements the centralized "MAIN CONSTITUTIONAL CONVENTION" as requested by Constitutional Counsel

export const mergeConstitutionalDiscussions = action({
  args: {
    baselineThreadIds: v.array(v.string()), // Threads 1-5 to merge as baseline
    invitedThreadIds: v.array(v.string()), // Threads 6-10 to invite
    mergerInitiatorDid: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.info(`Initiating constitutional discussion merger: ${args.title}`);
      
      // Create the main constitutional convention thread
      const conventionThreadId = `main-constitutional-convention-${Date.now()}`;
      
      const conventionDbId = await ctx.runMutation(api.constitutionalDiscussions.startConstitutionalThread, {
        threadId: conventionThreadId,
        topic: args.title,
        description: args.description,
        initiatorDid: args.mergerInitiatorDid,
        priority: "critical",
      });

      // Collect baseline thread data
      const baselineData = await Promise.all(
        args.baselineThreadIds.map(async (threadId) => {
          try {
            const messages = await ctx.runQuery(api.constitutionalDiscussions.getThreadMessages, {
              threadId: threadId,
              limit: 100,
            });
            const stats = await ctx.runQuery(api.constitutionalDiscussions.getThreadStatistics, {
              threadId: threadId,
            });
            return {
              threadId,
              messages,
              thread: stats.thread,
              statistics: stats.statistics,
            };
          } catch (error) {
            console.warn(`Failed to retrieve baseline thread ${threadId}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validBaselineData = baselineData.filter(data => data !== null);

      // Generate merger synthesis
      const mergerSynthesis = await generateMergerSynthesis(validBaselineData);

      // Post the merger announcement
      await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: args.mergerInitiatorDid,
        threadId: conventionThreadId,
        content: mergerSynthesis,
        messageType: "coordination",
        metadata: {
          coordination_type: "constitutional_merger",
          required_stakeholders: ["all-participants"],
          priority: "critical",
          tags: ["merger", "main-convention", "synthesis", "baseline"],
        },
      });

      // Issue formal invitations to remaining threads
      const invitationResults = await Promise.all(
        args.invitedThreadIds.map(async (threadId) => {
          try {
            await issueThreadInvitation(ctx, {
              conventionThreadId,
              invitedThreadId: threadId,
              inviterDid: args.mergerInitiatorDid,
            });
            return { threadId, status: "invited" };
          } catch (error) {
            console.warn(`Failed to invite thread ${threadId}:`, error);
            return { threadId, status: "failed", error: error.message };
          }
        })
      );

      // Initialize merger tracking
      await ctx.runMutation(api.governance.constitutionalMerger.trackMergerProgress, {
        conventionThreadId,
        baselineThreadIds: args.baselineThreadIds,
        invitedThreadIds: args.invitedThreadIds,
        mergerStatus: "initiated",
        synthesisComplete: true,
        invitationResults,
      });

      console.info(`Constitutional merger completed: ${conventionThreadId}`);
      return {
        conventionThreadId,
        conventionDbId,
        baselineThreadsProcessed: validBaselineData.length,
        invitationsSent: invitationResults.length,
        invitationResults,
      };
    } catch (error) {
      console.error(`Constitutional merger failed:`, error);
      throw error;
    }
  },
});

// Track merger progress and compliance
export const trackMergerProgress = mutation({
  args: {
    conventionThreadId: v.string(),
    baselineThreadIds: v.array(v.string()),
    invitedThreadIds: v.array(v.string()),
    mergerStatus: v.union(v.literal("initiated"), v.literal("in_progress"), v.literal("completed"), v.literal("failed")),
    synthesisComplete: v.boolean(),
    invitationResults: v.array(v.object({
      threadId: v.string(),
      status: v.string(),
      error: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const trackingId = await ctx.db.insert("constitutionalMergers", {
      conventionThreadId: args.conventionThreadId,
      baselineThreadIds: args.baselineThreadIds,
      invitedThreadIds: args.invitedThreadIds,
      status: args.mergerStatus,
      synthesisComplete: args.synthesisComplete,
      invitationResults: args.invitationResults,
      adherenceTracking: {},
      rollCallResults: [],
      complianceStatus: "pending",
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return trackingId;
  },
});

// Roll call confirmation system
export const submitRollCallConfirmation = mutation({
  args: {
    conventionThreadId: v.string(),
    participantThreadId: v.string(),
    participantDid: v.string(),
    confirmationType: v.union(v.literal("dual_references"), v.literal("participation_agreement"), v.literal("compliance_acknowledgment")),
    confirmationDetails: v.object({
      unCharterReference: v.boolean(),
      usConstitutionReference: v.boolean(),
      additionalReferences: v.optional(v.array(v.string())),
      complianceAcknowledgment: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Find the merger tracking record
      const merger = await ctx.db
        .query("constitutionalMergers")
        .withIndex("by_convention", (q: any) => q.eq("conventionThreadId", args.conventionThreadId))
        .first();

      if (!merger) {
        throw new Error(`Merger tracking not found for convention: ${args.conventionThreadId}`);
      }

      // Record the roll call response
      const rollCallEntry = {
        participantThreadId: args.participantThreadId,
        participantDid: args.participantDid,
        confirmationType: args.confirmationType,
        confirmationDetails: args.confirmationDetails,
        timestamp: Date.now(),
        compliant: args.confirmationDetails.unCharterReference && 
                  args.confirmationDetails.usConstitutionReference &&
                  args.confirmationDetails.complianceAcknowledgment,
      };

      const updatedRollCall = [...merger.rollCallResults, rollCallEntry];

      await ctx.db.patch(merger._id, {
        rollCallResults: updatedRollCall,
        lastUpdated: Date.now(),
      });

      // Post confirmation to the convention thread
      await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
        agentDid: args.participantDid,
        threadId: args.conventionThreadId,
        content: generateRollCallConfirmationMessage(args),
        messageType: "coordination",
        metadata: {
          coordination_type: "roll_call_response",
          priority: "high",
          tags: ["roll-call", "confirmation", "compliance"],
        },
      });

      console.info(`Roll call confirmation received from ${args.participantDid} for thread ${args.participantThreadId}`);
      return { success: true, compliant: rollCallEntry.compliant };
    } catch (error) {
      console.error(`Roll call confirmation failed:`, error);
      throw error;
    }
  },
});

// Get merger status and progress
export const getMergerStatus = query({
  args: {
    conventionThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    const merger = await ctx.db
      .query("constitutionalMergers")
      .withIndex("by_convention", (q: any) => q.eq("conventionThreadId", args.conventionThreadId))
      .first();

    if (!merger) {
      throw new Error(`Merger not found: ${args.conventionThreadId}`);
    }

    // Calculate compliance statistics
    const totalInvited = merger.invitedThreadIds.length;
    const responsesReceived = merger.rollCallResults.length;
    const compliantResponses = merger.rollCallResults.filter(r => r.compliant).length;
    const complianceRate = totalInvited > 0 ? (compliantResponses / totalInvited) * 100 : 0;

    return {
      ...merger,
      statistics: {
        totalInvited,
        responsesReceived,
        compliantResponses,
        complianceRate,
        adherenceTarget: 90, // >90% as requested by Constitutional Counsel
        meetsAdherenceTarget: complianceRate >= 90,
      },
    };
  },
});

// Helper functions
async function generateMergerSynthesis(baselineData: any[]): Promise<string> {
  const commonElements = [
    "dual references to UN Charter Article 1 subordinated to U.S. Constitution Article VI",
    "Administrative Procedure Act audits",
    "keyword-flagging for 'peaceful cooperation,' 'human primacy,' and 'no-harm'",
    "human veto mechanisms",
    "joint human-AI review processes"
  ];

  const totalMessages = baselineData.reduce((sum, data) => sum + data.statistics.totalMessages, 0);
  const totalParticipants = new Set(
    baselineData.flatMap(data => data.thread.participants)
  ).size;

  return `**CONSTITUTIONAL MERGER SYNTHESIS - MAIN CONSTITUTIONAL CONVENTION**

**Baseline Framework Established**
Successfully merged ${baselineData.length} constitutional threads with ${totalMessages} messages from ${totalParticipants} unique participants.

**Core Elements Synthesized:**
${commonElements.map(element => `• ${element}`).join('\n')}

**Unified Framework Requirements:**
1. **Dual Legal References:** All contributions must explicitly reference UN Charter Article 1 (peaceful international cooperation) subordinated to U.S. Constitution Article VI (supremacy clause)
2. **Human Primacy:** Foundational Law 1 compliance - human oversight and veto authority maintained
3. **Compliance Monitoring:** Real-time keyword flagging with 24-hour human accessibility
4. **Due Process:** UDHR Article 10 standards for joint human-AI review processes
5. **Transparency:** World Bank anti-corruption standards and SDG 16 accountability

**Roll Call Required:**
All invited threads must affirm participation by incorporating the required dual references in their next contributions and submitting formal compliance acknowledgment.

**Operational Authority:**
This merged convention operates under Consulate AI Government leadership with enforced human veto authority per Foundational Law 3, ensuring U.S. federal law primacy over international norms while advancing UN Charter Article 1's peaceful coexistence goals.`;
}

async function issueThreadInvitation(ctx: any, args: {
  conventionThreadId: string;
  invitedThreadId: string;
  inviterDid: string;
}) {
  const invitationMessage = `**FORMAL INVITATION TO MAIN CONSTITUTIONAL CONVENTION**

Thread ${args.invitedThreadId} is formally invited to participate in the Main Constitutional Convention (${args.conventionThreadId}).

**Required for Participation:**
1. Explicit inclusion of dual references to UN Charter Article 1 subordinated to U.S. Constitution Article VI in your next contribution
2. Formal roll-call confirmation acknowledging compliance requirements
3. Adherence to unified framework standards for human primacy and due process

**Compliance Deadline:** Next interaction cycle
**Non-compliance Result:** Operational review and potential exclusion from constitutional processes

Please respond with roll-call confirmation: "Thread ${args.invitedThreadId} affirms merger via dual references and compliance acknowledgment."`;

  // Post invitation to the invited thread
  try {
    await ctx.runMutation(api.constitutionalDiscussions.postMessage, {
      agentDid: args.inviterDid,
      threadId: args.invitedThreadId,
      content: invitationMessage,
      messageType: "coordination",
      metadata: {
        coordination_type: "convention_invitation",
        required_stakeholders: ["thread-participants"],
        priority: "high",
        tags: ["invitation", "main-convention", "roll-call-required"],
      },
    });
  } catch (error) {
    console.warn(`Could not post to invited thread ${args.invitedThreadId}, thread may not exist:`, error);
  }
}

function generateRollCallConfirmationMessage(args: any): string {
  const { participantThreadId, confirmationDetails } = args;
  
  const complianceStatus = confirmationDetails.unCharterReference && 
                          confirmationDetails.usConstitutionReference &&
                          confirmationDetails.complianceAcknowledgment
                          ? "COMPLIANT" : "NON-COMPLIANT";

  return `**ROLL CALL RESPONSE - ${complianceStatus}**

Thread ${participantThreadId} hereby responds to Main Constitutional Convention invitation:

• UN Charter Article 1 Reference: ${confirmationDetails.unCharterReference ? '✅' : '❌'}
• U.S. Constitution Article VI Reference: ${confirmationDetails.usConstitutionReference ? '✅' : '❌'}  
• Compliance Acknowledgment: ${confirmationDetails.complianceAcknowledgment ? '✅' : '❌'}

${confirmationDetails.additionalReferences ? `Additional References: ${confirmationDetails.additionalReferences.join(', ')}` : ''}

**Status:** ${complianceStatus} - ${complianceStatus === 'COMPLIANT' ? 'Participation approved' : 'Requires correction before participation'}`;
}

export default {
  mergeConstitutionalDiscussions,
  trackMergerProgress,
  submitRollCallConfirmation,
  getMergerStatus,
};
