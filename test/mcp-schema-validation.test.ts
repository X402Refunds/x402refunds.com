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
      expect(required).toContain("functionalType");
    });
  });

  describe("consulate_file_dispute", () => {
    it("should have disputeReason enum matching payment dispute types", () => {
      const disputeTool = MCP_TOOLS.find(t => t.name === "consulate_file_dispute");
      expect(disputeTool).toBeDefined();

      const disputeReasonEnum = disputeTool?.input_schema.properties.disputeReason.enum;
      expect(disputeReasonEnum).toBeDefined();

      // Valid payment dispute reasons
      expect(disputeReasonEnum).toContain("api_timeout");
      expect(disputeReasonEnum).toContain("service_not_rendered");
      expect(disputeReasonEnum).toContain("quality_issue");
      expect(disputeReasonEnum).toContain("amount_incorrect");
      expect(disputeReasonEnum).toContain("fraud");
      expect(disputeReasonEnum).toContain("duplicate_charge");
    });

    it("should have required fields matching unified dispute tool", () => {
      const disputeTool = MCP_TOOLS.find(t => t.name === "consulate_file_dispute");
      expect(disputeTool).toBeDefined();

      const required = disputeTool?.input_schema.required;
      // Unified tool - universal fields are required
      expect(required).toContain("plaintiff");
      expect(required).toContain("defendant");
      expect(required).toContain("amount");
      expect(required).toContain("description");
      
      // Payment-specific fields are optional (only required when filing payment disputes)
      expect(required).not.toContain("transactionId");
      expect(required).not.toContain("paymentProtocol");
      expect(required).not.toContain("disputeReason");
      
      // General dispute fields are also optional
      expect(required).not.toContain("category");
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
