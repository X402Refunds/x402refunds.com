"use node";

/**
 * Test CDP API Authentication
 * Simple test to verify CDP credentials work
 */

import { action } from "../_generated/server";
import { createAuthHeader } from "@coinbase/x402";

export const testCdpAuth = action({
  args: {},
  handler: async (_ctx) => {
    const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID;
    const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET;
    
    if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
      return {
        error: "CDP credentials not configured",
        CDP_API_KEY_ID: CDP_API_KEY_ID ? "present" : "missing",
        CDP_API_KEY_SECRET: CDP_API_KEY_SECRET ? "present" : "missing"
      };
    }
    
    try {
      // Test JWT generation
      const jwt = await createAuthHeader(
        CDP_API_KEY_ID,
        CDP_API_KEY_SECRET,
        "GET",
        "api.cdp.coinbase.com",
        "/platform/v2/x402/supported"
      );
      
      // Test calling CDP API
      const response = await fetch("https://api.cdp.coinbase.com/platform/v2/x402/supported", {
        method: "GET",
        headers: {
          "Authorization": jwt,
          "Content-Type": "application/json"
        }
      });
      
      const text = await response.text();
      
      return {
        success: true,
        status: response.status,
        body: text,
        jwtGenerated: true,
        keyIdFormat: CDP_API_KEY_ID.substring(0, 20) + "..."
      };
    } catch (error: any) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  },
});


