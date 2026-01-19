import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
    await screen.findByText("Top up refund credits");

    const merchant = screen.getByLabelText("Merchant wallet") as HTMLInputElement;
    const amount = screen.getByLabelText("Amount (USDC)") as HTMLInputElement;

    await waitFor(() => expect(merchant.value).toContain("eip155:8453"));

    expect(merchant).toBeDisabled();
    expect(amount).toBeDisabled();

    const baseTab = screen.getByRole("tab", { name: /Base \(USDC\)/i });
    const solTab = screen.getByRole("tab", { name: /Solana \(USDC\)/i });
    expect(baseTab).toBeDisabled();
    expect(solTab).toBeDisabled();
  });

  it("does not lock fields when actionToken is absent", async () => {
    setHref("/topup?merchant=eip155%3A8453%3A0x00000000000000000000000000000000000000aa");

    const TopupPage = (await import("./page")).default;
    render(<TopupPage />);

    await screen.findByText("Top up refund credits");

    const merchant = screen.getByLabelText("Merchant wallet") as HTMLInputElement;
    const amount = screen.getByLabelText("Amount (USDC)") as HTMLInputElement;

    expect(merchant).not.toBeDisabled();
    expect(amount).not.toBeDisabled();
  });

  it("prefills from legacy params (case + token) and locks when both are present", async () => {
    setHref(
      "/topup?merchant=eip155%3A8453%3A0x00000000000000000000000000000000000000aa&case=kLegacy&token=tok_legacy",
    );

    const TopupPage = (await import("./page")).default;
    render(<TopupPage />);

    await screen.findByText("Top up refund credits");

    const merchant = screen.getByLabelText("Merchant wallet") as HTMLInputElement;
    const amount = screen.getByLabelText("Amount (USDC)") as HTMLInputElement;
    expect(merchant).toBeDisabled();
    expect(amount).toBeDisabled();

    // Case banner should show the legacy case id.
    expect(screen.getByText(/kLegacy/)).toBeInTheDocument();
  });
});

