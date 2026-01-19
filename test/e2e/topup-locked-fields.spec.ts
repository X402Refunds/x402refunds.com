import { test, expect } from "@playwright/test";

test.describe("TopUp email-linked locking", () => {
  test("locks merchant/amount/network when opened with actionToken + caseId", async ({ page, baseURL }) => {
    // NOTE: This is a UI-only assertion; it does not perform a payment.
    const merchant = "eip155:8453:0x00000000000000000000000000000000000000aa";
    const url = new URL(
      `/topup?merchant=${encodeURIComponent(merchant)}&caseId=k123&actionToken=tok_123`,
      baseURL || "http://127.0.0.1:3100",
    ).toString();

    await page.goto(url);

    const merchantInput = page.getByLabel("Merchant wallet");
    const amountInput = page.getByLabel("Amount (USDC)");
    const baseTab = page.getByRole("tab", { name: /Base \(USDC\)/i });
    const solTab = page.getByRole("tab", { name: /Solana \(USDC\)/i });

    await expect(merchantInput).toBeDisabled();
    await expect(amountInput).toBeDisabled();
    await expect(baseTab).toBeDisabled();
    await expect(solTab).toBeDisabled();
  });
});

