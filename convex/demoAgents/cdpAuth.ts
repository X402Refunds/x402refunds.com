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
    // Our client sends `X-PAYMENT` as base64(JSON(payload)), so we decode here.
    let decodedPayload: unknown = null;
    try {
      const json = Buffer.from(args.paymentHeader, "base64").toString("utf8");
      decodedPayload = JSON.parse(json);
    } catch {
      decodedPayload = null;
    }

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
            paymentPayload: decodedPayload ?? args.paymentHeader,
            paymentRequirements: args.paymentRequirements,
          }),
        });

        const verifyText = await verifyResponse.text();
        lastStatus = verifyResponse.status;
        lastBody = verifyText;

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && verifyResponse.status >= 500) continue;

        return { status: verifyResponse.status, body: verifyText };
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
 
    let decodedPayload: unknown = null;
    try {
      const json = Buffer.from(args.paymentHeader, "base64").toString("utf8");
      decodedPayload = JSON.parse(json);
    } catch {
      decodedPayload = null;
    }

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
            paymentPayload: decodedPayload ?? args.paymentHeader,
            paymentRequirements: args.paymentRequirements,
          }),
        });

        const settleText = await settleResponse.text();
        lastStatus = settleResponse.status;
        lastBody = settleText;

        // If no override is set and we got a 5xx, fall back to the next facilitator.
        if (!override && settleResponse.status >= 500) continue;

        return { status: settleResponse.status, body: settleText };
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


