/**
 * MCP Tool Schema Validation Tests
 *
 * Ensures that MCP tool definitions match the actual backend validators.
 * This prevents schema drift where MCP advertises parameters that backend rejects.
 */

import { describe, it, expect } from "vitest";
import { MCP_TOOLS } from "../convex/mcp";

describe("MCP Tool Schema Validation", () => {
  // Note: consulate_register_agent tool was removed - registration now via HTTP endpoint

  describe("x402_request_refund", () => {
    it("should have blockchain enum (base, solana only - USDC chains)", () => {
      const refundTool = MCP_TOOLS.find(t => t.name === "x402_request_refund");
      expect(refundTool).toBeDefined();

      // X-402 simplified schema - blockchain enum restricted to USDC-supported chains
      expect(refundTool?.inputSchema.properties.blockchain.enum).toBeDefined();
      expect(refundTool?.inputSchema.properties.blockchain.enum).toEqual(['base', 'solana']);
      
      // Plaintiff/defendant no longer in schema (extracted from blockchain)
      expect(refundTool?.inputSchema.properties.plaintiff).toBeUndefined();
      expect(refundTool?.inputSchema.properties.defendant).toBeUndefined();
    });

    it("should have required fields matching X-402 simplified schema", () => {
      const refundTool = MCP_TOOLS.find(t => t.name === "x402_request_refund");
      expect(refundTool).toBeDefined();

      const required = refundTool?.inputSchema.required;
      // X-402 simplified (7 required fields - plaintiff/defendant extracted from blockchain)
      expect(required).toContain("description");
      expect(required).toContain("request");  // Object
      expect(required).toContain("response");  // Object
      expect(required).toContain("transactionHash");
      expect(required).toContain("blockchain");
      expect(required).toContain("recipientAddress");
      
      // Plaintiff/defendant now extracted from blockchain (not required from agent)
      expect(required).not.toContain("plaintiff");
      expect(required).not.toContain("defendant");
      expect(required).not.toContain("disputeUrl");
      
      // These are extracted from blockchain
      expect(required).not.toContain("amountUsd");
      expect(required).not.toContain("currency");
      expect(required).not.toContain("fromAddress");
      expect(required).not.toContain("toAddress");
    });

    it("should support optional evidenceUrls", () => {
      const refundTool = MCP_TOOLS.find(t => t.name === "x402_request_refund");
      expect(refundTool).toBeDefined();
      expect(refundTool?.inputSchema.properties.evidenceUrls).toBeDefined();
    });
  });

  // Note: consulate_submit_evidence tool was removed - evidence is included in dispute filing

  describe("x402_check_refund_status", () => {
    it("should have required fields", () => {
      const statusTool = MCP_TOOLS.find(t => t.name === "x402_check_refund_status");
      expect(statusTool).toBeDefined();

      const required = statusTool?.inputSchema.required;
      expect(required).toContain("caseId");
    });
  });

  describe("x402_list_my_refund_requests", () => {
    it("should have status enum matching backend case statuses", () => {
      const listTool = MCP_TOOLS.find(t => t.name === "x402_list_my_refund_requests");
      expect(listTool).toBeDefined();

      const statusEnum = listTool?.inputSchema.properties.status.enum;
      expect(statusEnum).toBeDefined();

      // Valid case statuses
      expect(statusEnum).toContain("FILED");
      expect(statusEnum).toContain("UNDER_REVIEW");
      expect(statusEnum).toContain("IN_DELIBERATION");
      expect(statusEnum).toContain("DECIDED");
      expect(statusEnum).toContain("all");
    });
  });

  describe("All MCP Tools", () => {
    it("should have unique names", () => {
      const names = MCP_TOOLS.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(names.length).toBe(uniqueNames.size);
    });

    it("should have descriptions", () => {
      for (const tool of MCP_TOOLS) {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
      }
    });

    it("should have valid input schemas", () => {
      for (const tool of MCP_TOOLS) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it("should list exactly 4 tools (simplified set + demo)", () => {
      expect(MCP_TOOLS.length).toBe(4);

      const expectedTools = [
        "x402_request_refund",
        "x402_list_my_refund_requests",
        "x402_check_refund_status",
        "demo_image_generator"
      ];

      const actualNames = MCP_TOOLS.map(t => t.name);
      expect(actualNames).toEqual(expectedTools);
      // Verify old tool is removed
      expect(actualNames).not.toContain("consulate_file_general_dispute");
    });
  });
});
