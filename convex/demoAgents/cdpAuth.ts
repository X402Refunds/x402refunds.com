"use node";

/**
 * CDP Authentication Helper - Node.js Action
 * 
 * This action runs in Node.js runtime where Buffer and crypto APIs are available.
 * It generates JWT tokens for authenticating with Coinbase Developer Platform API.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { createAuthHeader } from "@coinbase/x402";

/**
 * Verify payment via x402.org facilitator with CDP authentication
 */
export const verifyPayment = action({
  args: {
    paymentHeader: v.string(), // Raw payment header string (not decoded)
    paymentRequirements: v.any(),
    apiKeyId: v.string(),
    apiKeySecret: v.string(),
  },
  handler: async (_ctx, args) => {
    const FACILITATOR_BASE_URL = "https://x402.org";
    const FACILITATOR_PATH = "/facilitator/verify";
    const FACILITATOR_HOST = "x402.org";
    
    // Generate CDP JWT authentication header
    const authHeader = await createAuthHeader(
      args.apiKeyId,
      args.apiKeySecret,
      "POST",
      FACILITATOR_HOST,
      FACILITATOR_PATH
    );
    
    // Call x402.org facilitator with CDP authentication
    const verifyResponse = await fetch(`${FACILITATOR_BASE_URL}${FACILITATOR_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        version: "1", // x402.org facilitator expects "version" field as string
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
 * Settle payment via x402.org facilitator with CDP authentication
 */
export const settlePayment = action({
  args: {
    paymentHeader: v.string(), // Raw payment header string (not decoded)
    paymentRequirements: v.any(),
    apiKeyId: v.string(),
    apiKeySecret: v.string(),
  },
  handler: async (_ctx, args) => {
    const FACILITATOR_BASE_URL = "https://x402.org";
    const FACILITATOR_PATH = "/facilitator/settle";
    const FACILITATOR_HOST = "x402.org";
    
    // Generate CDP JWT authentication header
    const authHeader = await createAuthHeader(
      args.apiKeyId,
      args.apiKeySecret,
      "POST",
      FACILITATOR_HOST,
      FACILITATOR_PATH
    );
    
    // Call x402.org facilitator with CDP authentication
    const settleResponse = await fetch(`${FACILITATOR_BASE_URL}${FACILITATOR_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        version: "1", // x402.org facilitator expects "version" field as string
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


