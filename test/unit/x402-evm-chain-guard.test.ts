import { describe, expect, it, vi } from "vitest";

import { createX402PaymentSignature } from "../../dashboard/src/lib/x402-signature";

describe("x402 EVM signature chain guard", () => {
  it("throws a helpful error when wallet is on the wrong chain", async () => {
    const walletClient: any = {
      chain: { id: 1 },
      signTypedData: vi.fn(),
    };

    const req: any = {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "10000",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payTo: "0x0000000000000000000000000000000000000001",
      resource: "https://api.x402refunds.com/demo-agents/image-generator",
      description: "test",
    };

    await expect(createX402PaymentSignature(walletClient, req, "0x0000000000000000000000000000000000000002")).rejects.toThrow(
      /switch.*Base/i,
    );
    expect(walletClient.signTypedData).not.toHaveBeenCalled();
  });

  it("calls signTypedData when wallet is on the expected chain", async () => {
    const walletClient: any = {
      chain: { id: 8453 },
      signTypedData: vi.fn().mockResolvedValue("0xsig"),
    };

    const req: any = {
      scheme: "exact",
      network: "base",
      maxAmountRequired: "10000",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      payTo: "0x0000000000000000000000000000000000000001",
      resource: "https://api.x402refunds.com/demo-agents/image-generator",
      description: "test",
    };

    const out = await createX402PaymentSignature(walletClient, req, "0x0000000000000000000000000000000000000002");
    expect(typeof out).toBe("string");
    expect(walletClient.signTypedData).toHaveBeenCalledTimes(1);
  });
});

