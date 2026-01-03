/**
 * One-off migration runner for wallet-first v1 normalization on PAYMENT cases.
 *
 * Runs against the configured Convex deployment (CONVEX_URL / CONVEX_DEPLOYMENT in env).
 *
 * Usage:
 *   DRY_RUN=true node scripts/migrate-wallet-first-payment-cases.mjs
 *   DRY_RUN=false node scripts/migrate-wallet-first-payment-cases.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl =
  process.env.CONVEX_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  (process.env.API_BASE_URL ? process.env.API_BASE_URL.replace(".convex.site", ".convex.cloud") : null);

if (!convexUrl) {
  throw new Error("Set CONVEX_URL (https://<deployment>.convex.cloud) or API_BASE_URL (https://<deployment>.convex.site)");
}

const dryRun = (process.env.DRY_RUN ?? "true") !== "false";
const limit = Number(process.env.LIMIT ?? "500");
const secret = process.env.MIGRATIONS_SECRET;
if (!secret) {
  throw new Error("Set MIGRATIONS_SECRET to run migrations");
}

const client = new ConvexHttpClient(convexUrl);

let cursor = undefined;
let totalScanned = 0;
let totalUpdated = 0;

for (;;) {
  const res = await client.mutation(api.cases.runMigratePaymentCasesToWalletFirstV1, {
    secret,
    dryRun,
    limit,
    cursor: cursor ?? undefined,
  });

  totalScanned += res.scanned;
  totalUpdated += res.updated;

  console.log(
    JSON.stringify(
      {
        dryRun: res.dryRun,
        scanned: res.scanned,
        updated: res.updated,
        totalScanned,
        totalUpdated,
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

