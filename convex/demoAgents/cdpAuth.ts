"use node";

/**
 * Facilitator Helper - Node.js Action
 * 
 * Handles payment verification and settlement via a facilitator.
 *
 * Default facilitator: `https://facilitator.mcpay.tech`
 * Override with `X402_FACILITATOR_URL`.
 *
 * NOTE: Some facilitators are strict about network identifiers (e.g. `base` vs `eip155:8453`).
 * If you see "No facilitator registered for scheme/network", check the facilitator's `/supported`
 * response and align your `paymentRequirements.network`.
 *
 * No authentication required.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

export function decodeXPaymentHeader(paymentHeader: string): unknown | null {
  // X-PAYMENT is typically base64(JSON(...)) but some clients use base64url.
  // Also, some clients embed an envelope like { paymentPayload, paymentRequirements }.
  const tryParse = (jsonText: string): unknown | null => {
    try {
      const parsed: unknown = JSON.parse(jsonText);
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        const maybeEnvelope = obj.paymentPayload;
        if (maybeEnvelope && typeof maybeEnvelope === "object") return maybeEnvelope;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  // Standard base64
  try {
    const json = Buffer.from(paymentHeader, "base64").toString("utf8");
    const parsed = tryParse(json);
    if (parsed !== null) return parsed;
  } catch {
    // ignore
  }

  // base64url (Node supports this encoding)
  try {
    // @ts-expect-error Node Buffer supports "base64url" in modern runtimes
    const json = Buffer.from(paymentHeader, "base64url").toString("utf8");
    const parsed = tryParse(json);
    if (parsed !== null) return parsed;
  } catch {
    // ignore
  }

  return null;
}

function normalizePaymentPayloadForFacilitator(
  decoded: unknown | null,
  paymentRequirements: any,
): unknown {
  if (!decoded || typeof decoded !== "object") return decoded ?? null;

  const obj = decoded as Record<string, unknown>;

  // Some clients send `version` instead of `x402Version`.
  const version =
    typeof obj.x402Version === "number"
      ? obj.x402Version
      : typeof obj.version === "number"
        ? obj.version
        : typeof obj.version === "string"
          ? Number(obj.version)
          : undefined;

  if (typeof version === "number" && Number.isFinite(version)) {
    // Ensure `x402Version` exists for facilitators that strictly deserialize.
    return { ...obj, x402Version: version };
  }

  // If the decoded object looks like an "inner payload" (authorization/signature),
  // re-wrap it into the X-402 envelope the facilitator expects:
  // { x402Version, scheme, network, payload }
  const inferredScheme =
    typeof obj.scheme === "string"
      ? obj.scheme
      : typeof paymentRequirements?.scheme === "string"
        ? paymentRequirements.scheme
        : undefined;
  const inferredNetwork =
    typeof obj.network === "string"
      ? obj.network
      : typeof paymentRequirements?.network === "string"
        ? paymentRequirements.network
        : undefined;

  // If the decoded object already has a `payload` field, keep it; otherwise treat the
  // whole object as the payload.
  const innerPayload = obj.payload ?? obj;

  return {
    x402Version: 1,
    scheme: inferredScheme,
    network: inferredNetwork,
    payload: innerPayload,
  };
}

/**
 * Verify payment via mcpay.tech facilitator
 */
export const verifyPayment = action({
  args: {
    paymentHeader: v.string(),
    paymentRequirements: v.any(),
  },
  handler: async (_ctx, args) => {
    const override = process.env.X402_FACILITATOR_URL;
    const facilitatorUrls = override
      ? [override]
      : ["https://facilitator.mcpay.tech", "https://facilitator.daydreams.systems"];
    
    // Facilitators often expect `paymentPayload` as a decoded JSON object, not a base64 string.
    // Decode and normalize any envelope formats.
    const decodedPayloadRaw = decodeXPaymentHeader(args.paymentHeader);
    const decodedPayload = normalizePaymentPayloadForFacilitator(
      decodedPayloadRaw,
      args.paymentRequirements,
    );

    let lastStatus = 500;
    let lastBody = "";
    let lastUrl = facilitatorUrls[0];

    for (const baseUrl of facilitatorUrls) {
      lastUrl = baseUrl;
      try {
        const verifyResponse = await fetch(`${baseUrl}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Facilitator schema: { paymentPayload, paymentRequirements }
            paymentPayload: decodedPayload ?? decodedPayloadRaw ?? args.paymentHeader,
            paymentRequirements: args.paymentRequirements,
          }),
        });

        const verifyText = await verifyResponse.text();
        lastStatus = verifyResponse.status;
        lastBody = verifyText;

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && verifyResponse.status >= 500) continue;

        return { status: verifyResponse.status, body: verifyText, facilitator: baseUrl };
      } catch (err: any) {
        lastStatus = 500;
        lastBody = `fetch_error: ${err?.message || String(err)}`;
        // Try next facilitator if present.
        continue;
      }
    }

    // Return the last attempt's response/error (caller will surface details).
    return {
      status: lastStatus,
      body: lastBody,
      facilitator: lastUrl,
    };
  },
});

/**
 * Settle payment via mcpay.tech facilitator
 */
export const settlePayment = action({
  args: {
    paymentHeader: v.string(),
    paymentRequirements: v.any(),
  },
  handler: async (_ctx, args) => {
    const override = process.env.X402_FACILITATOR_URL;
    const facilitatorUrls = override
      ? [override]
      : ["https://facilitator.mcpay.tech", "https://facilitator.daydreams.systems"];
 
    const decodedPayloadRaw = decodeXPaymentHeader(args.paymentHeader);
    const decodedPayload = normalizePaymentPayloadForFacilitator(
      decodedPayloadRaw,
      args.paymentRequirements,
    );

    let lastStatus = 500;
    let lastBody = "";
    let lastUrl = facilitatorUrls[0];

    for (const baseUrl of facilitatorUrls) {
      lastUrl = baseUrl;
      try {
        const settleResponse = await fetch(`${baseUrl}/settle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentPayload: decodedPayload ?? decodedPayloadRaw ?? args.paymentHeader,
            paymentRequirements: args.paymentRequirements,
          }),
        });

        const settleText = await settleResponse.text();
        lastStatus = settleResponse.status;
        lastBody = settleText;

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && settleResponse.status >= 500) continue;

        return { status: settleResponse.status, body: settleText, facilitator: baseUrl };
      } catch (err: any) {
        lastStatus = 500;
        lastBody = `fetch_error: ${err?.message || String(err)}`;
        continue;
      }
    }

    return {
      status: lastStatus,
      body: lastBody,
      facilitator: lastUrl,
    };
  },
});


