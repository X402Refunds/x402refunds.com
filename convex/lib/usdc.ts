/**
 * USDC amount parsing utilities.
 *
 * We treat microusdc (1e6) as the canonical integer representation to avoid float issues.
 */

export type UsdcAmountUnit = "usdc" | "microusdc";

export type ParseUsdcAmountResult =
  | { ok: true; microusdc: number }
  | { ok: false; code: string; message: string };

const MICROS_PER_USDC = 1_000_000;

function isFiniteNumber(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/**
 * Parse an agent-provided amount into integer microusdc.
 *
 * Rules:
 * - unit must be explicit ("usdc" vs "microusdc") — we do not guess.
 * - reject negative/zero, NaN/Infinity, and more than 6 decimals for USDC.
 * - returns a safe integer number of microusdc (<= Number.MAX_SAFE_INTEGER).
 */
export function parseUsdcAmountToMicros(
  input: unknown,
  unit: UsdcAmountUnit,
): ParseUsdcAmountResult {
  try {
    if (unit !== "usdc" && unit !== "microusdc") {
      return { ok: false, code: "INVALID_UNIT", message: `Unsupported unit: ${String(unit)}` };
    }

    let rawString: string | null = null;
    let rawNumber: number | null = null;

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return { ok: false, code: "EMPTY_AMOUNT", message: "Amount is empty" };
      const normalized = trimmed.replace(/,/g, "");
      if (!/^[0-9]+(\.[0-9]+)?$/.test(normalized)) {
        return { ok: false, code: "NON_NUMERIC_AMOUNT", message: `Amount is not numeric: ${String(input)}` };
      }
      rawString = normalized;
    } else if (typeof input === "number") {
      rawNumber = input;
    } else {
      // allow other inputs to fall through and fail with INVALID_AMOUNT below
      rawString = null;
      rawNumber = null;
    }

    if (unit === "microusdc") {
      // Must be an integer.
      const n =
        rawNumber !== null
          ? rawNumber
          : rawString !== null
            ? Number(rawString)
            : NaN;
      if (!isFiniteNumber(n)) {
        return { ok: false, code: "INVALID_AMOUNT", message: "Microusdc amount must be a finite number" };
      }
      if (!Number.isInteger(n)) {
        return { ok: false, code: "NON_INTEGER_MICROS", message: "Microusdc amount must be an integer" };
      }
      if (n <= 0) return { ok: false, code: "NON_POSITIVE_AMOUNT", message: "Amount must be > 0" };
      if (!Number.isSafeInteger(n)) {
        return { ok: false, code: "UNSAFE_INTEGER", message: "Amount is too large" };
      }
      return { ok: true, microusdc: n };
    }

    // unit === "usdc": parse decimal string/number up to 6 decimals.
    const s = rawNumber !== null ? rawNumber.toString() : rawString !== null ? rawString : "";
    if (!s) return { ok: false, code: "INVALID_AMOUNT", message: "USDC amount must be a string or number" };

    // Reject scientific notation by regex above (for string). For numbers, we prevent e-notation by converting;
    // if it produced 'e', reject (keeps things deterministic).
    if (s.includes("e") || s.includes("E")) {
      return { ok: false, code: "SCIENTIFIC_NOTATION", message: "Scientific notation not allowed for USDC amounts" };
    }

    const [whole, frac = ""] = s.split(".");
    if (!whole || !/^[0-9]+$/.test(whole) || (frac && !/^[0-9]+$/.test(frac))) {
      return { ok: false, code: "INVALID_AMOUNT", message: "Invalid USDC amount format" };
    }
    if (frac.length > 6) {
      return { ok: false, code: "TOO_MANY_DECIMALS", message: "USDC supports up to 6 decimals" };
    }

    const fracPadded = (frac + "000000").slice(0, 6);
    const microsStr = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";
    const micros = Number(microsStr);
    if (!Number.isSafeInteger(micros)) {
      return { ok: false, code: "UNSAFE_INTEGER", message: "Amount is too large" };
    }
    if (micros <= 0) return { ok: false, code: "NON_POSITIVE_AMOUNT", message: "Amount must be > 0" };
    return { ok: true, microusdc: micros };
  } catch (e: any) {
    return { ok: false, code: "PARSE_ERROR", message: e?.message || "Failed to parse amount" };
  }
}

export function formatMicrosToUsdc(microusdc: number): string {
  const whole = Math.floor(microusdc / MICROS_PER_USDC);
  const frac = microusdc % MICROS_PER_USDC;
  return `${whole}.${String(frac).padStart(6, "0")}`.replace(/\.?0+$/, "");
}


