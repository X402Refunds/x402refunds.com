import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.argv[2];
const secret = process.env.MIGRATIONS_SECRET;

if (!convexUrl) {
  console.error("Usage: MIGRATIONS_SECRET=... node scripts/sanity-case-type-counts.mjs <CONVEX_URL>");
  process.exit(1);
}
if (!secret) {
  console.error("Set MIGRATIONS_SECRET in env");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

let cursor = undefined;
let totalScanned = 0;
const totals = {};

for (;;) {
  const res = await client.mutation(api.migrations.runCaseTypeCounts, {
    secret,
    limit: 1000,
    cursor: cursor ?? undefined,
  });

  totalScanned += res.scanned;
  for (const [k, v] of Object.entries(res.counts)) {
    totals[k] = (totals[k] ?? 0) + v;
  }

  if (res.isDone) break;
  cursor = res.cursor ?? undefined;
}

const total = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(JSON.stringify({ convexUrl, totalScanned, total, counts: totals }, null, 2));
