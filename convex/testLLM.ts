// Test LLM functionality deployment

import { action } from "./_generated/server";
import { v } from "convex/values";

// Simple test function to verify deployment
export const simpleTest = action({
  args: {},
  handler: async (ctx) => {
    console.log("✅ Test LLM function working!");
    return { success: true, message: "Test deployment successful" };
  }
});

