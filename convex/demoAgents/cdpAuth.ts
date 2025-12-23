"use node";

/**
 * Facilitator Helper - Node.js Action
 * 
 * Handles payment verification and settlement via a facilitator.
 *
 * We currently default to `facilitator.daydreams.systems` because
 * `facilitator.mcpay.tech` / `facilitator.payai.network` has been returning 500s
 * for POST /verify and POST /settle in production.
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
    const FACILITATOR_BASE_URL =
      process.env.X402_FACILITATOR_URL || "https://facilitator.daydreams.systems";
    
    // Facilitators often expect `paymentPayload` as a decoded JSON object, not a base64 string.
    // Our client sends `X-PAYMENT` as base64(JSON(payload)), so we decode here.
    let decodedPayload: unknown = null;
    try {
      const json = Buffer.from(args.paymentHeader, "base64").toString("utf8");
      decodedPayload = JSON.parse(json);
    } catch {
      decodedPayload = null;
    }

    const verifyResponse = await fetch(`${FACILITATOR_BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // Facilitator schema: { paymentPayload, paymentRequirements }
        paymentPayload: decodedPayload ?? args.paymentHeader,
        paymentRequirements: args.paymentRequirements,
      })
    });
    
    const verifyText = await verifyResponse.text();
    
    return {
      status: verifyResponse.status,
      body: verifyText
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
    const FACILITATOR_BASE_URL =
      process.env.X402_FACILITATOR_URL || "https://facilitator.daydreams.systems";
 
    let decodedPayload: unknown = null;
    try {
      const json = Buffer.from(args.paymentHeader, "base64").toString("utf8");
      decodedPayload = JSON.parse(json);
    } catch {
      decodedPayload = null;
    }

    const settleResponse = await fetch(`${FACILITATOR_BASE_URL}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        paymentPayload: decodedPayload ?? args.paymentHeader,
        paymentRequirements: args.paymentRequirements,
      })
    });
    
    const settleText = await settleResponse.text();
    
    return {
      status: settleResponse.status,
      body: settleText
    };
  },
});


