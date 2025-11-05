/**
 * Notifications Module
 * 
 * Handles sending notifications for dispute resolutions
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Send ruling notification to callback URL
 */
export const sendRuling = action({
  args: {
    caseId: v.id("cases"),
    callbackUrl: v.string(),
    verdict: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; callbackUrl?: string; status?: number; error?: string }> => {
    try {
      // Get case details
      const { internal } = await import("./_generated/api");
      const caseData = await ctx.runQuery(
        internal.cases.getCase,
        { caseId: args.caseId }
      );

      if (!caseData) {
        throw new Error(`Case ${args.caseId} not found`);
      }

      // Prepare notification payload
      const payload: {
        caseId: string;
        verdict: string;
        status: string;
        decidedAt: number;
        amount?: number;
        currency?: string;
      } = {
        caseId: args.caseId,
        verdict: args.verdict,
        status: caseData.status,
        decidedAt: caseData.decidedAt || Date.now(),
        amount: caseData.amount,
        currency: caseData.currency,
      };

      // Send HTTP POST to callback URL
      const response = await fetch(args.callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Consulate-Dispute-Resolution/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Callback failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Notification sent to ${args.callbackUrl} for case ${args.caseId}`);

      return {
        success: true,
        callbackUrl: args.callbackUrl,
        status: response.status,
      };
    } catch (error: any) {
      console.error(`❌ Failed to send notification for case ${args.caseId}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

