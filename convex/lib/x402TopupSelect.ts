type X402Version = 1 | 2;

function safeAtob(input: string): string | null {
  const raw = String(input || "").trim();
  if (!raw) return null;
  // Normalize base64url to base64.
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(normalized);
  } catch {
    return null;
  }
}

export function inferX402VersionFromPaymentHeader(paymentHeader: string): X402Version | null {
  const decoded = safeAtob(paymentHeader);
  if (!decoded) return null;
  try {
    const obj: unknown = JSON.parse(decoded);
    if (!obj || typeof obj !== "object") return null;
    const rec = obj as Record<string, unknown>;
    const v = rec.x402Version ?? rec.version;
    if (v === 2 || v === "2") return 2;
    if (v === 1 || v === "1") return 1;
    // Heuristic: presence of v2 `accepted` envelope.
    if (rec.accepted && typeof rec.accepted === "object") return 2;
    return 1;
  } catch {
    return null;
  }
}

export function selectTopupPaymentRequirements(args: {
  paymentSigHeader: string | null;
  xPaymentHeader: string | null;
  paymentHeaderFromBody: string;
  paymentRequiredV1: { accepts: any[] };
  paymentRequiredV2: { accepts: any[] };
}): { version: X402Version; requirement: any } {
  // PAYMENT-SIGNATURE is the canonical v2 signal.
  if (args.paymentSigHeader) {
    return { version: 2, requirement: args.paymentRequiredV2.accepts[0] };
  }

  // Body/header paymentHeader might be v2 (Solana) or v1 (legacy).
  const candidate = args.paymentHeaderFromBody || args.xPaymentHeader || "";
  const inferred = candidate ? inferX402VersionFromPaymentHeader(candidate) : null;
  if (inferred === 2) return { version: 2, requirement: args.paymentRequiredV2.accepts[0] };
  return { version: 1, requirement: args.paymentRequiredV1.accepts[0] };
}

