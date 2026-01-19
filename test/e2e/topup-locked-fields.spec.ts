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

    await expect(page.getByRole("heading", { name: "Add refund credits" })).toBeVisible();
    await expect(page.getByText(/Approving case/i)).toBeVisible();

    // Merchant renders as a copyable code field (not an editable input) in email mode.
    await expect(page.getByText(/eip155:8453/i)).toBeVisible();

    const amountInput = page.getByLabel("Amount to add (USDC)");
    await expect(amountInput).toBeDisabled();

    // Tabs should not render in email mode; show static Pay on instead.
    await expect(page.getByText(/Pay on:\s*Base \(USDC\)/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /Base \(USDC\)/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Solana \(USDC\)/i })).toHaveCount(0);

    // Examples disclosure should not render in email mode.
    await expect(page.getByText(/Wallet format examples/i)).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Add USDC credits" })).toBeVisible();
    await expect(page.locator("text=/No gas fees\\. Powered by X-402\\./i").first()).toBeVisible();
  });
});

