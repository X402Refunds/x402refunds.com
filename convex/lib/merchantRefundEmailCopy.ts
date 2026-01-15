export type MerchantRefundExecutedEmailCopyInput = {
  caseId: string;
  amountMicrousdc?: number | null;
  explorerUrl?: string | null;
  refundTxHash?: string | null;
  trackingUrl?: string | null;
};

export function buildMerchantRefundExecutedEmailCopy(
  input: MerchantRefundExecutedEmailCopyInput,
): string {
  const lines: string[] = [];

  if (typeof input.amountMicrousdc === "number" && Number.isFinite(input.amountMicrousdc)) {
    lines.push(`Refund amount: ${(input.amountMicrousdc / 1_000_000).toFixed(6)} USDC`);
  }

  const proofUrl =
    (typeof input.explorerUrl === "string" && input.explorerUrl) ||
    (typeof input.refundTxHash === "string" && input.refundTxHash
      ? `https://basescan.org/tx/${input.refundTxHash}`
      : "") ||
    "";

  lines.push("");
  if (proofUrl) {
    lines.push("Track refund on Basescan:");
    lines.push(`- ${proofUrl}`);
  } else {
    lines.push("Track refund on Basescan (link will appear once the transaction is available).");
  }

  if (typeof input.trackingUrl === "string" && input.trackingUrl) {
    lines.push("");
    lines.push("View case:");
    lines.push(`- ${input.trackingUrl}`);
  }

  lines.push("");
  lines.push("Note: on-chain confirmations can take a minute.");
  lines.push("");
  lines.push("Sent by x402refunds.com");
  lines.push(`[Case ID: ${input.caseId}]`);

  return lines.join("\n");
}

