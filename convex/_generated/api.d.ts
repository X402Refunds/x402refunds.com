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
import type * as courtEngine from "../courtEngine.js";
import type * as crons from "../crons.js";
import type * as custody from "../custody.js";
import type * as disputeEngine from "../disputeEngine.js";
import type * as events from "../events.js";
import type * as evidence from "../evidence.js";
import type * as http from "../http.js";
import type * as judges from "../judges.js";
import type * as llmEngine from "../llmEngine.js";
import type * as mcp from "../mcp.js";
import type * as types from "../types.js";
import type * as users from "../users.js";

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
  courtEngine: typeof courtEngine;
  crons: typeof crons;
  custody: typeof custody;
  disputeEngine: typeof disputeEngine;
  events: typeof events;
  evidence: typeof evidence;
  http: typeof http;
  judges: typeof judges;
  llmEngine: typeof llmEngine;
  mcp: typeof mcp;
  types: typeof types;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
