/**
 * Agents Module
 * 
 * Central export point for all agent actions
 * This file is required for Convex to recognize internal.agents.* namespace
 */

// Re-export all agent actions (for workflows to call via internal.agents.*)
export { reviewEvidence } from "./agents/evidenceAgent";
export { lawClerkResearch } from "./agents/researchAgent";
export { calculateRefund } from "./agents/damageAgent";
export { judgeDecision, createJudgeAgent } from "./agents/judgeAgent";
export { handleSupportTicket } from "./agents/supportAgent";
export { verifySignedEvidence } from "./agents/signatureAgent";
export { validateApiContract } from "./agents/specValidatorAgent";
export { quickDecision } from "./agents/index";
