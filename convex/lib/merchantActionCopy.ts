export type MerchantActionCopyInput = {
  isReject: boolean;
  caseId: string;
  refundScheduled: boolean;
  refundStatus?: string | null;
  explorerUrl?: string | null;
  refundTxHash?: string | null;
};

export function buildMerchantActionCopy(input: MerchantActionCopyInput): string {
  const lines: string[] = [];

  lines.push(input.isReject ? "All set — dispute rejected." : "All set — refund is processing.");
  lines.push("");
  lines.push(`Case: ${input.caseId}`);
  lines.push("");

  if (!input.refundScheduled) {
    lines.push("Refund: not applicable for this decision.");
    lines.push("");
    return lines.join("\n");
  }

  if (input.refundStatus === "EXECUTED") {
    lines.push("Refund: sent.");
  } else {
    lines.push("Refund: processing now.");
  }

  const proofUrl =
    (typeof input.explorerUrl === "string" && input.explorerUrl) ||
    (typeof input.refundTxHash === "string" && input.refundTxHash ? `https://basescan.org/tx/${input.refundTxHash}` : "") ||
    "";

  lines.push("");
  if (proofUrl) {
    lines.push("Track refund on Basescan:");
    lines.push(`- ${proofUrl}`);
  } else {
    lines.push("Track refund on Basescan once the transaction hash is available.");
  }

  lines.push("");
  lines.push("Note: on-chain confirmations can take a minute.");
  lines.push("");

  return lines.join("\n");
}

