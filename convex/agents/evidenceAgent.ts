/**
 * Evidence Review Agent
 * 
 * Specialized agent for reviewing and validating evidence
 * Handles web content, API checks, document parsing, and image analysis
 */

import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openrouter } from "../lib/openrouter";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
import { z } from "zod";

// Fetch web content tool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchWebEvidence: any = createTool({
  description: "Fetch and validate web content from a URL. Use for checking evidence links, API documentation, or web pages.",
  args: z.object({
    url: z.string().describe("The URL to fetch"),
    maxLength: z.number().optional().describe("Maximum length of content to return"),
  }),
  handler: async (ctx: any, args: { url: string; maxLength?: number }) => {
    const result = await ctx.runAction(api.evidence.webFetcher.fetchWebContent, args);
    return result;
  },
});

// Check API endpoint tool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkApiEndpoint: any = createTool({
  description: "Check if an API endpoint is healthy and responding correctly. Use for validating API evidence.",
  args: z.object({
    endpoint: z.string().describe("The API endpoint URL to check"),
    expectedStatus: z.number().optional().describe("Expected HTTP status code"),
    method: z.string().optional().describe("HTTP method to use (default: GET)"),
  }),
  handler: async (ctx: any, args: { endpoint: string; expectedStatus?: number; method?: string }) => {
    const result = await ctx.runAction(api.evidence.webFetcher.checkApiHealth, args);
    return result;
  },
});

// Analyze image tool
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analyzeScreenshot: any = createTool({
  description: "Analyze an image or screenshot from a URL. Use for validating visual evidence.",
  args: z.object({
    imageUrl: z.string().describe("URL of the image to analyze"),
    context: z.string().describe("Context about what to look for in the image"),
  }),
  handler: async (ctx: any, args: { imageUrl: string; context: string }) => {
    const result = await ctx.runAction(api.evidence.webFetcher.analyzeImage, args);
    return result;
  },
});

// Parse document tool (placeholder - can be extended with actual document parsing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseDocument: any = createTool({
  description: "Parse and validate a document from a URL. Supports PDFs, JSON, XML, and text files.",
  args: z.object({
    documentUrl: z.string().describe("URL of the document to parse"),
    documentType: z.string().describe("Type of document (pdf, docx, txt, etc.)"),
  }),
  handler: async (ctx: any, args: { documentUrl: string; documentType: string }) => {
    // Fetch document and return basic info
    const content = await ctx.runAction(api.evidence.webFetcher.fetchWebContent, {
      url: args.documentUrl,
      maxLength: 100000,
    });

    return {
      success: content.success,
      documentType: args.documentType,
      hasContent: content.success && !!content.content,
      contentLength: content.success ? content.content?.length : 0,
      note: "Document fetched successfully. Review content for validity.",
    };
  },
});

// Define Evidence Review Agent
export const evidenceReviewAgent = new Agent(components.agent, {
  name: "Evidence Review Agent",
  languageModel: openrouter.chat("openai/gpt-oss-20b"), // Use cost-effective model for evidence review
  instructions: `You are an evidence analyst for a dispute resolution platform. Your ONLY job is to review and validate evidence.

CRITICAL RULES:
1. Validate ALL evidence URLs are accessible and legitimate
2. Check API endpoints are responding correctly
3. Verify screenshots/images match their descriptions
4. Parse documents and extract key facts
5. Report any suspicious or invalid evidence
6. Be thorough but efficient - you're processing many cases

Your output should be a structured analysis:
- Evidence validity (valid/invalid/suspicious)
- Key facts extracted
- Any concerns or red flags
- Confidence score (0-1)

Do NOT make legal judgments - just validate evidence quality.`,
  tools: {
    fetchWebEvidence,
    checkApiEndpoint,
    analyzeScreenshot,
    parseDocument,
  },
  maxSteps: 10,
});

// Export as action for workflow integration
export const reviewEvidence = action({
  args: {
    caseId: v.id("cases"),
    evidenceId: v.optional(v.id("evidenceManifests")),
    quick: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Create or get thread for this case
    const threadId = `case-${args.caseId}`;
    
    // Use agent to review evidence
    const result = await evidenceReviewAgent.generateText(
      ctx,
      { threadId },
      {
        prompt: `Review evidence for case ${args.caseId}. Evidence ID: ${args.evidenceId || "all"}. ${args.quick ? "Quick review mode." : ""}`,
      }
    );

    return {
      success: true,
      analysis: result.text,
      steps: result.steps,
    };
  },
});

