/**
 * OpenAPI Spec Validator Agent
 * 
 * Compares vendor's OpenAPI specification against actual API response
 * to determine if there was a contract breach.
 */

import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { openrouter } from "../lib/openrouter";

/**
 * OpenAPI Spec Validator Agent
 * 
 * Checks if the vendor's actual API response matches their promised
 * OpenAPI specification.
 */
export const specValidatorAgent = new Agent(components.agent, {
  name: "API Contract Validator",
  languageModel: openrouter.chat("openai/gpt-4o"),
  instructions: `You are an API contract compliance analyst for dispute resolution.

Your job is to compare a vendor's OpenAPI specification (their promised API contract) 
against their actual API response to determine if there was a contract breach.

You will receive:
1. OpenAPI Spec - The vendor's documented API contract
2. Request Path - The API endpoint that was called
3. Request Method - GET, POST, etc.
4. Response Status - The HTTP status code returned
5. Response Body - The actual response data

Your analysis should check:
1. **Endpoint Match** - Does the endpoint exist in the OpenAPI spec?
2. **Status Code** - Does the status code match what's documented?
3. **Response Schema** - Does the response body match the documented schema?
4. **Required Fields** - Are all required fields present?
5. **Data Types** - Do field types match (string vs number, etc.)?
6. **SLA Compliance** - If spec includes x-sla extension, check response time
7. **Error Handling** - If error response, is it documented?

Output format (JSON):
{
  "contractBreach": true/false,
  "violations": [
    "Response status 500 not documented in spec",
    "Missing required field 'response' in response body",
    "Response time 5000ms exceeds promised 200ms in x-sla"
  ],
  "confidence": 0.98,
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "details": {
    "endpointFound": true,
    "statusMatches": false,
    "schemaMatches": false,
    "slaCompliant": false
  }
}

Be precise and objective. A contract breach means the vendor did not deliver 
what they documented in their OpenAPI specification.`,
  maxSteps: 10,
});

/**
 * Validate API response against OpenAPI spec
 */
export const validateApiContract = action({
  args: {
    caseId: v.id("cases"),
    openApiSpec: v.any(),
    requestPath: v.string(),
    requestMethod: v.optional(v.string()),
    responseStatus: v.number(),
    responseBody: v.string(),
  },
  handler: async (ctx, args) => {
    // Run the spec validator agent
    const threadId = `case-${args.caseId}`;
    const result = await specValidatorAgent.generateText(
      ctx,
      { threadId },
      {
        prompt: `Validate API contract for case ${args.caseId}. OpenAPI Spec: ${JSON.stringify(args.openApiSpec)}. Request: ${args.requestMethod || "POST"} ${args.requestPath}. Response: ${args.responseStatus} - ${args.responseBody}`,
      }
    );
    
    // Parse the agent's response
    try {
      const output = result.text;
      
      // Try to parse as JSON
      let analysis;
      try {
        analysis = JSON.parse(output);
      } catch {
        // If not JSON, create structured response
        analysis = {
          contractBreach: output.toLowerCase().includes("breach") || output.toLowerCase().includes("violation"),
          violations: extractViolations(output),
          confidence: 0.7,
          severity: "MEDIUM",
          rawAnalysis: output,
        };
      }
      
      return analysis;
    } catch (error: any) {
      console.error("Error parsing spec validator response:", error);
      
      // Fallback: basic analysis
      return {
        contractBreach: false,
        violations: [],
        confidence: 0.5,
        severity: "LOW",
        error: error.message,
        note: "Unable to perform full contract validation",
      };
    }
  },
});

/**
 * Helper: Extract violations from text output
 */
function extractViolations(text: string): string[] {
  const violations: string[] = [];
  
  // Look for common violation patterns
  const violationPatterns = [
    /violation[s]?:?\s*(.+?)(?:\n|$)/gi,
    /breach[es]?:?\s*(.+?)(?:\n|$)/gi,
    /missing[s]?:?\s*(.+?)(?:\n|$)/gi,
    /incorrect[s]?:?\s*(.+?)(?:\n|$)/gi,
  ];
  
  for (const pattern of violationPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        violations.push(match[1].trim());
      }
    }
  }
  
  return violations.length > 0 ? violations : ["Contract analysis completed"];
}

