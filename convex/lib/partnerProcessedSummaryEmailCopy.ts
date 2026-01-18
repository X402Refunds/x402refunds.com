export type PartnerProcessedSummaryEmailCopyInput = {
  caseId: string;
  verdict: string;
  summary2: string;
  amountMicrousdc?: number | null;
  refundTxHash?: string | null;
  explorerUrl?: string | null;
  trackingUrl?: string | null;
};

function inferRefundExplorer(args: { explorerUrl?: string | null; refundTxHash?: string | null }): string {
  const explorerUrl = typeof args.explorerUrl === "string" ? args.explorerUrl.trim() : "";
  const tx = typeof args.refundTxHash === "string" ? args.refundTxHash.trim() : "";
  const isEvmTx = tx.startsWith("0x");
  const isSolanaTx = Boolean(tx) && !isEvmTx;
  if (explorerUrl) return explorerUrl;
  if (!tx) return "";
  return isSolanaTx ? `https://solscan.io/tx/${tx}` : `https://basescan.org/tx/${tx}`;
}

export function buildPartnerProcessedSummaryEmailCopy(input: PartnerProcessedSummaryEmailCopyInput): string {
  const lines: string[] = [];

  lines.push(`Decision: ${input.verdict}`);

  if (typeof input.amountMicrousdc === "number" && Number.isFinite(input.amountMicrousdc)) {
    lines.push(`Refund amount: ${(input.amountMicrousdc / 1_000_000).toFixed(6)} USDC`);
  }

  const summary = (input.summary2 || "").trim();
  if (summary) {
    lines.push("");
    lines.push("AI summary:");
    // Ensure it renders as exactly the lines we store.
    lines.push(summary);
  }

  const proofUrl = inferRefundExplorer({ explorerUrl: input.explorerUrl, refundTxHash: input.refundTxHash });

  if (proofUrl) {
    lines.push("");
    lines.push("On-chain proof:");
    lines.push(`- ${proofUrl}`);
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

