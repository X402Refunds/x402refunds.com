// Federation module exports
// Optional modular federation infrastructure for cross-border coordination

// Bilateral agreements between nations
export {
  createBilateralAgreement,
  suspendBilateralAgreement,
  getBilateralAgreements,
  verifyBilateralAgreement,
  updateBilateralAgreementCapabilities,
} from "./bilateralAgreements";

// Union integration (EU, ASEAN, NAFTA, etc.)
export {
  joinUnionIntegration,
  optOutUnionIntegration,
  getUnionIntegrations,
  getUnionMembers,
  verifyUnionAgentPassport,
  updateUnionIntegrationFeatures,
} from "./unionIntegration";

// UN coordination (advisory services only)
export {
  joinUnCoordination,
  withdrawUnCoordination,
  getUnCoordination,
  getUnParticipants,
  submitUnRecommendation,
  vetoUnRecommendation,
  getUnRecommendations,
  updateUnCoordinationServices,
} from "./unCoordination";

// Federation utilities and types
export interface FederationConfig {
  bilateralEnabled: boolean;
  unionEnabled: boolean;
  unEnabled: boolean;
  
  // Sovereignty controls (always enabled)
  nationalOverride: true;
  emergencyWithdrawal: true;
  vetoRights: true;
}

export const DEFAULT_FEDERATION_CONFIG: FederationConfig = {
  bilateralEnabled: false,
  unionEnabled: false,  
  unEnabled: false,
  nationalOverride: true,
  emergencyWithdrawal: true,
  vetoRights: true,
};

// Federation sovereignty levels
export type SovereigntyLevel = "ULTIMATE_AUTHORITY" | "DELEGATED_AUTHORITY" | "ADVISORY_ONLY";

// Federation hierarchy (immutable)
export const SOVEREIGNTY_HIERARCHY = {
  NATIONAL: "ULTIMATE_AUTHORITY" as const,
  UNION: "DELEGATED_AUTHORITY" as const,  // Only if opted-in
  UN: "ADVISORY_ONLY" as const,            // Always advisory, never binding
} as const;

// Available federation services
export const FEDERATION_SERVICES = {
  BILATERAL: [
    "agent_recognition",
    "dispute_resolution", 
    "evidence_sharing",
    "identity_verification",
    "economic_cooperation",
  ],
  UNION: [
    "agent_passport",
    "unified_disputes",
    "economic_integration",
    "regulatory_harmonization",
    "data_portability",
  ],
  UN: [
    "best_practices_sharing",
    "international_mediation",
    "global_standards_development",
    "humanitarian_coordination",
    "capacity_building",
  ],
} as const;

// Federation deployment status
export interface FederationStatus {
  deployed: boolean;
  bilateralAgreements: number;
  unionIntegrations: number;
  unCoordination: boolean;
  lastUpdate: number;
}
