/**
 * Sanity check runner: CAIP-10 enforcement.
 *
 * Checks:
 * - PAYMENT cases whose defendant is not CAIP-10 (and not eip155:8453 specifically)
 * - agents whose walletAddress is not CAIP-10 (and not eip155:8453 specifically)
 *
 * Usage:
 *   MIGRATIONS_SECRET=... node scripts/sanity-caip10-checks.mjs https://<deployment>.convex.cloud
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.argv[2];
const secret = process.env.MIGRATIONS_SECRET;

if (!convexUrl) {
  console.error("Usage: MIGRATIONS_SECRET=... node scripts/sanity-caip10-checks.mjs <CONVEX_URL>");
  process.exit(1);
}
if (!secret) {
  console.error("Set MIGRATIONS_SECRET in env");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function paginate(name, mutationFn) {
  let cursor = undefined;
  let totalScanned = 0;
  const totals = {
    badNonCaip10: 0,
    badNonBase8453: 0,
    walletFirstScanned: 0,
    walletFirstBadNonCaip10: 0,
    walletFirstBadNonBase8453: 0,
    withWallet: 0,
  };
  const samples = {
    samplesNonCaip10: [],
    samplesNonBase8453: [],
    walletFirstSamplesNonCaip10: [],
    walletFirstSamplesNonBase8453: [],
  };

  for (;;) {
    const res = await client.mutation(mutationFn, {
      secret,
      limit: 2000,
      cursor: cursor ?? undefined,
    });

    totalScanned += res.scanned;
    totals.badNonCaip10 += res.badNonCaip10;
    totals.badNonBase8453 += res.badNonBase8453;
    if (typeof res.walletFirstScanned === "number") totals.walletFirstScanned += res.walletFirstScanned;
    if (typeof res.walletFirstBadNonCaip10 === "number") totals.walletFirstBadNonCaip10 += res.walletFirstBadNonCaip10;
    if (typeof res.walletFirstBadNonBase8453 === "number") totals.walletFirstBadNonBase8453 += res.walletFirstBadNonBase8453;
    if (typeof res.withWallet === "number") totals.withWallet += res.withWallet;

    if (Array.isArray(res.samplesNonCaip10) && samples.samplesNonCaip10.length < 10) {
      samples.samplesNonCaip10.push(...res.samplesNonCaip10);
      samples.samplesNonCaip10 = samples.samplesNonCaip10.slice(0, 10);
    }
    if (Array.isArray(res.samplesNonBase8453) && samples.samplesNonBase8453.length < 10) {
      samples.samplesNonBase8453.push(...res.samplesNonBase8453);
      samples.samplesNonBase8453 = samples.samplesNonBase8453.slice(0, 10);
    }

    if (Array.isArray(res.walletFirstSamplesNonCaip10) && samples.walletFirstSamplesNonCaip10.length < 10) {
      samples.walletFirstSamplesNonCaip10.push(...res.walletFirstSamplesNonCaip10);
      samples.walletFirstSamplesNonCaip10 = samples.walletFirstSamplesNonCaip10.slice(0, 10);
    }
    if (Array.isArray(res.walletFirstSamplesNonBase8453) && samples.walletFirstSamplesNonBase8453.length < 10) {
      samples.walletFirstSamplesNonBase8453.push(...res.walletFirstSamplesNonBase8453);
      samples.walletFirstSamplesNonBase8453 = samples.walletFirstSamplesNonBase8453.slice(0, 10);
    }

    if (res.isDone) break;
    cursor = res.cursor ?? undefined;
  }

  return { name, totalScanned, ...totals, ...samples };
}

const cases = await paginate(
  "payment_cases",
  api.sanity.runCountPaymentCasesWithNonCaip10Defendant
);
const agents = await paginate(
  "agents_wallets",
  api.sanity.runCountAgentsWithNonCaip10WalletAddress
);

console.log(JSON.stringify({ convexUrl, cases, agents }, null, 2));

