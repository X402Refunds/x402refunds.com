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
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as cases from "../cases.js";
import type * as codebaseIndex from "../codebaseIndex.js";
import type * as codebaseSearch from "../codebaseSearch.js";
import type * as courtEngine from "../courtEngine.js";
import type * as crons from "../crons.js";
import type * as disputeEngine from "../disputeEngine.js";
import type * as events from "../events.js";
import type * as evidence from "../evidence.js";
import type * as http from "../http.js";
import type * as intelligentDisputeEngine from "../intelligentDisputeEngine.js";
import type * as judges from "../judges.js";
import type * as llmEngine from "../llmEngine.js";
import type * as scheduler from "../scheduler.js";
import type * as semanticSearch from "../semanticSearch.js";
import type * as testLLM from "../testLLM.js";
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
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  cases: typeof cases;
  codebaseIndex: typeof codebaseIndex;
  codebaseSearch: typeof codebaseSearch;
  courtEngine: typeof courtEngine;
  crons: typeof crons;
  disputeEngine: typeof disputeEngine;
  events: typeof events;
  evidence: typeof evidence;
  http: typeof http;
  intelligentDisputeEngine: typeof intelligentDisputeEngine;
  judges: typeof judges;
  llmEngine: typeof llmEngine;
  scheduler: typeof scheduler;
  semanticSearch: typeof semanticSearch;
  testLLM: typeof testLLM;
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
