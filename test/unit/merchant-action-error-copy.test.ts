import { describe, it, expect } from "vitest";
import { buildMerchantActionErrorCopy } from "../../convex/lib/merchantActionErrorCopy";

describe("merchant action error copy (unit)", () => {
  it("TOKEN_USED is human-friendly and has next step guidance", () => {
    const text = buildMerchantActionErrorCopy({
      code: "TOKEN_USED",
      message: "This link has already been used",
      caseId: "jd780r2cdjf90h1tg4qenqyzyn7ysb0r",
    });

    expect(text).not.toContain("TOKEN_USED:");
    expect(text).toContain("This link has already been used.");
    expect(text).toContain("For safety, each one-click link can only be used once.");
    expect(text).toContain("resend a fresh email");
    expect(text).toContain("Case:");
  });
});

