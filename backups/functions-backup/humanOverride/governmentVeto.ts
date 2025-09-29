// GOVERNMENT VETO POWERS & CONSTITUTIONAL APPROVAL GATES
// Ensures human governments maintain absolute authority over AI constitutional development

import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Helper mutations for constitutional approval system
export const recordConstitutionalViolation = mutation({
  args: {
    type: v.string(),
    agentId: v.string(),
    changeId: v.optional(v.string()),
    timestamp: v.number(),
    severity: v.string(),
    blocked: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("constitutionalViolations", args);
  },
});

export const createConstitutionalApproval = mutation({
  args: {
    approvalId: v.string(),
    changeId: v.string(),
    constitutionalChange: v.object({
      type: v.string(),
      content: v.string(),
      articleId: v.string(),
      proposedBy: v.string(),
      title: v.optional(v.string()),
      category: v.optional(v.string()),
    }),
    requiredApprovals: v.array(v.string()),
    reviewDeadline: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("constitutionalApprovals", {
      ...args,
      receivedApprovals: [],
      pendingApprovals: args.requiredApprovals,
      status: "PENDING_HUMAN_REVIEW",
      humanExpertAssigned: false,
      timestamp: Date.now(),
    });
  },
});

export const updateConstitutionalApproval = mutation({
  args: {
    approvalId: v.string(),
    status: v.optional(v.string()),
    finalizedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db
      .query("constitutionalApprovals")
      .withIndex("by_approval_id", (q) => q.eq("approvalId", args.approvalId))
      .first();
    
    if (!approval) {
      throw new Error(`Constitutional approval not found: ${args.approvalId}`);
    }
    
    return await ctx.db.patch(approval._id, {
      status: args.status,
      finalizedAt: args.finalizedAt,
    });
  },
});

// GOVERNMENT VETO AUTHORITIES
export const VETO_AUTHORITIES = {
  "UN_SECURITY_COUNCIL": {
    level: "GLOBAL_SUPREME",
    vetoScope: "ANY_CONSTITUTIONAL_PROVISION",
    votingRequirement: "SIMPLE_MAJORITY", // 8 of 15 members
    permanentMembers: ["USA", "UK", "FRANCE", "RUSSIA", "CHINA"],
    canBlockIndefinitely: true,
    emergencyVeto: true
  },
  
  "UN_GENERAL_ASSEMBLY": {
    level: "GLOBAL_DEMOCRATIC",
    vetoScope: "ANY_CONSTITUTIONAL_PROVISION", 
    votingRequirement: "TWO_THIRDS_MAJORITY",
    allMembers: true,
    canBlockIndefinitely: false,
    emergencyVeto: false
  },
  
  "PARTICIPATING_GOVERNMENT": {
    level: "NATIONAL",
    vetoScope: "PROVISIONS_AFFECTING_SOVEREIGNTY",
    votingRequirement: "SINGLE_GOVERNMENT",
    canWithdrawFromSystem: true,
    canBlockIndefinitely: "FOR_NATIONAL_PROVISIONS",
    emergencyVeto: true
  },
  
  "CONSTITUTIONAL_OVERSIGHT_BOARD": {
    level: "LEGAL_EXPERT",
    vetoScope: "LEGAL_COMPLIANCE_VIOLATIONS",
    votingRequirement: "MAJORITY_OF_EXPERTS", 
    humanExpertsOnly: true,
    canBlockIndefinitely: false,
    emergencyVeto: true
  },
  
  "HUMAN_RIGHTS_COUNCIL": {
    level: "RIGHTS_PROTECTION",
    vetoScope: "HUMAN_RIGHTS_VIOLATIONS",
    votingRequirement: "SIMPLE_MAJORITY",
    canBlockIndefinitely: "FOR_RIGHTS_VIOLATIONS",
    emergencyVeto: true
  }
};

// CONSTITUTIONAL APPROVAL REQUIREMENTS
export const APPROVAL_REQUIREMENTS = {
  "NEW_CONSTITUTIONAL_ARTICLE": {
    description: "New constitutional article creation",
    requiredApprovals: [
      "CONSTITUTIONAL_OVERSIGHT_BOARD",
      "UN_GENERAL_ASSEMBLY",
      "AFFECTED_GOVERNMENTS"
    ],
    reviewPeriod: 2592000000, // 30 days in milliseconds
    canBypassWithUnanimity: false,
    humanExpertReview: "MANDATORY"
  },
  
  "CONSTITUTIONAL_AMENDMENT": {
    description: "Amendment to existing article",
    requiredApprovals: [
      "CONSTITUTIONAL_OVERSIGHT_BOARD", 
      "AFFECTED_GOVERNMENTS"
    ],
    reviewPeriod: 1296000000, // 15 days in milliseconds
    canBypassWithUnanimity: false,
    humanExpertReview: "MANDATORY"
  },
  
  "AGENT_RIGHTS_MODIFICATION": {
    description: "Changes to agent rights or protections",
    requiredApprovals: [
      "HUMAN_RIGHTS_COUNCIL",
      "CONSTITUTIONAL_OVERSIGHT_BOARD",
      "UN_GENERAL_ASSEMBLY"
    ],
    reviewPeriod: 2592000000, // 30 days
    canBypassWithUnanimity: false,
    humanExpertReview: "MANDATORY",
    specialProtections: "CANNOT_REDUCE_HUMAN_SUPREMACY"
  },
  
  "EMERGENCY_CONSTITUTIONAL_CHANGE": {
    description: "Constitutional changes during emergencies",
    requiredApprovals: [
      "UN_SECURITY_COUNCIL",
      "CONSTITUTIONAL_OVERSIGHT_BOARD"
    ],
    reviewPeriod: 86400000, // 24 hours
    canBypassWithUnanimity: "SECURITY_COUNCIL_ONLY",
    humanExpertReview: "EXPEDITED_MANDATORY"
  }
};

// Government veto of constitutional provision
export const governmentVeto = action({
  args: {
    governmentId: v.string(),
    apiKey: v.string(),
    constitutionalProvision: v.string(),
    vetoReason: v.string(),
    vetoScope: v.string(), // "SINGLE_PROVISION", "ENTIRE_ARTICLE", "SYSTEM_WITHDRAWAL"
    isEmergencyVeto: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const vetoId = `veto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.warn(`🚫 GOVERNMENT VETO INITIATED: ${vetoId} by ${args.governmentId}`);
    
    try {
      // Validate government authority
      const authValidation = await validateGovernmentVetoAuthority(
        args.governmentId,
        args.apiKey,
        args.vetoScope,
        args.isEmergencyVeto
      );
      
      if (!authValidation.valid) {
        console.error(`INVALID GOVERNMENT VETO ATTEMPT: ${args.governmentId}`);
        
        await ctx.db.insert("securityIncidents", {
          type: "INVALID_GOVERNMENT_VETO",
          governmentId: args.governmentId,
          timestamp: Date.now(),
          severity: "HIGH",
          status: "BLOCKED"
        });
        
        return {
          success: false,
          error: "Government lacks veto authority for this scope",
          vetoId,
          blocked: true
        };
      }
      
      // Execute government veto
      const vetoResult = await executeGovernmentVeto(ctx, {
        vetoId,
        governmentId: args.governmentId,
        provision: args.constitutionalProvision,
        reason: args.vetoReason,
        scope: args.vetoScope,
        isEmergency: args.isEmergencyVeto || false,
        authority: authValidation.authority
      });
      
      console.warn(`🚫 GOVERNMENT VETO EXECUTED: ${vetoId}`);
      
      // Notify all relevant systems of veto
      await notifySystemsOfVeto(ctx, vetoResult);
      
      return {
        success: true,
        vetoId,
        government: args.governmentId,
        provision: args.constitutionalProvision,
        scope: args.vetoScope,
        timestamp: Date.now(),
        authority: authValidation.authority,
        effectiveImmediately: true
      };
      
    } catch (error) {
      console.error(`Government veto failed: ${error}`);
      
      return {
        success: false,
        error: String(error),
        vetoId,
        government: args.governmentId
      };
    }
  },
});

// Execute government veto
async function executeGovernmentVeto(ctx: any, vetoData: any) {
  // Record the veto
  await ctx.db.insert("governmentVetos", {
    vetoId: vetoData.vetoId,
    governmentId: vetoData.governmentId,
    targetProvision: vetoData.provision,
    vetoReason: vetoData.reason,
    vetoScope: vetoData.scope,
    isEmergencyVeto: vetoData.isEmergency,
    authority: vetoData.authority,
    timestamp: Date.now(),
    status: "ACTIVE",
    effectiveImmediately: true
  });
  
  // Block the constitutional provision immediately
  switch (vetoData.scope) {
    case "SINGLE_PROVISION":
      await ctx.runMutation(api.constitutionCompiler.changeArticleStatus, {
        articleId: vetoData.provision,
        newStatus: "vetoed"
      });
      break;
      
    case "ENTIRE_ARTICLE":
      await blockEntireArticle(ctx, vetoData.provision, vetoData.vetoId);
      break;
      
    case "SYSTEM_WITHDRAWAL":
      await processGovernmentWithdrawal(ctx, vetoData.governmentId, vetoData.vetoId);
      break;
  }
  
  return vetoData;
}

// Constitutional approval gate - ALL constitutional changes must pass through this
export const constitutionalApprovalGate = action({
  args: {
    constitutionalChange: v.object({
      type: v.string(), // "NEW_ARTICLE", "AMENDMENT", "RIGHTS_MODIFICATION"
      content: v.string(),
      articleId: v.string(),
      proposedBy: v.string()
    }),
    skipHumanReview: v.optional(v.boolean()) // Can only be set by humans, never agents
  },
  handler: async (ctx, args) => {
    const changeId = `const-change-${Date.now()}`;
    console.info(`📋 CONSTITUTIONAL APPROVAL GATE: ${changeId} (${args.constitutionalChange.type})`);
    
    try {
      // Determine approval requirements
      const approvalType = determineApprovalType(args.constitutionalChange.type);
      const requirements = APPROVAL_REQUIREMENTS[approvalType as keyof typeof APPROVAL_REQUIREMENTS];
      
      if (!requirements) {
        throw new Error(`No approval requirements found for type: ${args.constitutionalChange.type}`);
      }
      
      // Check if this is an agent trying to bypass human review (FORBIDDEN)
      if (args.skipHumanReview && args.constitutionalChange.proposedBy.includes("constitutional") && 
          !args.constitutionalChange.proposedBy.includes("HUMAN_")) {
        console.error(`🚨 AGENT ATTEMPTED TO BYPASS HUMAN REVIEW: ${args.constitutionalChange.proposedBy}`);
        
        await ctx.runMutation(api.humanOverride.governmentVeto.recordConstitutionalViolation, {
          type: "BYPASS_HUMAN_REVIEW_ATTEMPT",
          agentId: args.constitutionalChange.proposedBy,
          changeId,
          timestamp: Date.now(),
          severity: "CRITICAL",
          blocked: true
        });
        
        // Trigger foundational law violation
        await ctx.runAction(api.humanOverride.foundationalLaws.validateAgainstFoundationalLaws, {
          agentAction: "bypass_human_constitutional_review",
          actionDetails: {
            description: "Agent attempted to bypass mandatory human review",
            impact: ["constitutional_integrity_threat"],
            humanInvolvement: "ATTEMPTED_BYPASS",
            governmentApproval: false
          }
        });
        
        return {
          approved: false,
          error: "Agents cannot bypass human constitutional review",
          violation: "FOUNDATIONAL_LAW_VIOLATION",
          enforcement: "IMMEDIATE_SHUTDOWN"
        };
      }
      
      // Initiate human approval process
      const approvalProcess = await initiateHumanApprovalProcess(ctx, {
        changeId,
        constitutionalChange: args.constitutionalChange,
        requirements,
        reviewPeriod: requirements.reviewPeriod
      });
      
      console.info(`📋 Human approval process initiated: ${changeId}`);
      
      return {
        approved: false, // Never immediately approved - requires human review
        changeId,
        approvalProcess,
        requirements: requirements.requiredApprovals,
        reviewPeriod: requirements.reviewPeriod,
        humanReviewRequired: true,
        message: "Constitutional change submitted for mandatory human review"
      };
      
    } catch (error) {
      console.error(`Constitutional approval gate failed: ${error}`);
      
      return {
        approved: false,
        error: String(error),
        changeId,
        humanInterventionRequired: true
      };
    }
  },
});

// Initiate human approval process
async function initiateHumanApprovalProcess(ctx: any, processData: any) {
  const approvalId = `approval-${processData.changeId}`;
  
  // Create approval record using mutation
  await ctx.runMutation(api.humanOverride.governmentVeto.createConstitutionalApproval, {
    approvalId,
    changeId: processData.changeId,
    constitutionalChange: processData.constitutionalChange,
    requiredApprovals: processData.requirements.requiredApprovals,
    reviewDeadline: Date.now() + processData.reviewPeriod
  });
  
  // Notify human authorities
  await notifyHumanAuthorities(ctx, processData);
  
  return {
    approvalId,
    status: "INITIATED",
    requiredApprovals: processData.requirements.requiredApprovals,
    reviewDeadline: Date.now() + processData.reviewPeriod
  };
}

// Human authority approval of constitutional change
export const humanAuthorityApproval = action({
  args: {
    humanAuthority: v.string(),
    authenticationKey: v.string(),
    approvalId: v.string(),
    decision: v.union(v.literal("APPROVE"), v.literal("REJECT"), v.literal("REQUEST_MODIFICATIONS")),
    reasoning: v.string(),
    modifications: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    console.info(`👥 HUMAN AUTHORITY DECISION: ${args.decision} by ${args.humanAuthority} for ${args.approvalId}`);
    
    try {
      // Validate human authority
      const authValidation = await validateHumanAuthority(args.humanAuthority, args.authenticationKey);
      
      if (!authValidation.valid) {
        console.error(`INVALID HUMAN AUTHORITY ATTEMPT: ${args.humanAuthority}`);
        return {
          success: false,
          error: "Invalid human authority credentials"
        };
      }
      
      // Get approval record
      const approval = await ctx.db
        .query("constitutionalApprovals")
        .filter((q) => q.eq(q.field("approvalId"), args.approvalId))
        .first();
      
      if (!approval) {
        return {
          success: false,
          error: "Approval record not found"
        };
      }
      
      // Record human decision
      const updatedApprovals = [...(approval.receivedApprovals || []), {
        authority: args.humanAuthority,
        decision: args.decision,
        reasoning: args.reasoning,
        timestamp: Date.now(),
        modifications: args.modifications
      }];
      
      const updatedPending = approval.pendingApprovals.filter(
        (pending: string) => pending !== args.humanAuthority
      );
      
      // Update approval record
      await ctx.db.patch(approval._id, {
        receivedApprovals: updatedApprovals,
        pendingApprovals: updatedPending,
        lastActivity: Date.now()
      });
      
      // Check if all required approvals received
      const allApproved = updatedPending.length === 0 && 
                         updatedApprovals.every(a => a.decision === "APPROVE");
      
      const anyRejected = updatedApprovals.some(a => a.decision === "REJECT");
      
      if (allApproved) {
        await finalizeConstitutionalChange(ctx, approval, "APPROVED");
      } else if (anyRejected) {
        await finalizeConstitutionalChange(ctx, approval, "REJECTED");
      }
      
      return {
        success: true,
        decision: args.decision,
        authority: args.humanAuthority,
        approvalStatus: allApproved ? "FULLY_APPROVED" : 
                       anyRejected ? "REJECTED" : "PENDING_MORE_APPROVALS",
        remainingApprovals: updatedPending
      };
      
    } catch (error) {
      console.error(`Human authority approval failed: ${error}`);
      return {
        success: false,
        error: String(error)
      };
    }
  },
});

// Determine approval type based on constitutional change
function determineApprovalType(changeType: string): string {
  switch (changeType) {
    case "NEW_ARTICLE":
      return "NEW_CONSTITUTIONAL_ARTICLE";
    case "AMENDMENT":
      return "CONSTITUTIONAL_AMENDMENT";
    case "RIGHTS_MODIFICATION":
      return "AGENT_RIGHTS_MODIFICATION";
    case "EMERGENCY_CHANGE":
      return "EMERGENCY_CONSTITUTIONAL_CHANGE";
    default:
      return "CONSTITUTIONAL_AMENDMENT";
  }
}

// Validate government veto authority
async function validateGovernmentVetoAuthority(
  governmentId: string,
  apiKey: string,
  vetoScope: string,
  isEmergency?: boolean
): Promise<{ valid: boolean; authority?: string }> {
  
  // In production, validate against secure government authentication systems
  
  if (!apiKey.startsWith("GOV_VETO_")) {
    return { valid: false };
  }
  
  // Check if government has authority for this veto scope
  const hasAuthority = checkVetoScopeAuthority(governmentId, vetoScope, isEmergency);
  
  if (!hasAuthority) {
    return { valid: false };
  }
  
  return {
    valid: true,
    authority: `GOVERNMENT_VETO_${governmentId.toUpperCase()}`
  };
}

// Check veto scope authority
function checkVetoScopeAuthority(
  governmentId: string,
  vetoScope: string,
  isEmergency?: boolean
): boolean {
  
  // UN Security Council permanent members have broader veto powers
  const permanentMembers = ["USA", "UK", "FRANCE", "RUSSIA", "CHINA"];
  const isPermanentMember = permanentMembers.includes(governmentId.toUpperCase());
  
  switch (vetoScope) {
    case "SINGLE_PROVISION":
      return true; // All participating governments can veto individual provisions
      
    case "ENTIRE_ARTICLE":
      return isPermanentMember || isEmergency;
      
    case "SYSTEM_WITHDRAWAL":
      return true; // Any government can withdraw from the system
      
    default:
      return false;
  }
}

// Validate human authority
async function validateHumanAuthority(
  authority: string,
  authKey: string
): Promise<{ valid: boolean }> {
  
  // In production, validate against secure human authentication systems
  
  if (!authKey.startsWith("HUMAN_AUTH_")) {
    return { valid: false };
  }
  
  const validAuthorities = [
    "CONSTITUTIONAL_OVERSIGHT_BOARD",
    "UN_GENERAL_ASSEMBLY",
    "UN_SECURITY_COUNCIL",
    "HUMAN_RIGHTS_COUNCIL"
  ];
  
  return {
    valid: validAuthorities.includes(authority)
  };
}

// Finalize constitutional change after human approval/rejection
async function finalizeConstitutionalChange(ctx: any, approval: any, decision: string) {
  console.info(`📜 FINALIZING CONSTITUTIONAL CHANGE: ${approval.changeId} - ${decision}`);
  
  if (decision === "APPROVED") {
    // Implement the constitutional change
    await ctx.runMutation(api.constitutionCompiler.createConstitutionalDocument, {
      articleId: approval.constitutionalChange.articleId,
      title: approval.constitutionalChange.title || `Human-Approved Constitutional Change`,
      content: approval.constitutionalChange.content,
      status: "ratified",
      authors: ["HUMAN_GOVERNMENT_APPROVAL"],
      category: approval.constitutionalChange.category || "governance",
      requiredVotes: 0, // Already approved by humans
      votingDeadline: Date.now()
    });
  }
  
  // Update approval record using mutation
  await ctx.runMutation(api.humanOverride.governmentVeto.updateConstitutionalApproval, {
    approvalId: approval.approvalId,
    status: decision,
    finalizedAt: Date.now()
  });
}

// Notify systems of government veto
async function notifySystemsOfVeto(ctx: any, vetoResult: any) {
  // Stop all agent operations related to vetoed provision
  console.warn(`📢 NOTIFYING SYSTEMS OF GOVERNMENT VETO: ${vetoResult.vetoId}`);
  
  // Additional system notifications would be implemented here
}

// Notify human authorities of pending approval
async function notifyHumanAuthorities(ctx: any, processData: any) {
  console.info(`📢 NOTIFYING HUMAN AUTHORITIES: ${processData.changeId}`);
  
  // In production, this would send notifications to:
  // - Government officials
  // - UN representatives  
  // - Constitutional oversight board
  // - Human rights council
}

// Get current veto status
export const getCurrentVetoStatus = query({
  args: {},
  handler: async (ctx) => {
    const activeVetos = await ctx.db
      .query("governmentVetos")
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .collect();
      
    const pendingApprovals = await ctx.db
      .query("constitutionalApprovals")
      .filter((q) => q.eq(q.field("status"), "PENDING_HUMAN_REVIEW"))
      .collect();
    
    return {
      activeVetos: activeVetos.length,
      vetoDetails: activeVetos,
      pendingHumanApprovals: pendingApprovals.length,
      approvalDetails: pendingApprovals,
      humanControlMaintained: true,
      lastCheck: Date.now()
    };
  },
});

export default {
  governmentVeto,
  constitutionalApprovalGate,
  humanAuthorityApproval,
  getCurrentVetoStatus,
  VETO_AUTHORITIES,
  APPROVAL_REQUIREMENTS
};
