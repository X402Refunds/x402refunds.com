/**
 * Signature Verification Agent
 * 
 * Verifies cryptographic signatures on dispute evidence and extracts key facts.
 * Works with Ed25519 signatures from seller agents.
 */

import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
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
  ],
  "confidence": 0.95
}

Be thorough, objective, and precise. Your analysis helps determine if the vendor delivered the promised service.`,
  maxSteps: 5,
});

/**
 * Verify signed evidence and extract facts
 */
export const verifySignedEvidence = action({
  args: {
    caseId: v.id("cases"),
  },
  handler: async (ctx, args) => {
    // Get case data with signed evidence
    const caseData = await ctx.runQuery(api.cases.getCase, { caseId: args.caseId });
    
    if (!caseData) {
      throw new Error("Case not found");
    }
    
    if (!caseData.signedEvidence) {
      throw new Error("No signed evidence found for this case");
    }
    
    const evidence = caseData.signedEvidence;
    
    // Run the signature verification agent
    const result = await signatureVerificationAgent.run(ctx, {
      input: JSON.stringify({
        signatureVerified: evidence.signatureVerified,
        vendorDid: evidence.vendorDid,
        requestHeaders: evidence.requestHeaders,
        responseHeaders: evidence.responseHeaders,
        responseBody: evidence.responseBody,
        transactionMetadata: evidence.transactionMetadata,
      }),
    });
    
    // Parse the agent's response
    try {
      // Extract JSON from the response
      const output = result.output;
      
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
          confidence: evidence.signatureVerified ? 0.9 : 0.1,
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
        confidence: evidence.signatureVerified ? 0.8 : 0.1,
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
  if (evidence.requestHeaders) {
    const method = evidence.requestHeaders.method || "UNKNOWN";
    const path = evidence.requestHeaders.path || "UNKNOWN";
    facts.push(`API endpoint: ${method} ${path}`);
  }
  
  // Response details
  if (evidence.responseHeaders) {
    const status = evidence.responseHeaders.status || "UNKNOWN";
    facts.push(`Response status: ${status}`);
  }
  
  // Transaction details
  if (evidence.transactionMetadata) {
    const amount = evidence.transactionMetadata.amount || 0;
    const currency = evidence.transactionMetadata.currency || "USD";
    facts.push(`Transaction amount: $${amount.toFixed(2)} ${currency}`);
    
    if (evidence.transactionMetadata.blockchain) {
      facts.push(`Blockchain: ${evidence.transactionMetadata.blockchain}`);
    }
    
    if (evidence.transactionMetadata.txHash) {
      facts.push(`Transaction hash: ${evidence.transactionMetadata.txHash.substring(0, 16)}...`);
    }
  }
  
  // Check for errors in response
  if (evidence.responseBody) {
    try {
      const body = typeof evidence.responseBody === 'string' 
        ? JSON.parse(evidence.responseBody) 
        : evidence.responseBody;
      
      if (body.error) {
        facts.push(`Error: ${body.error}`);
      }
      if (body.message) {
        facts.push(`Message: ${body.message}`);
      }
    } catch {
      // Response body not JSON or parse error
      if (typeof evidence.responseBody === 'string' && evidence.responseBody.includes('error')) {
        facts.push("Error response detected");
      }
    }
  }
  
  return facts;
}

