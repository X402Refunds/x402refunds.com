import { describe, it, expect } from "vitest";
import {
  BASE_USDC_CONTRACT_ALLOWLIST,
  ERC20_TRANSFER_TOPIC0,
  findErc20TransferMatches,
} from "../../convex/lib/blockchain";

function padTopicAddress(addr: string): string {
  const a = addr.toLowerCase().replace(/^0x/, "");
  return "0x" + a.padStart(64, "0");
}

describe("Base USDC verification - AA/smart-wallet safe (log based)", () => {
  it("matches a USDC Transfer log even when tx.to is not the token contract", () => {
    const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
    expect(BASE_USDC_CONTRACT_ALLOWLIST.has(usdc)).toBe(true);

    const payer = "0x1111111111111111111111111111111111111111";
    const recipient = "0x0c560b5d716e17180499c73029ff7a61c789c180";
    const amount = 1_000_000n; // 1 USDC (6 decimals)

    const logs = [
      {
        // AA entrypoint would be tx.to, but logs still have token contract address.
        address: usdc,
        topics: [ERC20_TRANSFER_TOPIC0, padTopicAddress(payer), padTopicAddress(recipient)],
        data: "0x0f4240", // 1_000_000
        logIndex: "0x5",
      },
    ];

    const matches = findErc20TransferMatches({
      logs,
      allowedTokenContracts: BASE_USDC_CONTRACT_ALLOWLIST,
      expectedAmountRaw: amount,
      expectedToAddress: recipient,
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].payerAddress).toBe(payer.toLowerCase());
    expect(matches[0].recipientAddress).toBe(recipient.toLowerCase());
    expect(matches[0].amountRaw).toBe(amount);
    expect(matches[0].logIndex).toBe(5);
  });

  it("returns no match if the transfer is not to the expected recipient", () => {
    const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
    const payer = "0x1111111111111111111111111111111111111111";
    const recipient = "0x2222222222222222222222222222222222222222";
    const expectedRecipient = "0x3333333333333333333333333333333333333333";
    const amount = 1_000_000n;

    const logs = [
      {
        address: usdc,
        topics: [ERC20_TRANSFER_TOPIC0, padTopicAddress(payer), padTopicAddress(recipient)],
        data: "0x0f4240",
        logIndex: "0x1",
      },
    ];

    const matches = findErc20TransferMatches({
      logs,
      allowedTokenContracts: BASE_USDC_CONTRACT_ALLOWLIST,
      expectedAmountRaw: amount,
      expectedToAddress: expectedRecipient,
    });

    expect(matches).toHaveLength(0);
  });
});


