export type PartnerProcessedSummaryEmailCopyInput = {
  caseId: string;
  verdict: string;
  summary2: string;
  amountMicrousdc?: number | null;
  refundTxHash?: string | null;
  explorerUrl?: string | null;
  trackingUrl?: string | null;
};

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

  const proofUrl =
    (typeof input.explorerUrl === "string" && input.explorerUrl) ||
    (typeof input.refundTxHash === "string" && input.refundTxHash
      ? `https://basescan.org/tx/${input.refundTxHash}`
      : "") ||
    "";

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
  lines.push(`[Case ID: ${input.caseId}]`);

  return lines.join("\n");
}

