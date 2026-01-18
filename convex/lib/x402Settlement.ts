export function extractTxHashFromFacilitatorSettleBody(args: {
  bodyText: string;
}): string | null {
  const raw = String(args.bodyText ?? "").trim();
  if (!raw) return null;

  const isEvmTxHash = (s: string) => /^0x[a-fA-F0-9]{64}$/.test(s);
  const isSolanaSig = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,128}$/.test(s);
  const isTxLike = (s: string) => isEvmTxHash(s) || isSolanaSig(s);

  const parseTxFromJson = (jsonText: string): string | null => {
    try {
      const data: any = JSON.parse(jsonText);
      const candidates = [
        data?.transaction,
        data?.transactionHash,
        data?.signature,
        data?.txid,
        data?.txHash,
        data?.result?.transaction,
        data?.result?.transactionHash,
        data?.result?.signature,
        data?.result?.txHash,
      ];
      for (const c of candidates) {
        if (typeof c === "string") {
          const s = c.trim();
          if (s && isTxLike(s)) return s;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // 1) JSON response variants.
  const direct = parseTxFromJson(raw);
  if (direct) return direct;

  // 2) Some facilitators return the tx hash/signature as a raw string.
  if (isTxLike(raw)) return raw;

  // 3) Some facilitators return settlement info as base64(JSON(...)) in headers.
  // Try base64 and base64url decoding and parse again.
  const tryDecode = (enc: BufferEncoding): string | null => {
    try {
      const json = Buffer.from(raw, enc).toString("utf8");
      // quick sanity: must look like json
      if (!json.trim().startsWith("{")) return null;
      return json;
    } catch {
      return null;
    }
  };

  const decoded = tryDecode("base64") || tryDecode("base64url");
  if (decoded) {
    const fromDecoded = parseTxFromJson(decoded);
    if (fromDecoded) return fromDecoded;
  }

  return null;
}

export function parseFacilitatorSettleFailure(bodyText: string): { errorReason: string } | null {
  const raw = String(bodyText ?? "").trim();
  if (!raw) return null;
  try {
    const parsed: any = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.success !== false) return null;
    const errorReason = typeof parsed.errorReason === "string" ? parsed.errorReason : "";
    return { errorReason };
  } catch {
    return null;
  }
}

