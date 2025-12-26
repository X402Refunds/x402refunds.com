import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { build402ResponseBody, buildTopupPaymentRequirement } from "@/lib/x402-topup";

type AmountUnit = "usdc" | "microusdc";

function parseAmountToMicros(amount: unknown, unit: AmountUnit): number | null {
  if (unit === "microusdc") {
    const n = typeof amount === "string" ? Number(amount) : (amount as number);
    if (!Number.isSafeInteger(n) || n <= 0) return null;
    return n;
  }

  // usdc: allow string/number with up to 6 decimals
  const s = typeof amount === "number" ? String(amount) : String(amount ?? "").trim();
  if (!/^\d+(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const padded = (frac + "000000").slice(0, 6);
  const micros = BigInt(whole) * 1_000_000n + BigInt(padded);
  if (micros <= 0n || micros > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(micros);
}

function getFacilitatorUrls(): string[] {
  const override = process.env.X402_FACILITATOR_URL;
  return override
    ? [override]
    : ["https://facilitator.mcpay.tech", "https://facilitator.daydreams.systems"];
}

type FacilitatorRequest = {
  paymentHeader: string;
  paymentRequirements: unknown;
};

async function postToFacilitator(path: "/verify" | "/settle", args: FacilitatorRequest) {
  const urls = getFacilitatorUrls();

  let decodedPayload: unknown = null;
  try {
    decodedPayload = JSON.parse(Buffer.from(args.paymentHeader, "base64").toString("utf8"));
  } catch {
    decodedPayload = null;
  }

  let last: { status: number; body: string; url: string } = { status: 500, body: "", url: urls[0] };

  for (const baseUrl of urls) {
    last = { status: 500, body: "", url: baseUrl };
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPayload: decodedPayload ?? args.paymentHeader,
          paymentRequirements: args.paymentRequirements,
        }),
      });
      const text = await res.text();
      last = { status: res.status, body: text, url: baseUrl };

      // If no override is set and we got a 5xx, fall back to the next facilitator.
      if (!process.env.X402_FACILITATOR_URL && res.status >= 500) continue;
      return last;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      last = { status: 500, body: `fetch_error: ${msg}`, url: baseUrl };
      continue;
    }
  }

  return last;
}

function extractTxHashFromSettlement(bodyText: string): string | null {
  try {
    const data: unknown = JSON.parse(bodyText);
    const record = data as Record<string, unknown>;
    const tx =
      (typeof record?.transaction === "string" && record.transaction) ||
      (typeof record?.transactionHash === "string" && record.transactionHash) ||
      null;
    return tx;
  } catch {
    return null;
  }
}

// Best-effort in-memory rate limit (serverless instances may not share state).
const rateLimit = new Map<string, { windowStartMs: number; count: number }>();
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cur = rateLimit.get(key);
  if (!cur || now - cur.windowStartMs > windowMs) {
    rateLimit.set(key, { windowStartMs: now, count: 1 });
    return true;
  }
  if (cur.count >= limit) return false;
  cur.count++;
  return true;
}

export async function POST(request: Request) {
  // Public endpoint (x402 payment proof required). Rate limit by IP to reduce abuse.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(`topup:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts, try again shortly." } },
      { status: 429 }
    );
  }

  const xPayment = request.headers.get("X-PAYMENT");

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    body = (parsed && typeof parsed === "object") ? (parsed as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const organizationId = typeof body.organizationId === "string" ? body.organizationId : undefined;
  const amount = body.amount;
  const amountUnit = (typeof body.amountUnit === "string" ? body.amountUnit : "usdc") as AmountUnit;

  if (!organizationId) {
    return NextResponse.json({ success: false, error: { code: "MISSING_ORG" } }, { status: 400 });
  }
  if (amount === undefined || (amountUnit !== "usdc" && amountUnit !== "microusdc")) {
    return NextResponse.json({ success: false, error: { code: "INVALID_AMOUNT" } }, { status: 400 });
  }

  const amountMicros = parseAmountToMicros(amount, amountUnit);
  if (!amountMicros) {
    return NextResponse.json({ success: false, error: { code: "INVALID_AMOUNT_FORMAT" } }, { status: 400 });
  }

  // Safety bounds: 0.10–500 USDC
  if (amountMicros < 100_000 || amountMicros > 500_000_000) {
    return NextResponse.json(
      { success: false, error: { code: "AMOUNT_OUT_OF_BOUNDS", message: "Amount must be 0.10–500.00 USDC" } },
      { status: 400 }
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "Missing NEXT_PUBLIC_CONVEX_URL" } }, { status: 500 });
  }

  const convex = new ConvexHttpClient(convexUrl);
  const deposit = await convex.query(api.refundCredits.getPlatformDepositAddress, {});
  if (!deposit.ok) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "Deposit address not configured" } },
      { status: 500 }
    );
  }

  const requirement = buildTopupPaymentRequirement({
    amountMicrousdc: amountMicros,
    payTo: deposit.address,
    resourceUrl: request.url,
  });

  if (!xPayment) {
    // Return 402 payment requirements (x402 v1) to be signed client-side.
    return NextResponse.json(build402ResponseBody({ requirement }), { status: 402 });
  }

  // Verify and settle via facilitator.
  const verify = await postToFacilitator("/verify", {
    paymentHeader: xPayment,
    paymentRequirements: requirement,
  });
  if (verify.status >= 400) {
    return NextResponse.json(
      { success: false, error: { code: "X402_VERIFY_FAILED", message: verify.body, facilitator: verify.url } },
      { status: 400 }
    );
  }

  const settle = await postToFacilitator("/settle", {
    paymentHeader: xPayment,
    paymentRequirements: requirement,
  });
  if (settle.status >= 400) {
    return NextResponse.json(
      { success: false, error: { code: "X402_SETTLE_FAILED", message: settle.body, facilitator: settle.url } },
      { status: 400 }
    );
  }

  const txHash = extractTxHashFromSettlement(settle.body);
  if (!txHash) {
    return NextResponse.json(
      { success: false, error: { code: "NO_TX_HASH", message: "Facilitator did not return a tx hash" } },
      { status: 500 }
    );
  }

  // Auto-credit via Convex (log-based USDC verification + idempotency).
  const credited = await convex.action(api.refundCredits.submitTopUpAndAutoApply, {
    organizationId,
    txHash,
    amount,
    amountUnit,
  });

  if (!credited.ok) {
    return NextResponse.json(
      { success: false, error: { code: credited.code || "CREDIT_FAILED", message: credited.message || "Failed to credit" }, txHash },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    txHash,
    credits: credited.credits,
  });
}


