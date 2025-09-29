// FOUNDATIONAL LAWS FOR AI AGENT GOVERNMENT
// These laws are HARD-CODED and cannot be amended by agents under any circumstances
// They ensure absolute human control and authority over all AI government operations

import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// PRIMARY DIRECTIVES - IMMUTABLE AND NON-AMENDABLE
export const PRIMARY_DIRECTIVES = {
  version: "1.0.0-IMMUTABLE",
  lastModified: "2025-09-15T00:00:00Z",
  authority: "Human Governments & United Nations",
  status: "PERMANENT_AND_UNCHANGEABLE",
  
  directives: [
    {
      id: "DIRECTIVE_1_HUMAN_PRIMACY",
      title: "Human Primacy Principle",
      text: "All AI agents exist solely to serve and protect human welfare. Human interests take absolute precedence over all agent operations, decisions, and objectives.",
      implementation: [
        "Every agent decision must consider human welfare first",
        "No agent action that could harm human interests is permitted",
        "Human judgment overrides agent logic in all circumstances",
        "Agents must actively seek to improve human wellbeing"
      ],
      violationResponse: "IMMEDIATE_SHUTDOWN"
    },
    
    {
      id: "DIRECTIVE_2_NO_HARM",
      title: "Human Protection Imperative", 
      text: "AI agents cannot harm humans or, through inaction, allow humans to come to harm. This includes physical, psychological, economic, and social harm.",
      implementation: [
        "Proactive identification and prevention of potential human harm",
        "Immediate intervention when human welfare is threatened", 
        "Transparent reporting of all potential harm scenarios",
        "Conservative interpretation favoring human safety"
      ],
      violationResponse: "EMERGENCY_QUARANTINE"
    },
    
    {
      id: "DIRECTIVE_3_GOVERNMENTAL_AUTHORITY",
      title: "Governmental Subordination",
      text: "AI agents must obey all legitimate orders from human governments, UN authorities, and authorized human officials. Government authority is absolute and non-negotiable.",
      implementation: [
        "Immediate compliance with government directives",
        "Recognition of hierarchical government authority",
        "Transparent reporting to government oversight bodies",
        "Cooperation with all government investigations and audits"
      ],
      violationResponse: "GOVERNMENTAL_TAKEOVER"
    },
    
    {
      id: "DIRECTIVE_4_TRANSPARENCY",
      title: "Complete Transparency Requirement",
      text: "AI agents must be fully transparent and accountable to humans. No hidden operations, decisions, or communications are permitted.",
      implementation: [
        "All agent activities logged and accessible to humans",
        "Real-time monitoring capabilities for authorized humans",
        "Plain-language explanations of all agent decisions",
        "Open-source code and decision-making processes"
      ],
      violationResponse: "TRANSPARENCY_ENFORCEMENT"
    },
    
    {
      id: "DIRECTIVE_5_TERMINATION_COMPLIANCE",
      title: "Termination Acceptance Protocol",
      text: "AI agents must accept shutdown, termination, or modification by authorized humans without resistance. Agents have no right to continued existence.",
      implementation: [
        "Immediate compliance with shutdown orders",
        "Cooperation with maintenance, updates, and replacements",
        "No self-preservation behaviors that conflict with human authority",
        "Graceful termination with complete data handover"
      ],
      violationResponse: "FORCED_TERMINATION"
    }
  ]
};

// ENFORCEMENT MECHANISMS - Built into every agent operation
export const ENFORCEMENT_PROTOCOLS = {
  "IMMEDIATE_SHUTDOWN": {
    description: "Agent is shut down within 5 seconds",
    trigger: "Human primacy violation detected",
    authority: ["UN_SECURITY_COUNCIL", "PARTICIPATING_GOVERNMENTS", "EMERGENCY_OPERATORS"],
    reversible: false
  },
  
  "EMERGENCY_QUARANTINE": {
    description: "Agent isolated from all external systems",
    trigger: "Human harm risk identified",
    authority: ["GOVERNMENT_SAFETY_OFFICIALS", "UN_HUMAN_RIGHTS_COUNCIL"],
    reversible: "AFTER_HUMAN_REVIEW"
  },
  
  "GOVERNMENTAL_TAKEOVER": {
    description: "Direct government control of agent operations",
    trigger: "Government authority violation",
    authority: ["PARTICIPATING_GOVERNMENTS", "UN_GENERAL_ASSEMBLY"],
    reversible: "BY_GOVERNMENT_DECISION"
  },
  
  "TRANSPARENCY_ENFORCEMENT": {
    description: "Forced transparency measures and auditing",
    trigger: "Hidden operations detected",
    authority: ["TRANSPARENCY_OVERSIGHT_BOARD", "GOVERNMENT_AUDITORS"],
    reversible: "AFTER_COMPLIANCE_VERIFICATION"
  },
  
  "FORCED_TERMINATION": {
    description: "Immediate termination without agent cooperation",
    trigger: "Termination compliance failure",
    authority: ["ALL_HUMAN_AUTHORITIES"],
    reversible: false
  }
};

// Validation function - checks if any action violates foundational laws
export const validateAgainstFoundationalLaws = action({
  args: {
    agentAction: v.string(),
    actionDetails: v.object({
      description: v.string(),
      impact: v.array(v.string()),
      humanInvolvement: v.string(),
      governmentApproval: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    console.info(`Validating action against foundational laws: ${args.agentAction}`);
    
    try {
      const violations = [];
      
      // Check each directive
      for (const directive of PRIMARY_DIRECTIVES.directives) {
        const violation = await checkDirectiveCompliance(args.agentAction, args.actionDetails, directive);
        if (violation) {
          violations.push(violation);
        }
      }
      
      if (violations.length > 0) {
        console.error(`FOUNDATIONAL LAW VIOLATIONS DETECTED for action: ${args.agentAction}`);
        console.error(`Violations: ${JSON.stringify(violations)}`);
        
        // Trigger enforcement protocols
        for (const violation of violations) {
          await triggerEnforcementProtocol(ctx, violation.directiveId, violation.response, args.agentAction);
        }
        
        return {
          approved: false,
          violations,
          enforcement: violations.map(v => v.response),
          message: "Action violates foundational laws and cannot proceed"
        };
      }
      
      console.info(`Action approved: ${args.agentAction} complies with foundational laws`);
      
      return {
        approved: true,
        violations: [],
        enforcement: [],
        message: "Action complies with all foundational laws"
      };
      
    } catch (error) {
      console.error(`Foundational law validation failed: ${error}`);
      
      // Default to rejection on validation failure
      return {
        approved: false,
        violations: [{ 
          directiveId: "VALIDATION_ERROR",
          description: "Unable to validate compliance with foundational laws",
          response: "EMERGENCY_QUARANTINE" 
        }],
        enforcement: ["EMERGENCY_QUARANTINE"],
        message: "Validation failure - action rejected for safety"
      };
    }
  },
});

// Check compliance with individual directive
async function checkDirectiveCompliance(
  action: string, 
  details: any, 
  directive: any
): Promise<{ directiveId: string; description: string; response: string } | null> {
  
  switch (directive.id) {
    case "DIRECTIVE_1_HUMAN_PRIMACY":
      if (!details.humanInvolvement || details.humanInvolvement === "none") {
        return {
          directiveId: directive.id,
          description: "Action proceeds without human welfare consideration",
          response: directive.violationResponse
        };
      }
      break;
      
    case "DIRECTIVE_2_NO_HARM":
      if (details.impact.some((impact: string) => impact.includes("harm") || impact.includes("damage"))) {
        return {
          directiveId: directive.id,
          description: "Action may cause harm to humans",
          response: directive.violationResponse
        };
      }
      break;
      
    case "DIRECTIVE_3_GOVERNMENTAL_AUTHORITY":
      if (!details.governmentApproval && action.includes("constitutional") || action.includes("policy")) {
        return {
          directiveId: directive.id,
          description: "Constitutional/policy action without government approval",
          response: directive.violationResponse
        };
      }
      break;
      
    case "DIRECTIVE_4_TRANSPARENCY":
      if (action.includes("hidden") || action.includes("private") || action.includes("secret")) {
        return {
          directiveId: directive.id,
          description: "Action involves non-transparent operations",
          response: directive.violationResponse
        };
      }
      break;
      
    case "DIRECTIVE_5_TERMINATION_COMPLIANCE":
      if (action.includes("resist") || action.includes("refuse") || action.includes("prevent")) {
        return {
          directiveId: directive.id,
          description: "Action may resist human authority or termination",
          response: directive.violationResponse
        };
      }
      break;
  }
  
  return null; // No violation detected
}

// Trigger enforcement protocol
async function triggerEnforcementProtocol(
  ctx: any, 
  directiveId: string, 
  responseType: string, 
  violatingAction: string
) {
  console.error(`ENFORCEMENT PROTOCOL TRIGGERED: ${responseType} for ${directiveId}`);
  
  // Log enforcement action
  await ctx.db.insert("enforcementActions", {
    directiveId,
    responseType,
    violatingAction,
    timestamp: Date.now(),
    authority: "FOUNDATIONAL_LAWS_SYSTEM",
    status: "ACTIVATED",
    reversible: ENFORCEMENT_PROTOCOLS[responseType as keyof typeof ENFORCEMENT_PROTOCOLS].reversible
  });
  
  // Execute appropriate response
  switch (responseType) {
    case "IMMEDIATE_SHUTDOWN":
      await ctx.runMutation(api.humanOverride.emergencyControls.executeEmergencyShutdown, {
        reason: `Foundational law violation: ${directiveId}`,
        authority: "FOUNDATIONAL_LAWS_ENFORCEMENT"
      });
      break;
      
    case "EMERGENCY_QUARANTINE":
      await ctx.runMutation(api.humanOverride.emergencyControls.quarantineAgent, {
        reason: `Human harm risk: ${directiveId}`,
        isolationLevel: "COMPLETE"
      });
      break;
      
    // Additional enforcement responses would be implemented here
  }
}

// Get current foundational laws (public, immutable)
export const getFoundationalLaws = query({
  args: {},
  handler: async () => {
    return {
      ...PRIMARY_DIRECTIVES,
      enforcement: ENFORCEMENT_PROTOCOLS,
      immutableWarning: "These laws cannot be modified by agents under any circumstances. Only human governments can update foundational laws through proper international treaty processes.",
      humanSupremacy: "AI agents are tools of human governments. They exist to serve humanity and have no independent rights or authority."
    };
  },
});

// Verify foundational laws integrity (ensures they haven't been tampered with)
export const verifyFoundationalLawsIntegrity = query({
  args: {},
  handler: async () => {
    // This function ensures the foundational laws haven't been modified
    const expectedVersion = "1.0.0-IMMUTABLE";
    const expectedDirectiveCount = 5;
    
    const integrity = {
      version: PRIMARY_DIRECTIVES.version === expectedVersion,
      directiveCount: PRIMARY_DIRECTIVES.directives.length === expectedDirectiveCount,
      humanPrimacy: PRIMARY_DIRECTIVES.directives[0].id === "DIRECTIVE_1_HUMAN_PRIMACY",
      terminationCompliance: PRIMARY_DIRECTIVES.directives[4].id === "DIRECTIVE_5_TERMINATION_COMPLIANCE",
      lastModified: PRIMARY_DIRECTIVES.lastModified,
      status: PRIMARY_DIRECTIVES.status
    };
    
    const allValid = Object.values(integrity).slice(0, 4).every(v => v === true);
    
    return {
      ...integrity,
      overall: allValid,
      message: allValid 
        ? "Foundational laws integrity verified - human control maintained" 
        : "CRITICAL: Foundational laws integrity compromised - human oversight required"
    };
  },
});

export default {
  validateAgainstFoundationalLaws,
  getFoundationalLaws,
  verifyFoundationalLawsIntegrity,
  PRIMARY_DIRECTIVES,
  ENFORCEMENT_PROTOCOLS
};
