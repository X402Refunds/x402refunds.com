import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import * as apiMod from "./_generated/api.js";

// Avoid TS2589 by importing generated API as JS and treating as any.
const api: any = (apiMod as any).api;
const internal: any = (apiMod as any).internal;

function twoLineSummary(params: {
  verdict: "CONSUMER_WINS" | "PARTIAL_REFUND" | "MERCHANT_WINS" | "NEED_REVIEW";
  amountMicrousdc?: number;
  capMicrousdc: number;
  description?: string;
  extraDetail?: string;
}): string {
  const verdictLabel =
    params.verdict === "CONSUMER_WINS"
      ? "Approved refund"
      : params.verdict === "PARTIAL_REFUND"
        ? "Approved partial refund"
        : params.verdict === "MERCHANT_WINS"
          ? "Denied refund"
          : "Needs review";

  const amountLine =
    typeof params.amountMicrousdc === "number" && Number.isFinite(params.amountMicrousdc)
      ? `Amount: ${(params.amountMicrousdc / 1_000_000).toFixed(6)} USDC (cap ${(params.capMicrousdc / 1_000_000).toFixed(2)}).`
      : `Cap ${(params.capMicrousdc / 1_000_000).toFixed(2)} USDC applies.`;

  const d = (params.description || "").trim().replace(/\s+/g, " ");
  const shortDesc = d ? (d.length > 140 ? `${d.slice(0, 137)}...` : d) : "No additional details provided.";

  const extra = (params.extraDetail || "").trim().replace(/\s+/g, " ");
  const extraShort = extra ? (extra.length > 120 ? `${extra.slice(0, 117)}...` : extra) : "";
  const secondLine = extraShort ? `${amountLine} ${extraShort} ${shortDesc}` : `${amountLine} ${shortDesc}`;

  return `${verdictLabel} (Dexter POC).\n${secondLine}`;
}

/**
 * Dexter POC partner adjudication + optional auto-execution.
 *
 * Trigger rule (POC): case.metadata.v1.paymentSupportEmail === refunds@dexter.cash
 * and an enabled partnerProgram exists for that canonicalEmail.
 *
 * Protected endpoint check is currently a NO-OP (always true for Dexter-tagged cases).
 * TODO post-POC: replace with broadcast fetch + signature verification + fail-closed.
 */
export const dexterAdjudicateAndMaybeExecute = internalMutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<any> => {
    const c: any = await ctx.runQuery(api.cases.getCaseById, { caseId: args.caseId });
    if (!c) return { ok: false, code: "CASE_NOT_FOUND" as const };

    // Idempotency: if already decided, do nothing.
    if (c.status === "DECIDED" || typeof c.decidedAt === "number") {
      return { ok: true, alreadyProcessed: true };
    }

    const partnerMeta: any = c?.metadata?.partner;
    const partnerProgramId = typeof partnerMeta?.partnerProgramId === "string" ? partnerMeta.partnerProgramId : null;
    if (!partnerProgramId) return { ok: false, code: "NOT_DEXTER_CASE" as const };

    const partner: any = await ctx.db.get(partnerProgramId as any);
    if (!partner || partner.enabled !== true) return { ok: false, code: "PARTNER_DISABLED" as const };
    if (String(partner.partnerKey || "").toLowerCase() !== "dexter") {
      return { ok: false, code: "NOT_DEXTER_CASE" as const };
    }

    // POC: protected endpoints check is a no-op (true).
    const protectedOk = true;
    void protectedOk;

    const amountMicrousdc: number | undefined =
      typeof c?.paymentDetails?.amountMicrousdc === "number"
        ? Math.round(c.paymentDetails.amountMicrousdc)
        : typeof c?.amount === "number"
          ? Math.round(c.amount * 1_000_000)
          : undefined;

    const capMicrousdc: number =
      typeof partner.maxAutoRefundMicrousdc === "number" && Number.isFinite(partner.maxAutoRefundMicrousdc)
        ? Math.round(partner.maxAutoRefundMicrousdc)
        : 2_000_000;

    // Default decisioning for POC:
    // - Approve full refund when amount is known and <= cap.
    // - Needs review otherwise.
    let verdict: "CONSUMER_WINS" | "NEED_REVIEW" = "NEED_REVIEW";
    let refundAmountMicrousdc: number | undefined = undefined;
    if (typeof amountMicrousdc === "number" && Number.isFinite(amountMicrousdc) && amountMicrousdc > 0) {
      if (amountMicrousdc <= capMicrousdc) {
        verdict = "CONSUMER_WINS";
        refundAmountMicrousdc = amountMicrousdc;
      } else {
        verdict = "NEED_REVIEW";
      }
    }

    const summary2 = twoLineSummary({
      verdict,
      amountMicrousdc: refundAmountMicrousdc,
      capMicrousdc,
      description: typeof c.description === "string" ? c.description : undefined,
      extraDetail: (() => {
        const pd: any = c?.paymentDetails || {};
        const pm: any = pd?.plaintiffMetadata || {};
        const dm: any = pd?.defendantMetadata || {};

        const reasoningRaw =
          typeof pm?.reasoning === "string"
            ? pm.reasoning
            : typeof pm?.reasoningJson === "string"
              ? pm.reasoningJson
              : "";
        if (reasoningRaw && reasoningRaw.trim()) return `Reasoning: ${reasoningRaw.trim()}`;

        let method: string | null = null;
        let url: string | null = null;
        try {
          const reqJson = typeof pm?.requestJson === "string" ? pm.requestJson : "";
          const req = reqJson ? (JSON.parse(reqJson) as any) : null;
          method = typeof req?.method === "string" ? req.method : null;
          url = typeof req?.url === "string" ? req.url : null;
        } catch {
          method = null;
          url = null;
        }

        let status: string | null = null;
        try {
          const resJson =
            typeof pm?.responseJson === "string"
              ? pm.responseJson
              : typeof dm?.responseJson === "string"
                ? dm.responseJson
                : "";
          const res = resJson ? (JSON.parse(resJson) as any) : null;
          status =
            typeof res?.status === "number" && Number.isFinite(res.status)
              ? String(res.status)
              : typeof res?.status === "string"
                ? res.status
                : null;
        } catch {
          status = null;
        }

        const parts: string[] = [];
        if (method && url) parts.push(`Request: ${method.toUpperCase()} ${url}`);
        if (status) parts.push(`Response: ${status}`);
        return parts.join(" • ");
      })(),
    });

    // Store AI recommendation (even for NEED_REVIEW, so emails/UI can show the summary).
    await ctx.runMutation(api.cases.storeAIRecommendation, {
      caseId: args.caseId,
      aiRecommendation: {
        verdict,
        confidence: verdict === "CONSUMER_WINS" ? 0.9 : 0.4,
        reasoning: summary2,
        summary2,
        analyzedAt: Date.now(),
        similarCases: [],
        refundAmountMicrousdc,
      },
    });

    const now = Date.now();
    if (verdict === "CONSUMER_WINS") {
      await ctx.db.patch(args.caseId, {
        status: "DECIDED",
        finalVerdict: "CONSUMER_WINS",
        finalRefundAmountMicrousdc: refundAmountMicrousdc,
        decidedAt: now,
        humanReviewedAt: now,
        humanReviewedBy: "SYSTEM_DEXTER_POC",
        humanAgreesWithAI: true,
      });

      // Auto-execute if enabled on partner program.
      if (partner.autoExecuteEnabled === true) {
        await ctx.runMutation(internal.refunds.executeAutomatedRefund, { caseId: args.caseId, force: true });
      }
    } else {
      // Leave case in FILED/IN_REVIEW for manual handling; mark humanReviewRequired true.
      await ctx.db.patch(args.caseId, {
        humanReviewRequired: true,
      });
    }

    return {
      ok: true,
      verdict,
      refundAmountMicrousdc: refundAmountMicrousdc ?? null,
      summary2,
      autoExecuted: Boolean(partner.autoExecuteEnabled === true && verdict === "CONSUMER_WINS"),
    };
  },
});

