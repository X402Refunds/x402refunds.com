import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readRepoFile(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("Regression guards (smoke + routes)", () => {
  it("smoke scripts prefer IPv4 to avoid undici IPv6 timeouts", () => {
    const prod = readRepoFile("scripts/test-production.sh");
    const smoke = readRepoFile("scripts/test-smoke.sh");
    expect(prod).toContain("--dns-result-order=ipv4first");
    expect(smoke).toContain("--dns-result-order=ipv4first");
  });

  it("Convex HTTP exposes the Solana blockhash endpoint for demo agent", () => {
    const http = readRepoFile("convex/http.ts");
    expect(http).toContain('path: "/demo-agents/solana/blockhash"');
  });

  it("/topup uses same-origin proxy for POST /v1/topup", () => {
    const topupPage = readRepoFile("dashboard/src/app/topup/page.tsx");
    expect(topupPage).toContain('"/api/wallet-first/topup"');
  });

  it("wallet-first /v1/topup supports paymentHeader in JSON body", () => {
    const http = readRepoFile("convex/http.ts");
    expect(http).toContain("paymentHeaderFromBody");
    expect(http).toContain("body?.paymentHeader");
  });
});

