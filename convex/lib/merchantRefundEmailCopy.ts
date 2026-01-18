export type MerchantRefundExecutedEmailCopyInput = {
  caseId: string;
  amountMicrousdc?: number | null;
  explorerUrl?: string | null;
  refundTxHash?: string | null;
  trackingUrl?: string | null;
};

function inferRefundExplorerUrl(args: { explorerUrl?: string | null; refundTxHash?: string | null }): string {
  const explorerUrl = typeof args.explorerUrl === "string" ? args.explorerUrl.trim() : "";
  const tx = typeof args.refundTxHash === "string" ? args.refundTxHash.trim() : "";
  const isEvmTx = tx.startsWith("0x");
  const isSolanaTx = Boolean(tx) && !isEvmTx;
  return (
    explorerUrl ||
    (tx ? (isSolanaTx ? `https://solscan.io/tx/${tx}` : `https://basescan.org/tx/${tx}`) : "") ||
    ""
  );
}

export function buildMerchantRefundExecutedEmailCopy(
  input: MerchantRefundExecutedEmailCopyInput,
): string {
  const lines: string[] = [];

  if (typeof input.amountMicrousdc === "number" && Number.isFinite(input.amountMicrousdc)) {
    lines.push(`Refund amount: ${(input.amountMicrousdc / 1_000_000).toFixed(6)} USDC`);
  }

  const proofUrl = inferRefundExplorerUrl({ explorerUrl: input.explorerUrl, refundTxHash: input.refundTxHash });

  lines.push("");
  if (proofUrl) {
    lines.push("Track refund on blockchain:");
    lines.push(`- ${proofUrl}`);
  } else {
    lines.push("Track refund on blockchain (link will appear once the transaction is available).");
  }

  if (typeof input.trackingUrl === "string" && input.trackingUrl) {
    lines.push("");
    lines.push("View case:");
    lines.push(`- ${input.trackingUrl}`);
  }

  lines.push("");
  lines.push("Sent by x402refunds.com");
  lines.push(`(Case ID: ${input.caseId})`);

  return lines.join("\n");
}

