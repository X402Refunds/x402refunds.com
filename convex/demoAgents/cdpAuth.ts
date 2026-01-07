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
    const json = Buffer.from(paymentHeader, "base64url").toString("utf8");
    const parsed = tryParse(json);
    if (parsed !== null) return parsed;
  } catch {
    // ignore
  }

  return null;
}

function normalizeNetworkToV1(network: string | undefined): string | undefined {
  if (!network) return network;
  // v2 commonly uses CAIP-2-like network identifiers: eip155:8453
  // Most v1 facilitators expect "base".
  if (network === "eip155:8453") return "base";
  return network;
}

function downgradeV2ToV1PaymentPayload(decoded: unknown | null): unknown | null {
  if (!decoded || typeof decoded !== "object") return decoded ?? null;
  const obj = decoded as Record<string, unknown>;
  const v =
    typeof obj.x402Version === "number"
      ? obj.x402Version
      : typeof obj.version === "number"
        ? obj.version
        : typeof obj.version === "string"
          ? Number(obj.version)
          : undefined;
  if (v !== 2) return decoded;

  const network = typeof obj.network === "string" ? obj.network : undefined;
  return {
    ...obj,
    x402Version: 1,
    // v1 facilitators often treat `network` as a named chain (e.g. "base")
    network: normalizeNetworkToV1(network),
  };
}

function downgradeV2ToV1PaymentRequirements(req: any): any {
  if (!req || typeof req !== "object") return req;
  const network = typeof req.network === "string" ? req.network : undefined;
  const amount =
    typeof req.amount === "string"
      ? req.amount
      : typeof req.maxAmountRequired === "string"
        ? req.maxAmountRequired
        : undefined;

  // Keep all original fields, but add v1-friendly ones.
  return {
    ...req,
    network: normalizeNetworkToV1(network),
    maxAmountRequired: typeof req.maxAmountRequired === "string" ? req.maxAmountRequired : amount,
    // Some facilitator schemas are strict about presence of x402Version even in requirements.
    x402Version: 1,
  };
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
    network: normalizeNetworkToV1(inferredNetwork),
    payload: innerPayload,
  };
}

function inferX402Version(decodedPayload: unknown | null): number {
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
        const originalX402Version = inferX402Version(decodedPayload as any);
        const attempt = async (params: {
          x402Version: number;
          paymentPayload: unknown;
          paymentRequirements: any;
        }) => {
          const resp = await fetch(`${baseUrl}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // Some facilitator deployments expect `x402Version` at the top-level.
              x402Version: params.x402Version,
              // Facilitator schema: { paymentPayload, paymentRequirements }
              paymentPayload: params.paymentPayload,
              paymentRequirements: params.paymentRequirements,
            }),
          });
          const text = await resp.text();
          return { status: resp.status, body: text };
        };

        // First attempt: whatever the client provided.
        const first = await attempt({
          x402Version: originalX402Version,
          paymentPayload: decodedPayload ?? decodedPayloadRaw ?? args.paymentHeader,
          paymentRequirements: args.paymentRequirements,
        });
        lastStatus = first.status;
        lastBody = first.body;

        // If the facilitator doesn't support v2 yet, retry by downgrading to a v1-compatible shape.
        if (
          originalX402Version === 2 &&
          first.status >= 400 &&
          first.status < 500 &&
          typeof first.body === "string" &&
          first.body.toLowerCase().includes("unsupported x402version")
        ) {
          const downgradedPayload = downgradeV2ToV1PaymentPayload(
            (decodedPayload ?? decodedPayloadRaw) as any,
          );
          const downgradedRequirements = downgradeV2ToV1PaymentRequirements(args.paymentRequirements);
          const second = await attempt({
            x402Version: 1,
            paymentPayload: normalizePaymentPayloadForFacilitator(
              downgradedPayload as any,
              downgradedRequirements,
            ),
            paymentRequirements: downgradedRequirements,
          });
          lastStatus = second.status;
          lastBody = second.body;
          return { status: second.status, body: second.body, facilitator: baseUrl };
        }

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && first.status >= 500) continue;

        return { status: first.status, body: first.body, facilitator: baseUrl };
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
        const originalX402Version = inferX402Version(decodedPayload as any);
        const attempt = async (params: {
          x402Version: number;
          paymentPayload: unknown;
          paymentRequirements: any;
        }) => {
          const resp = await fetch(`${baseUrl}/settle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              x402Version: params.x402Version,
              paymentPayload: params.paymentPayload,
              paymentRequirements: params.paymentRequirements,
            }),
          });
          const text = await resp.text();
          return { status: resp.status, body: text };
        };

        const first = await attempt({
          x402Version: originalX402Version,
          paymentPayload: decodedPayload ?? decodedPayloadRaw ?? args.paymentHeader,
          paymentRequirements: args.paymentRequirements,
        });
        lastStatus = first.status;
        lastBody = first.body;

        if (
          originalX402Version === 2 &&
          first.status >= 400 &&
          first.status < 500 &&
          typeof first.body === "string" &&
          first.body.toLowerCase().includes("unsupported x402version")
        ) {
          const downgradedPayload = downgradeV2ToV1PaymentPayload(
            (decodedPayload ?? decodedPayloadRaw) as any,
          );
          const downgradedRequirements = downgradeV2ToV1PaymentRequirements(args.paymentRequirements);
          const second = await attempt({
            x402Version: 1,
            paymentPayload: normalizePaymentPayloadForFacilitator(
              downgradedPayload as any,
              downgradedRequirements,
            ),
            paymentRequirements: downgradedRequirements,
          });
          lastStatus = second.status;
          lastBody = second.body;
          return { status: second.status, body: second.body, facilitator: baseUrl };
        }

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && first.status >= 500) continue;

        return { status: first.status, body: first.body, facilitator: baseUrl };
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


