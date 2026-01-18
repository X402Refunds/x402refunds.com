import { describe, expect, it } from "vitest";

describe("demo agents payTo wallet selection", () => {
  it("prefers DEMO_AGENTS_* overrides over PLATFORM_* deposit addresses", async () => {
    const prev = {
      DEMO_AGENTS_WALLET: process.env.DEMO_AGENTS_WALLET,
      DEMO_AGENTS_SOLANA_WALLET: process.env.DEMO_AGENTS_SOLANA_WALLET,
      PLATFORM_BASE_USDC_DEPOSIT_ADDRESS: process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS,
      PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS: process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS,
    };

    process.env.DEMO_AGENTS_WALLET = "0x00000000000000000000000000000000000000aa";
    process.env.DEMO_AGENTS_SOLANA_WALLET = "FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N";
    process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = "0x00000000000000000000000000000000000000bb";
    process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS = "11111111111111111111111111111111";

    const mod = await import("../../convex/demoAgents");
    const wallets = (mod as any).getDemoAgentsPayToWallets();
    expect(wallets.base).toBe("0x00000000000000000000000000000000000000aa");
    expect(wallets.solana).toBe("FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N");

    Object.assign(process.env, prev);
  });

  it("falls back to PLATFORM_* deposit addresses when DEMO_AGENTS_* are unset", async () => {
    const prev = {
      DEMO_AGENTS_WALLET: process.env.DEMO_AGENTS_WALLET,
      DEMO_AGENTS_SOLANA_WALLET: process.env.DEMO_AGENTS_SOLANA_WALLET,
      PLATFORM_BASE_USDC_DEPOSIT_ADDRESS: process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS,
      PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS: process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS,
    };

    delete process.env.DEMO_AGENTS_WALLET;
    delete process.env.DEMO_AGENTS_SOLANA_WALLET;
    process.env.PLATFORM_BASE_USDC_DEPOSIT_ADDRESS = "0x00000000000000000000000000000000000000cc";
    process.env.PLATFORM_SOLANA_USDC_DEPOSIT_ADDRESS = "22222222222222222222222222222222";

    const mod = await import("../../convex/demoAgents");
    const wallets = (mod as any).getDemoAgentsPayToWallets();
    expect(wallets.base).toBe("0x00000000000000000000000000000000000000cc");
    expect(wallets.solana).toBe("22222222222222222222222222222222");

    Object.assign(process.env, prev);
  });
});

