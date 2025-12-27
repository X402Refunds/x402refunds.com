/**
 * One-time helper to backfill paymentSourceChain/paymentSourceTxHash on historical PAYMENT cases.
 *
 * Usage:
 *   node scripts/backfill-payment-source-tx.js --deployment dev:youthful-orca-358
 *   node scripts/backfill-payment-source-tx.js --deployment prod:perceptive-lyrebird-89
 *
 * Notes:
 * - This uses `pnpm exec convex run` under the hood and is safe to re-run.
 */

import { spawnSync } from "node:child_process";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

const deployment = arg("--deployment");
if (!deployment) {
  console.error("Missing --deployment (e.g. dev:youthful-orca-358 or prod:perceptive-lyrebird-89)");
  process.exit(1);
}

const limit = Number(arg("--limit") || "1000");
const maxPasses = Number(arg("--max-passes") || "50");

for (let pass = 0; pass < maxPasses; pass++) {
  const env = { ...process.env, CONVEX_DEPLOYMENT: deployment };
  const argsJson = JSON.stringify({ limit });
  const cmd = ["exec", "convex", "run", "cases:backfillPaymentSourceTx", argsJson];
  const r = spawnSync("pnpm", cmd, { stdio: "pipe", encoding: "utf8", env });
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(r.status || 1);
  }
  const out = (r.stdout || "").trim();
  console.log(out);

  // Convex CLI may include warnings; extract the last JSON object from stdout.
  const jsonMatches = out.match(/\{[\s\S]*\}/g);
  const lastJson = jsonMatches ? jsonMatches[jsonMatches.length - 1] : undefined;
  let parsed = null;
  try {
    parsed = lastJson ? JSON.parse(lastJson) : null;
  } catch {
    parsed = null;
  }
  const updated = parsed?.updated;
  if (typeof updated === "number" && updated === 0) {
    console.log("Backfill complete (no more rows to update).");
    break;
  }
}
