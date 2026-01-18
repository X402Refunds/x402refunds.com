/**
 * MCP Tool Schema Validation Tests
 *
 * Ensures that MCP tool definitions match the actual backend validators.
 * This prevents schema drift where MCP advertises parameters that backend rejects.
 */

import { describe, it, expect } from "vitest";
import { MCP_TOOLS } from "../convex/mcp";

describe("MCP Tool Schema Validation", () => {
  describe("image_generator", () => {
    it("should be the only enabled tool", () => {
      const names = MCP_TOOLS.map((t) => t.name);
      expect(names).toEqual(["image_generator"]);
    });

    it("should have required fields", () => {
      const tool = MCP_TOOLS.find((t) => t.name === "image_generator");
      expect(tool).toBeDefined();
      expect(tool?.inputSchema?.required).toEqual(["prompt"]);
    });

    it("should have prompt validation constraints", () => {
      const tool = MCP_TOOLS.find((t) => t.name === "image_generator");
      expect(tool).toBeDefined();
      const prompt = tool?.inputSchema?.properties?.prompt;
      expect(prompt).toBeDefined();
      expect(prompt.minLength).toBe(3);
      expect(prompt.maxLength).toBe(1000);
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
  });
});
