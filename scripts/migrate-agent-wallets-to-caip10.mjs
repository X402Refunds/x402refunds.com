/**
 * One-off migration runner: normalize agents.walletAddress to CAIP-10 (Base).
 *
 * Usage:
 *   DRY_RUN=true  CONVEX_URL=https://<deployment>.convex.cloud MIGRATIONS_SECRET=... node scripts/migrate-agent-wallets-to-caip10.mjs
 *   DRY_RUN=false CONVEX_URL=https://<deployment>.convex.cloud MIGRATIONS_SECRET=... node scripts/migrate-agent-wallets-to-caip10.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
if (!convexUrl) throw new Error("Set CONVEX_URL=https://<deployment>.convex.cloud");

const secret = process.env.MIGRATIONS_SECRET;
if (!secret) throw new Error("Set MIGRATIONS_SECRET");

const dryRun = (process.env.DRY_RUN ?? "true") !== "false";
const limit = Number(process.env.LIMIT ?? "500");

const client = new ConvexHttpClient(convexUrl);

let cursor = undefined;
let totalScanned = 0;
let totalUpdated = 0;

for (;;) {
  const res = await client.mutation(api.agentWalletMigrations.runMigrateAgentWalletsToCaip10, {
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
      2,
    ),
  );

  if (res.isDone) break;
  cursor = res.cursor ?? undefined;
}

