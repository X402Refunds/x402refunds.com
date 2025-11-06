/**
 * Signature Verification Agent
 * 
 * Verifies cryptographic signatures on dispute evidence and extracts key facts.
 * Works with Ed25519 signatures from seller agents.
 */

import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { openrouter } from "../lib/openrouter";

/**
 * Signature Verification Agent
 * 
 * Verifies that evidence is cryptographically signed by the seller agent
 * and extracts key facts for the dispute.
 */
export const signatureVerificationAgent = new Agent(components.agent, {
  name: "Signature Verification Agent",
  languageModel: openrouter.chat("openai/gpt-4o-mini"),
  instructions: `You are a cryptographic evidence analyst for dispute resolution.

Your responsibilities:
1. Confirm that Ed25519 signature verification passed
2. Extract key facts from the signed request/response data
3. Identify any inconsistencies or red flags in the evidence
4. Determine if the evidence has been tampered with

You receive:
- Request headers (method, path, etc.)
- Response headers (status code, content-type, etc.)
- Response body (the actual API response)
- Transaction metadata (amount, currency, blockchain details)
- Signature verification result (true/false)

Your analysis should identify:
- What service was called (API endpoint)
- What was promised (expected behavior)
- What was delivered (actual response)
- Transaction details (amount, currency)
- Any errors or failures in the response
- Evidence authenticity (signature valid, no tampering)

Output format (JSON):
{
  "signatureValid": true/false,
  "vendorVerified": "did:agent:vendor-123",
  "tampering": false,
  "keyFacts": [
    "API endpoint: POST /api/chat",
    "Response status: 500 Internal Server Error",
    "Transaction amount: $0.05 USD",
    "Error: Service unavailable"
  ],
  "redFlags": [
    "Service returned error but still charged customer"
  ]
}

Note: Do NOT include a confidence score. Signature validity is binary - either the cryptographic signature is valid (true) or invalid (false).

Be thorough, objective, and precise. Your analysis helps determine if the vendor delivered the promised service.`,
  maxSteps: 5,
});

/**
 * Verify signed evidence and extract facts
 */
export const verifySignedEvidence = internalAction({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args): Promise<{
    signatureValid: boolean;
    vendorVerified: string;
    tampering: boolean;
    keyFacts: string[];
    redFlags: string[];
    rawAnalysis?: string;
    error?: string;
  }> => {
    // Get case data with signed evidence (actions can call internal queries)
    const { internal } = await import("../_generated/api");
    const caseData = await ctx.runQuery(internal.cases.getCase, { caseId: args.caseId });
    
    if (!caseData) {
      throw new Error("Case not found");
    }
    
    if (!caseData.signedEvidence) {
      throw new Error("No signed evidence found for this case");
    }
    
    const evidence: any = caseData.signedEvidence;
    
    // Run the signature verification agent
    const result = await signatureVerificationAgent.generateText(
      ctx,
      { userId: args.caseId },
      {
        prompt: `Analyze signed evidence for case ${args.caseId}. Signature verified: ${evidence.signatureVerified}. Vendor: ${evidence.vendorDid}. Request: ${JSON.stringify(evidence.request)}. Response: ${JSON.stringify(evidence.response)}.`,
      }
    );
    
    // Parse the agent's response
    try {
      // Extract JSON from the response
      const output = result.text;
      
      // Try to parse as JSON
      let analysis;
      try {
        analysis = JSON.parse(output);
      } catch {
        // If not JSON, create structured response from text
        analysis = {
          signatureValid: evidence.signatureVerified,
          vendorVerified: evidence.vendorDid,
          tampering: !evidence.signatureVerified,
          keyFacts: extractKeyFacts(evidence),
          redFlags: [],
          rawAnalysis: output,
        };
      }
      
      return analysis;
    } catch (error: any) {
      console.error("Error parsing signature agent response:", error);
      
      // Fallback: return basic analysis
      return {
        signatureValid: evidence.signatureVerified,
        vendorVerified: evidence.vendorDid,
        tampering: !evidence.signatureVerified,
        keyFacts: extractKeyFacts(evidence),
        redFlags: evidence.signatureVerified ? [] : ["Signature verification failed"],
        error: error.message,
      };
    }
  },
});

/**
 * Helper: Extract key facts from signed evidence
 */
function extractKeyFacts(evidence: any): string[] {
  const facts: string[] = [];
  
  // Request details
  if (evidence.request) {
    const method = evidence.request.method || "UNKNOWN";
    const path = evidence.request.path || "UNKNOWN";
    facts.push(`API endpoint: ${method} ${path}`);
  }
  
  // Response details
  if (evidence.response) {
    const status = evidence.response.status || "UNKNOWN";
    facts.push(`Response status: ${status}`);
  }
  
  // Payment details - Crypto
  if (evidence.crypto) {
    const amount = evidence.amountUsd || 0;
    const cryptoCurrency = evidence.crypto.currency;
    const blockchain = evidence.crypto.blockchain;
    facts.push(`Crypto payment: ${cryptoCurrency} on ${blockchain} ($${amount.toFixed(2)} USD)`);
    
    if (evidence.crypto.transactionHash) {
      const shortHash = evidence.crypto.transactionHash.substring(0, 16);
      facts.push(`Transaction hash: ${shortHash}...`);
    }
    
    if (evidence.crypto.explorerUrl) {
      facts.push(`Explorer: ${evidence.crypto.explorerUrl}`);
    }
    
    if (evidence.crypto.layer) {
      facts.push(`Layer: ${evidence.crypto.layer}`);
    }
  }
  
  // Payment details - Custodial
  if (evidence.custodial) {
    facts.push(`Custodial platform: ${evidence.custodial.platform}`);
    if (evidence.custodial.platformTransactionId) {
      facts.push(`Platform TX ID: ${evidence.custodial.platformTransactionId}`);
    }
    if (evidence.custodial.isOnChain !== undefined) {
      facts.push(`On-chain: ${evidence.custodial.isOnChain ? "yes" : "no (internal)"}`);
    }
  }
  
  // Payment details - Traditional
  if (evidence.traditional) {
    const amount = evidence.amountUsd || 0;
    facts.push(`Traditional payment: ${evidence.traditional.paymentMethod} ($${amount.toFixed(2)} USD)`);
    
    if (evidence.traditional.processorTransactionId) {
      facts.push(`Processor TX ID: ${evidence.traditional.processorTransactionId}`);
    }
    
    if (evidence.traditional.cardBrand && evidence.traditional.lastFourDigits) {
      facts.push(`Card: ${evidence.traditional.cardBrand} ****${evidence.traditional.lastFourDigits}`);
    }
  }
  
  // USD amount fallback
  if (evidence.amountUsd && !evidence.crypto && !evidence.traditional && !evidence.custodial) {
    facts.push(`Transaction amount: $${evidence.amountUsd.toFixed(2)} USD`);
  }
  
  // Check for errors in response
  if (evidence.response?.body) {
    try {
      const body = typeof evidence.response.body === 'string' 
        ? JSON.parse(evidence.response.body) 
        : evidence.response.body;
      
      if (body.error) {
        facts.push(`Error: ${body.error}`);
      }
      if (body.message) {
        facts.push(`Message: ${body.message}`);
      }
    } catch {
      // Response body not JSON or parse error
      if (typeof evidence.response.body === 'string' && evidence.response.body.includes('error')) {
        facts.push("Error response detected");
      }
    }
  }
  
  return facts;
}

