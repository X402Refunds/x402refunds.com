export type DuplicatePaymentDisputePayload = {
  existingCaseId?: string;
  status?: string;
  finalVerdict?: string;
};

function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse a DUPLICATE_PAYMENT_DISPUTE marker from an error message.
 *
 * Handles both raw markers:
 *   DUPLICATE_PAYMENT_DISPUTE:{"existingCaseId":"..."}
 *
 * and wrapped messages (e.g. Convex \"Uncaught Error\" wrappers + stack traces):
 *   Uncaught Error: DUPLICATE_PAYMENT_DISPUTE:{...}\n  at handler ...
 */
export function parseDuplicatePaymentDisputeError(
  message: string,
): DuplicatePaymentDisputePayload | null {
  const marker = "DUPLICATE_PAYMENT_DISPUTE:";
  const idx = message.indexOf(marker);
  if (idx === -1) return null;

  const after = message.slice(idx + marker.length);
  const json = extractFirstJsonObject(after);
  if (!json) return {};

  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

