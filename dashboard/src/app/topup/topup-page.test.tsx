import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Minimal mocks: we only need to render and assert disabled fields.
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useWalletClient: () => ({ data: null }),
  useSwitchChain: () => ({ switchChainAsync: async () => {} }),
}));

vi.mock("@/components/wallet/connect-wallet-button", () => ({
  ConnectWalletButton: () => <button type="button">Connect</button>,
}));

// Prevent network calls from running in tests.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      // Balance endpoint: return ok balance 0.
      if (String(url).includes("/v1/merchant/balance")) {
        return new Response(JSON.stringify({ ok: true, availableMicrousdc: 0 }), { status: 200 });
      }
      // Notification status: return required > 0 so the page can compute a deficit.
      if (String(url).includes("/v1/merchant/notification-status")) {
        return new Response(JSON.stringify({ ok: true, requiredUsdc: 1.23 }), { status: 200 });
      }
      // Refund polling or other: return a benign default.
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }),
  );
});

function setHref(pathWithQuery: string) {
  window.history.pushState({}, "", pathWithQuery);
}

describe("TopupPage (email-linked locking)", () => {
  it("locks merchant + amount + network when actionToken and caseId are present", async () => {
    setHref(
      "/topup?merchant=eip155%3A8453%3A0x00000000000000000000000000000000000000aa&caseId=k123&actionToken=tok_123",
    );

    const TopupPage = (await import("./page")).default;
    render(<TopupPage />);

    // Wait until mounted UI renders.
    await screen.findByText("Add refund credits");
    expect(screen.getByText(/Approving case/i)).toBeInTheDocument();

    // Merchant is rendered as a copyable code field (not an editable input) in email mode.
    expect(screen.getByText(/eip155:8453/i)).toBeInTheDocument();

    // Email flow: amount is non-editable display (not an input box).
    expect(screen.queryByLabelText("Amount", { selector: "input" })).toBeNull();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();

    // Tabs should not render in email mode.
    expect(screen.queryByRole("tab", { name: /Base \(USDC\)/i })).toBeNull();
    expect(screen.queryByRole("tab", { name: /Solana \(USDC\)/i })).toBeNull();

    // Credits display should be in header with <= 2 decimals.
    expect(screen.getByText("Credit Balance")).toBeInTheDocument();
    expect(screen.getByText(/^0(\.\d{1,2})?\sUSDC$/)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Process refund" })).toBeInTheDocument();
    expect(screen.getByText(/No gas fees\. Powered by X-402\./i)).toBeInTheDocument();
  });

  it("does not lock fields when actionToken is absent", async () => {
    setHref("/topup?merchant=eip155%3A8453%3A0x00000000000000000000000000000000000000aa");

    const TopupPage = (await import("./page")).default;
    render(<TopupPage />);

    await screen.findByText("Add refund credits");

    const merchant = screen.getByLabelText("Merchant") as HTMLInputElement;
    const amount = screen.getByLabelText("Amount") as HTMLInputElement;

    expect(merchant).not.toBeDisabled();
    expect(amount).not.toBeDisabled();

    // Tabs should be present in non-email flow.
    expect(screen.getByRole("tab", { name: /Base \(USDC\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Solana \(USDC\)/i })).toBeInTheDocument();

    // Examples should be hidden by default behind a disclosure.
    expect(screen.getByText("Wallet format examples")).toBeInTheDocument();
    const maybeExample = screen.queryByText(/0x742d35Cc6634C0532925a3b844Bc454e4438f44e/);
    if (maybeExample) expect(maybeExample).not.toBeVisible();
  });

  it("prefills from legacy params (case + token) and locks when both are present", async () => {
    setHref(
      "/topup?merchant=eip155%3A8453%3A0x00000000000000000000000000000000000000aa&case=kLegacy&token=tok_legacy",
    );

    const TopupPage = (await import("./page")).default;
    render(<TopupPage />);

    await screen.findByText("Add refund credits");

    // Email flow: amount is non-editable display (not an input box).
    expect(screen.queryByLabelText("Amount", { selector: "input" })).toBeNull();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();

    // Email-mode banner should show the legacy case id.
    expect(screen.getByText(/Approving case/i)).toBeInTheDocument();
    expect(screen.getAllByText(/kLegacy/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("tab", { name: /Base \(USDC\)/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Process refund" })).toBeInTheDocument();
  });
});

