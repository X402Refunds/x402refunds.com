/**
 * Workpool Definitions
 * 
 * Controlled parallelism for agent teams
 * Prevents overwhelming the system with too many concurrent operations
 */

import { Workpool } from "@convex-dev/workpool";
import { components } from "./_generated/api";
import type { GenericMutationCtx } from "convex/server";
import type { GenericDataModel } from "convex/server";

// Evidence review workpool - high parallelism for many evidence items
export const evidencePool = new Workpool(components.evidenceWorkpool, {
  maxParallelism: 10, // Process up to 10 evidence items in parallel
  // Note: retryPolicy is handled by the workpool library internally
  onComplete: async (ctx: GenericMutationCtx<GenericDataModel>, { result, error }: { result?: unknown; error?: unknown }) => {
    if (error) {
      console.error("Evidence review failed:", error);
    } else {
      console.log("Evidence review completed:", result);
    }
  },
});

// Judge workpool - lower parallelism for careful deliberation
export const judgePool = new Workpool(components.judgeWorkpool, {
  maxParallelism: 3, // Only 3 judge decisions at a time
  // Note: retryPolicy is handled by the workpool library internally
  onComplete: async (ctx: GenericMutationCtx<GenericDataModel>, { result, error }: { result?: unknown; error?: unknown }) => {
    if (error) {
      console.error("Judge decision failed:", error);
    } else {
      console.log("Judge decision completed:", result);
    }
  },
});

// Research workpool - moderate parallelism for legal research
export const researchPool = new Workpool(components.researchWorkpool, {
  maxParallelism: 5, // Process up to 5 research tasks in parallel
  // Note: retryPolicy is handled by the workpool library internally
  onComplete: async (ctx: GenericMutationCtx<GenericDataModel>, { result, error }: { result?: unknown; error?: unknown }) => {
    if (error) {
      console.error("Legal research failed:", error);
    } else {
      console.log("Legal research completed:", result);
    }
  },
});









