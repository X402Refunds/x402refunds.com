function isHexTxHash(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function getString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const rec = obj as Record<string, unknown>;
  const val = rec[key];
  return typeof val === "string" ? val : null;
}

function getNested(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  return rec[key];
}

export function getRefundExplorerUrl(refund: unknown): string | null {
  if (!refund) return null;
  const explorerUrl = getString(refund, "explorerUrl");
  if (explorerUrl) return explorerUrl;
  const txHash = getString(refund, "refundTxHash");
  return isHexTxHash(txHash) ? `https://basescan.org/tx/${txHash}` : null;
}

export function getPaymentExplorerUrl(caseDetails: unknown): string | null {
  const pd = getNested(caseDetails, "paymentDetails");
  const txHash = getString(pd, "transactionHash") || getString(getNested(pd, "crypto"), "transactionHash");
  const chainRaw = getString(pd, "blockchain") || getString(getNested(pd, "crypto"), "blockchain") || "";
  const chain = chainRaw.toLowerCase();
  if (chain !== "base") return null;
  return isHexTxHash(txHash) ? `https://basescan.org/tx/${txHash}` : null;
}

export function getPublicCaseBadge(caseDetails: unknown, refund: unknown): string {
  const status = getString(caseDetails, "status") || "";
  const verdict = getString(caseDetails, "finalVerdict") || "";
  const refundStatus = getString(refund, "status") || "";

  const isRefundVerdict = verdict === "CONSUMER_WINS" || verdict === "PARTIAL_REFUND";

  if (status === "CLOSED") return "Closed";

  if (status === "DECIDED") {
    if (isRefundVerdict) {
      if (refundStatus === "EXECUTED") return "Refunded";
      if (refundStatus === "FAILED") return "Refund failed";
      return "Refunding";
    }
    return "Decided";
  }

  if (status === "FILED" || status === "PANELED" || status === "AUTORULED") return "In review";
  return "Processing";
}

export function getPublicCaseHeadline(caseDetails: unknown, refund: unknown): string {
  const status = getString(caseDetails, "status") || "";
  const verdict = getString(caseDetails, "finalVerdict") || "";
  const refundStatus = getString(refund, "status") || "";

  if (status === "DECIDED") {
    if (verdict === "MERCHANT_WINS") return "Decision: dispute rejected.";

    if (verdict === "CONSUMER_WINS") {
      return refundStatus === "EXECUTED"
        ? "Decision: refund approved — sent on-chain."
        : "Decision: refund approved — processing.";
    }

    if (verdict === "PARTIAL_REFUND") {
      return refundStatus === "EXECUTED"
        ? "Decision: partial refund approved — sent on-chain."
        : "Decision: partial refund approved — processing.";
    }

    return "Decision reached.";
  }

  if (status === "FILED") return "Status: dispute filed — under review.";
  if (status === "PANELED") return "Status: under review.";
  if (status === "AUTORULED") return "Status: being processed.";
  if (status === "CLOSED") return "Status: closed.";

  return "Status: processing.";
}

