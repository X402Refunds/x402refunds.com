export type MerchantActionCopyInput = {
  isReject: boolean;
  caseId: string;
  refundScheduled: boolean;
  refundStatus?: string | null;
  explorerUrl?: string | null;
  refundTxHash?: string | null;
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

  const proofUrl = inferRefundExplorerUrl({ explorerUrl: input.explorerUrl, refundTxHash: input.refundTxHash });

  lines.push("");
  if (proofUrl) {
    lines.push("Track refund on blockchain:");
    lines.push(`- ${proofUrl}`);
  } else {
    lines.push("Track refund on blockchain (link will appear once the transaction is submitted).");
  }

  lines.push("");
  return lines.join("\n");
}

