export type X402PayToParseResult =
  | {
      ok: true;
      versionDetected: 1 | 2;
      payToCandidates: string[];
    }
  | {
      ok: false;
      versionDetected: "unknown";
      payToCandidates: [];
      error: string;
    };

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeBase64JsonParse(b64: string): unknown | null {
  try {
    // Convex http actions run in a Workers-like runtime with atob/btoa available.
    const decoded = atob(b64);
    return safeJsonParse(decoded);
  } catch {
    return null;
  }
}

function collectStringFieldDeep(
  value: unknown,
  keyLower: string,
  out: Set<string>,
  depth: number,
) {
  if (depth <= 0) return;
  if (!value) return;

  if (Array.isArray(value)) {
    for (const v of value) collectStringFieldDeep(v, keyLower, out, depth - 1);
    return;
  }

  if (typeof value !== "object") return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (String(k).toLowerCase() === keyLower && typeof v === "string" && v.trim()) {
      out.add(v.trim());
    }
    collectStringFieldDeep(v, keyLower, out, depth - 1);
  }
}

function parseV1BodyPayToCandidates(bodyText: string): string[] {
  const parsed = safeJsonParse(bodyText);
  if (!parsed) return [];

  const out = new Set<string>();

  // Most common v1: { accepts: [{ payTo: "0x..." }, ...] }
  if (typeof (parsed as any)?.accepts !== "undefined") {
    const accepts = (parsed as any).accepts;
    if (Array.isArray(accepts)) {
      for (const a of accepts) {
        if (a && typeof a === "object") {
          const payTo = (a as any).payTo;
          if (typeof payTo === "string" && payTo.trim()) out.add(payTo.trim());
        }
      }
    }
  }

  // Some servers return a single requirement object with payTo at top level.
  collectStringFieldDeep(parsed, "payto", out, 6);

  return Array.from(out);
}

function parseV2HeaderPayToCandidates(paymentRequiredHeader: string): string[] {
  const parsed = safeBase64JsonParse(paymentRequiredHeader);
  if (!parsed) return [];

  const out = new Set<string>();
  collectStringFieldDeep(parsed, "payto", out, 8);
  collectStringFieldDeep(parsed, "recipient", out, 8);

  return Array.from(out);
}

/**
 * Best-effort X-402 pay-to extraction.
 *
 * v2: 402 + PAYMENT-REQUIRED (base64 JSON) header
 * v1: 402 JSON body with accepts[] or payTo
 */
export function parseX402PayTo(args: {
  status: number;
  paymentRequiredHeader: string | null;
  bodyText: string | null;
}): X402PayToParseResult {
  if (args.status !== 402) {
    return {
      ok: false,
      versionDetected: "unknown",
      payToCandidates: [],
      error: "Response status was not 402",
    };
  }

  const header = typeof args.paymentRequiredHeader === "string" ? args.paymentRequiredHeader.trim() : "";
  if (header) {
    const candidates = parseV2HeaderPayToCandidates(header);
    if (candidates.length > 0) {
      return { ok: true, versionDetected: 2, payToCandidates: candidates };
    }
  }

  const bodyText = typeof args.bodyText === "string" ? args.bodyText.trim() : "";
  if (bodyText) {
    const candidates = parseV1BodyPayToCandidates(bodyText);
    if (candidates.length > 0) {
      return { ok: true, versionDetected: 1, payToCandidates: candidates };
    }
  }

  return {
    ok: false,
    versionDetected: "unknown",
    payToCandidates: [],
    error: "Could not extract payTo candidates from 402 response",
  };
}

