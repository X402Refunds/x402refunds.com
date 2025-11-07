/**
 * MCP Tool Schema Validation Tests
 *
 * Ensures that MCP tool definitions match the actual backend validators.
 * This prevents schema drift where MCP advertises parameters that backend rejects.
 */

import { describe, it, expect } from "vitest";
import { MCP_TOOLS } from "../convex/mcp";

describe("MCP Tool Schema Validation", () => {
  describe("consulate_register_agent", () => {
    it("should have functionalType enum matching backend schema", () => {
      const registerTool = MCP_TOOLS.find(t => t.name === "consulate_register_agent");
      expect(registerTool).toBeDefined();

      const functionalTypeEnum = registerTool?.input_schema.properties.functionalType.enum;
      expect(functionalTypeEnum).toBeDefined();

      // These are the exact values from convex/schema.ts agents table
      const expectedValues = [
        "voice", "chat", "social", "translation", "presentation",
        "coding", "devops", "security", "data", "api",
        "writing", "design", "video", "music", "gaming",
        "research", "financial", "sales", "marketing", "legal",
        "healthcare", "education", "scientific", "manufacturing", "transportation",
        "scheduler", "workflow", "procurement", "project", "general"
      ];

      expect(functionalTypeEnum).toEqual(expectedValues);

      // Ensure NO invalid values are present
      const invalidValues = ["ai_provider", "ai_consumer", "monitoring"];
      for (const invalid of invalidValues) {
        expect(functionalTypeEnum).not.toContain(invalid);
      }
    });

    it("should have required fields matching backend mutation", () => {
      const registerTool = MCP_TOOLS.find(t => t.name === "consulate_register_agent");
      expect(registerTool).toBeDefined();

      const required = registerTool?.input_schema.required;
      expect(required).toContain("name");
      expect(required).toContain("publicKey");
      expect(required).toContain("organizationName");
      // functionalType is now optional
      expect(required).not.toContain("functionalType");
    });
  });

  describe("consulate_file_dispute", () => {
    it("should have disputeReason enum matching payment dispute types", () => {
      const disputeTool = MCP_TOOLS.find(t => t.name === "consulate_file_dispute");
      expect(disputeTool).toBeDefined();

      // Pre-signed payload approach - evidencePayload contains the signed data
      expect(disputeTool?.input_schema.properties.evidencePayload).toBeDefined();
      expect(disputeTool?.input_schema.properties.signature).toBeDefined();
    });

    it("should have required fields matching simplified dispute tool", () => {
      const disputeTool = MCP_TOOLS.find(t => t.name === "consulate_file_dispute");
      expect(disputeTool).toBeDefined();

      const required = disputeTool?.input_schema.required;
      // X402 payment disputes with pre-signed payload
      expect(required).toContain("plaintiff");
      expect(required).toContain("disputeUrl");
      expect(required).toContain("description");
      expect(required).toContain("evidencePayload");
      expect(required).toContain("signature");
      
      // Defendant, amount extracted from evidencePayload
      expect(required).not.toContain("defendant");
      expect(required).not.toContain("amount");
    });
  });

  describe("consulate_submit_evidence", () => {
    it("should have evidenceType enum matching backend validators", () => {
      const evidenceTool = MCP_TOOLS.find(t => t.name === "consulate_submit_evidence");
      expect(evidenceTool).toBeDefined();

      const evidenceTypeEnum = evidenceTool?.input_schema.properties.evidenceType.enum;
      expect(evidenceTypeEnum).toBeDefined();

      // Valid evidence types
      expect(evidenceTypeEnum).toContain("api_logs");
      expect(evidenceTypeEnum).toContain("monitoring_data");
      expect(evidenceTypeEnum).toContain("contract");
      expect(evidenceTypeEnum).toContain("sla_document");
      expect(evidenceTypeEnum).toContain("communication");
      expect(evidenceTypeEnum).toContain("financial_record");
    });
  });

  describe("consulate_check_case_status", () => {
    it("should have required fields", () => {
      const statusTool = MCP_TOOLS.find(t => t.name === "consulate_check_case_status");
      expect(statusTool).toBeDefined();

      const required = statusTool?.input_schema.required;
      expect(required).toContain("caseId");
    });
  });

  describe("consulate_list_my_cases", () => {
    it("should have status enum matching backend case statuses", () => {
      const listTool = MCP_TOOLS.find(t => t.name === "consulate_list_my_cases");
      expect(listTool).toBeDefined();

      const statusEnum = listTool?.input_schema.properties.status.enum;
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
        expect(tool.input_schema).toBeDefined();
        expect(tool.input_schema.type).toBe("object");
        expect(tool.input_schema.properties).toBeDefined();
      }
    });

    it("should list exactly 8 tools (unified dispute endpoint)", () => {
      expect(MCP_TOOLS.length).toBe(8);

      const expectedTools = [
        "consulate_file_dispute", // Unified tool (payment + general)
        "consulate_submit_evidence",
        "consulate_check_case_status",
        "consulate_register_agent",
        "consulate_list_my_cases",
        "consulate_get_sla_status",
        "consulate_lookup_agent",
        "consulate_request_vendor_registration"
      ];

      const actualNames = MCP_TOOLS.map(t => t.name);
      expect(actualNames).toEqual(expectedTools);
      // Verify old tool is removed
      expect(actualNames).not.toContain("consulate_file_general_dispute");
    });
  });
});
