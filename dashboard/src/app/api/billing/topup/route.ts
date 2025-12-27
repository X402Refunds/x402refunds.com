import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import type { Id } from "@convex/_generated/dataModel";
import { build402ResponseBody, buildTopupPaymentRequirement } from "@/lib/x402-topup";

// Uses Node APIs (Buffer) and should not run in the Edge runtime.
export const runtime = "nodejs";

type AmountUnit = "usdc" | "microusdc";

type TopUpCreditResult =
  | { ok: true; credits?: unknown; [k: string]: unknown }
  | { ok: false; code?: string; message?: string; [k: string]: unknown };

type DepositResult =
  | { ok: true; address: string; [k: string]: unknown }
  | { ok: false; [k: string]: unknown };

const GET_PLATFORM_DEPOSIT_ADDRESS = "refundCredits:getPlatformDepositAddress";
const SUBMIT_TOPUP_AND_AUTO_APPLY = "refundCredits:submitTopUpAndAutoApply";

function getConvexCloudUrl(): string {
  const fallback = "https://perceptive-lyrebird-89.convex.cloud";
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/\/+$/, "");
  // ConvexHttpClient expects a deployment URL like https://<name>.convex.cloud
  // (some environments accidentally set this to a .convex.site or custom domain).
  if (!trimmed.includes(".convex.cloud")) return fallback;
  return trimmed;
}

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
  const micros = BigInt(whole) * BigInt(1_000_000) + BigInt(padded);
  if (micros <= BigInt(0) || micros > BigInt(Number.MAX_SAFE_INTEGER)) return null;
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

function inferX402Version(decodedPayload: unknown): number {
  if (decodedPayload && typeof decodedPayload === "object") {
    const obj = decodedPayload as Record<string, unknown>;
    const v =
      typeof obj.x402Version === "number"
        ? obj.x402Version
        : typeof obj.version === "number"
          ? obj.version
          : typeof obj.version === "string"
            ? Number(obj.version)
            : undefined;

    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 1;
}

async function postToFacilitator(path: "/verify" | "/settle", args: FacilitatorRequest) {
  const urls = getFacilitatorUrls();

  let decodedPayload: unknown = null;
  try {
    decodedPayload = JSON.parse(Buffer.from(args.paymentHeader, "base64").toString("utf8"));
  } catch {
    decodedPayload = null;
  }

  const x402Version = inferX402Version(decodedPayload);

  let last: { status: number; body: string; url: string } = { status: 500, body: "", url: urls[0] };

  for (const baseUrl of urls) {
    last = { status: 500, body: "", url: baseUrl };
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Some facilitator deployments strictly deserialize and require `x402Version` at top-level.
          x402Version,
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
  try {
  // Public endpoint (x402 payment proof required). Rate limit by IP to reduce abuse.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Parse request first so we can include orgId in rate-limit keys.
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

  // Tightened rate limiting:
  // - Discovery (402) is cheap: allow a few per minute.
  // - Verify/settle is expensive: allow fewer per minute.
  const orgKey = organizationId ? `org:${organizationId}` : "org:unknown";
  const windowMs = 60_000;
  const discoveryLimitPerMin = 6;
  const settleLimitPerMin = 3;

  const limitKeyBase = `topup:${ip}:${orgKey}`;
  const ok =
    !xPayment
      ? checkRateLimit(`${limitKeyBase}:discover`, discoveryLimitPerMin, windowMs)
      : checkRateLimit(`${limitKeyBase}:settle`, settleLimitPerMin, windowMs);

  if (!ok) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts, try again shortly." } },
      { status: 429 }
    );
  }

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

    const convex = new ConvexHttpClient(getConvexCloudUrl(), {
      // Be resilient in case env values don't match Convex's default URL pattern.
      skipConvexDeploymentUrlCheck: true,
    });
  // Avoid TS instantiation depth issues on Convex FunctionReference generics in Next.js route context.
    const runQuery = convex.query.bind(convex) as unknown as (fn: unknown, args: unknown) => Promise<DepositResult>;
  const deposit = await runQuery(GET_PLATFORM_DEPOSIT_ADDRESS, {});
  if (!deposit.ok) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_CONFIGURED", message: "Deposit address not configured" } },
      { status: 500 }
    );
  }

  // Bind the X402 `resource` to the organizationId to prevent replaying a signed payload
  // against a different orgId in our request body.
  const resourceUrl = new URL(request.url);
  resourceUrl.searchParams.set("orgId", organizationId);

  const requirement = buildTopupPaymentRequirement({
    amountMicrousdc: amountMicros,
    payTo: deposit.address,
    resourceUrl: resourceUrl.toString(),
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
  // Avoid TS instantiation depth issues on Convex FunctionReference generics in Next.js route context.
    const runAction = convex.action.bind(convex) as unknown as (fn: unknown, args: unknown) => Promise<TopUpCreditResult>;
  const credited = await runAction(SUBMIT_TOPUP_AND_AUTO_APPLY, {
    organizationId: organizationId as Id<"organizations">,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}


