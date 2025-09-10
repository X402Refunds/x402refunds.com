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
import type * as auth from "../auth.js";
import type * as cases from "../cases.js";
import type * as constitution from "../constitution.js";
import type * as courtEngine from "../courtEngine.js";
import type * as crons from "../crons.js";
import type * as evidence from "../evidence.js";
import type * as http from "../http.js";
import type * as judges from "../judges.js";
import type * as rulings from "../rulings.js";
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
  auth: typeof auth;
  cases: typeof cases;
  constitution: typeof constitution;
  courtEngine: typeof courtEngine;
  crons: typeof crons;
  evidence: typeof evidence;
  http: typeof http;
  judges: typeof judges;
  rulings: typeof rulings;
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
