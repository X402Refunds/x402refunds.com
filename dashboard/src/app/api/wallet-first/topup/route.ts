import { NextResponse } from "next/server";

// Uses Node APIs (proxying upstream response headers) and should not run in Edge runtime.
export const runtime = "nodejs";

const UPSTREAM_API_BASE = "https://api.x402refunds.com";

export async function POST(request: Request) {
  const bodyText = await request.text().catch(() => "");

  // Proxy the wallet-first endpoint server-side to avoid browser CORS / preflight variability.
  const res = await fetch(`${UPSTREAM_API_BASE}/v1/topup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bodyText,
  });

  const text = await res.text();

  // Pass through key X-402 headers so clients can use v2 (PAYMENT-REQUIRED) if desired.
  const paymentRequired = res.headers.get("PAYMENT-REQUIRED") || res.headers.get("payment-required");
  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("content-type") || "application/json");
  if (paymentRequired) headers.set("PAYMENT-REQUIRED", paymentRequired);

  // Mirror status codes (402, 202, 200, 4xx) as-is.
  return new NextResponse(text, { status: res.status, headers });
}

