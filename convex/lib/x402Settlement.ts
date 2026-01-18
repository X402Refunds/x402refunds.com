export function extractTxHashFromFacilitatorSettleBody(args: {
  bodyText: string;
}): string | null {
  const raw = String(args.bodyText ?? "").trim();
  if (!raw) return null;

  // 1) JSON response variants.
  try {
    const data: any = JSON.parse(raw);
    const direct =
      (typeof data?.transaction === "string" && data.transaction) ||
      (typeof data?.transactionHash === "string" && data.transactionHash) ||
      (typeof data?.txHash === "string" && data.txHash) ||
      (typeof data?.signature === "string" && data.signature) ||
      (typeof data?.txid === "string" && data.txid) ||
      null;
    if (direct) return String(direct).trim();

    const nested =
      (typeof data?.result?.transaction === "string" && data.result.transaction) ||
      (typeof data?.result?.transactionHash === "string" && data.result.transactionHash) ||
      (typeof data?.result?.signature === "string" && data.result.signature) ||
      (typeof data?.result?.txHash === "string" && data.result.txHash) ||
      null;
    if (nested) return String(nested).trim();
  } catch {
    // not JSON
  }

  // 2) Some facilitators return the tx hash/signature as a raw string.
  // EVM tx hash: 0x + 64 hex chars
  if (/^0x[a-fA-F0-9]{64}$/.test(raw)) return raw;
  // Solana signature: base58-ish (typically 43–88 chars, but allow wider)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,128}$/.test(raw)) return raw;

  return null;
}

