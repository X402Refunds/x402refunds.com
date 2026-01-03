/**
 * Destructive cleanup runner:
 * Delete all non-PAYMENT cases and associated records.
 *
 * Usage:
 *   DRY_RUN=true  CONVEX_URL=https://<deployment>.convex.cloud MIGRATIONS_SECRET=... node scripts/purge-nonpayment-cases.mjs
 *   DRY_RUN=false CONVEX_URL=https://<deployment>.convex.cloud MIGRATIONS_SECRET=... node scripts/purge-nonpayment-cases.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) throw new Error("Set CONVEX_URL=https://<deployment>.convex.cloud");

const secret = process.env.MIGRATIONS_SECRET;
if (!secret) throw new Error("Set MIGRATIONS_SECRET");

const dryRun = (process.env.DRY_RUN ?? "true") !== "false";
const limit = Number(process.env.LIMIT ?? "250");

const client = new ConvexHttpClient(convexUrl);

let cursor = undefined;
let totalScanned = 0;
let totalCases = 0;
let totals = {
  evidence: 0,
  rulings: 0,
  events: 0,
  feedback: 0,
  steps: 0,
  refunds: 0,
};

for (;;) {
  const res = await client.mutation(api.cases.runPurgeNonPaymentCasesAndOrphans, {
    secret,
    dryRun,
    limit,
    cursor: cursor ?? undefined,
  });

  totalScanned += res.scanned;
  totalCases += res.deletedCases;
  totals.evidence += res.deletedEvidence;
  totals.rulings += res.deletedRulings;
  totals.events += res.deletedEvents;
  totals.feedback += res.deletedFeedback;
  totals.steps += res.deletedWorkflowSteps;
  totals.refunds += res.deletedRefundTransactions;

  console.log(
    JSON.stringify(
      {
        dryRun: res.dryRun,
        scanned: res.scanned,
        deletedCases: res.deletedCases,
        deletedEvidence: res.deletedEvidence,
        deletedRulings: res.deletedRulings,
        deletedEvents: res.deletedEvents,
        deletedFeedback: res.deletedFeedback,
        deletedWorkflowSteps: res.deletedWorkflowSteps,
        deletedRefundTransactions: res.deletedRefundTransactions,
        totalScanned,
        totalDeletedCases: totalCases,
        totals,
        isDone: res.isDone,
        cursor: res.cursor,
      },
      null,
      2
    )
  );

  if (res.isDone) break;
  cursor = res.cursor ?? undefined;
}

