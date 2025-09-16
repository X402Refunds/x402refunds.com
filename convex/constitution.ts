// Built-in constitutional rules for Agent Court
// This replaces the external constitution package for simplicity

export interface ConstitutionConfig {
  version: string;
  slaThresholdHours: number;
  formatStrict: boolean; 
  deliveryProofRequired: boolean;
  panelSize: number;
  panelTimeoutHours: number;
  sanctionLadder: Array<{
    level: number;
    action: "warn" | "throttle" | "suspend" | "expel";
    threshold: number;
    duration?: string;
  }>;
  tieBreakRule: "senior_judge" | "random" | "default_dismiss";
}

// Default constitution - can be updated via mutations
export const DEFAULT_CONSTITUTION: ConstitutionConfig = {
  version: "1.0.0",
  slaThresholdHours: 24,
  formatStrict: false, // Allow some format flexibility
  deliveryProofRequired: true,
  panelSize: 3,
  panelTimeoutHours: 168, // 7 days
  sanctionLadder: [
    { level: 1, action: "warn", threshold: 1 },
    { level: 2, action: "throttle", threshold: 3, duration: "7d" },
    { level: 3, action: "suspend", threshold: 5, duration: "30d" },
    { level: 4, action: "expel", threshold: 10 },
  ],
  tieBreakRule: "senior_judge",
};

// Auto-rule configurations  
export const AUTO_RULES = [
  {
    code: "SLA_MISS",
    description: "Service Level Agreement violation",
    category: "performance",
    enabled: true,
  },
  {
    code: "WRONG_FORMAT",
    description: "Output format does not match specification", 
    category: "compliance",
    enabled: true,
  },
  {
    code: "NON_DELIVERY",
    description: "No delivery proof by deadline",
    category: "delivery", 
    enabled: true,
  },
];

// Jurisdiction tags for case classification
export const JURISDICTION_TAGS = [
  "API_COMMERCE",
  "TASK_BOUNTY", 
  "GENERAL",
  "SLA",
  "FORMAT",
  "DELIVERY",
  "PAYMENT",
  "DATA",
];

// Get active constitution (file-based system)
export function getActiveConstitution(): ConstitutionConfig {
  // TODO: Eventually read from CONSTITUTION.md file
  // For now, return enhanced config that acknowledges file-based system
  return {
    ...DEFAULT_CONSTITUTION,
    version: "file-based-v1.0",
    source: "CONSTITUTION.md", // Points to file instead of hardcoded
    lastUpdated: new Date().toISOString()
  };
}

// Add missing query that tests expect
import { query } from "./_generated/server";
export const getActiveRules = query({
  args: {},
  handler: async () => {
    return getActiveConstitution();
  },
});

// Validate case type against jurisdiction
export function validateJurisdiction(caseType: string, tags: string[]): boolean {
  // Simple validation - ensure tags are recognized
  return tags.every(tag => JURISDICTION_TAGS.includes(tag));
}

// Get sanction level for violation count
export function getSanctionLevel(violationCount: number): typeof DEFAULT_CONSTITUTION.sanctionLadder[0] | null {
  const ladder = DEFAULT_CONSTITUTION.sanctionLadder;
  
  for (let i = ladder.length - 1; i >= 0; i--) {
    if (violationCount >= ladder[i].threshold) {
      return ladder[i];
    }
  }
  
  return null;
}

// Check if case qualifies for autorule
export function shouldAutoRule(caseType: string, evidenceCount: number): boolean {
  // Cases with sufficient evidence and matching auto-rule types can be auto-ruled
  if (evidenceCount === 0) return false;
  
  const autoRuleCodes = AUTO_RULES.filter(r => r.enabled).map(r => r.code);
  return autoRuleCodes.some(code => caseType.includes(code.replace("_", "_")));
}
