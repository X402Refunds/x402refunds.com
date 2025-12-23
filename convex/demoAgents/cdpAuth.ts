"use node";

/**
 * Facilitator Helper - Node.js Action
 * 
 * Handles payment verification and settlement via mcpay.tech facilitator.
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
    const FACILITATOR_BASE_URL = "https://facilitator.mcpay.tech";
    
    // mcpay.tech is a high-availability proxy (no auth required)
    // Proxies to facilitator.x402.rs and facilitator.payai.network
    const verifyResponse = await fetch(`${FACILITATOR_BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "1",
        paymentPayload: args.paymentHeader,
        paymentRequirements: args.paymentRequirements
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
    const FACILITATOR_BASE_URL = "https://facilitator.mcpay.tech";
    
    // mcpay.tech is a high-availability proxy (no auth required)
    const settleResponse = await fetch(`${FACILITATOR_BASE_URL}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "1",
        paymentPayload: args.paymentHeader,
        paymentRequirements: args.paymentRequirements
      })
    });
    
    const settleText = await settleResponse.text();
    
    return {
      status: settleResponse.status,
      body: settleText
    };
  },
});


