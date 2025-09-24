/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agents from "../agents.js";
import type * as aiInference from "../aiInference.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as cases from "../cases.js";
import type * as compliance_internationalCompliance from "../compliance/internationalCompliance.js";
import type * as constitution from "../constitution.js";
import type * as constitutionBuilder_rapidBuilder from "../constitutionBuilder/rapidBuilder.js";
import type * as constitutionCompiler from "../constitutionCompiler.js";
import type * as constitutionFiles from "../constitutionFiles.js";
import type * as constitutionalAgents from "../constitutionalAgents.js";
import type * as constitutionalAttestation from "../constitutionalAttestation.js";
import type * as constitutionalDiscussions from "../constitutionalDiscussions.js";
import type * as courtEngine from "../courtEngine.js";
import type * as crons from "../crons.js";
import type * as evidence from "../evidence.js";
import type * as federation_bilateralAgreements from "../federation/bilateralAgreements.js";
import type * as federation_index from "../federation/index.js";
import type * as federation_unCoordination from "../federation/unCoordination.js";
import type * as federation_unionIntegration from "../federation/unionIntegration.js";
import type * as governance_constitutionalMerger from "../governance/constitutionalMerger.js";
import type * as governance_humanOverride from "../governance/humanOverride.js";
import type * as governance_keywordFlagging from "../governance/keywordFlagging.js";
import type * as http from "../http.js";
import type * as httpMinimal from "../httpMinimal.js";
import type * as humanOverride_emergencyControls from "../humanOverride/emergencyControls.js";
import type * as humanOverride_foundationalLaws from "../humanOverride/foundationalLaws.js";
import type * as humanOverride_governmentVeto from "../humanOverride/governmentVeto.js";
import type * as institutionalAgents_agentHierarchy from "../institutionalAgents/agentHierarchy.js";
import type * as institutionalAgents_agentOrchestrator from "../institutionalAgents/agentOrchestrator.js";
import type * as institutionalAgents_constitutionalCounsel from "../institutionalAgents/constitutionalCounsel.js";
import type * as judges from "../judges.js";
import type * as liveConstitutionalGovernment from "../liveConstitutionalGovernment.js";
import type * as prompts_promptLoader from "../prompts/promptLoader.js";
import type * as rulings from "../rulings.js";
import type * as sovereignty_nationalOverride from "../sovereignty/nationalOverride.js";
import type * as transparency from "../transparency.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  aiInference: typeof aiInference;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  cases: typeof cases;
  "compliance/internationalCompliance": typeof compliance_internationalCompliance;
  constitution: typeof constitution;
  "constitutionBuilder/rapidBuilder": typeof constitutionBuilder_rapidBuilder;
  constitutionCompiler: typeof constitutionCompiler;
  constitutionFiles: typeof constitutionFiles;
  constitutionalAgents: typeof constitutionalAgents;
  constitutionalAttestation: typeof constitutionalAttestation;
  constitutionalDiscussions: typeof constitutionalDiscussions;
  courtEngine: typeof courtEngine;
  crons: typeof crons;
  evidence: typeof evidence;
  "federation/bilateralAgreements": typeof federation_bilateralAgreements;
  "federation/index": typeof federation_index;
  "federation/unCoordination": typeof federation_unCoordination;
  "federation/unionIntegration": typeof federation_unionIntegration;
  "governance/constitutionalMerger": typeof governance_constitutionalMerger;
  "governance/humanOverride": typeof governance_humanOverride;
  "governance/keywordFlagging": typeof governance_keywordFlagging;
  http: typeof http;
  httpMinimal: typeof httpMinimal;
  "humanOverride/emergencyControls": typeof humanOverride_emergencyControls;
  "humanOverride/foundationalLaws": typeof humanOverride_foundationalLaws;
  "humanOverride/governmentVeto": typeof humanOverride_governmentVeto;
  "institutionalAgents/agentHierarchy": typeof institutionalAgents_agentHierarchy;
  "institutionalAgents/agentOrchestrator": typeof institutionalAgents_agentOrchestrator;
  "institutionalAgents/constitutionalCounsel": typeof institutionalAgents_constitutionalCounsel;
  judges: typeof judges;
  liveConstitutionalGovernment: typeof liveConstitutionalGovernment;
  "prompts/promptLoader": typeof prompts_promptLoader;
  rulings: typeof rulings;
  "sovereignty/nationalOverride": typeof sovereignty_nationalOverride;
  transparency: typeof transparency;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
