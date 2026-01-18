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
});

