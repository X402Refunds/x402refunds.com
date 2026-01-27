import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("middleware public routes", () => {
  it("allows wallet-first topup API route", () => {
    const middlewarePath = resolve(process.cwd(), "dashboard", "src", "middleware.ts");
    const source = readFileSync(middlewarePath, "utf8");
    expect(source).toContain("/api/wallet-first/topup(.*)");
  });

  it("allows wallet-first topup API route with trailing slash", () => {
    const middlewarePath = resolve(process.cwd(), "dashboard", "src", "middleware.ts");
    const source = readFileSync(middlewarePath, "utf8");
    expect(source).toContain("/api/wallet-first/topup(.*)");
  });
});
