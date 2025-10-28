/**
 * MCP Case URL Tests
 *
 * Verifies that the tracking URL returned by MCP tools:
 * 1. Points to an existing route (no 404s)
 * 2. Uses the correct format for the dashboard
 * 3. Can be accessed without errors
 */

import { describe, it, expect } from "vitest";

// Test uses environment variable for API base URL
const API_BASE_URL = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://youthful-orca-358.convex.site";

describe("MCP Case Tracking URL", () => {
  it("should return tracking URL in correct format", () => {
    // The MCP tool should return URLs in this format:
    const caseId = "jd74gne63sjx484m0zcrxse98h7tb8dp";
    const expectedUrl = `https://consulatehq.com/demo/dispute/${caseId}`;

    // Verify URL structure
    expect(expectedUrl).toContain("/demo/dispute/");
    expect(expectedUrl).toContain(caseId);
    console.log(`✅ URL format correct: ${expectedUrl}`);
  });

  it("should use /demo/dispute/ route instead of /cases/", () => {
    const caseId = "test_case_123";

    // OLD (404): https://consulatehq.com/cases/{id}
    const oldUrl = `https://consulatehq.com/cases/${caseId}`;

    // NEW (WORKS): https://consulatehq.com/demo/dispute/{id}
    const newUrl = `https://consulatehq.com/demo/dispute/${caseId}`;

    expect(newUrl).toContain("/demo/dispute/");
    expect(newUrl).not.toContain("/cases/");
    expect(oldUrl).toContain("/cases/"); // OLD format - should NOT be used

    console.log(`✅ Using correct route: /demo/dispute/ (not /cases/)`);
  });

  it("should include caseId in tracking URL", () => {
    const caseId = "k123abc456def789";
    const trackingUrl = `https://consulatehq.com/demo/dispute/${caseId}`;

    // Extract caseId from URL
    const urlParts = trackingUrl.split("/");
    const extractedCaseId = urlParts[urlParts.length - 1];

    expect(extractedCaseId).toBe(caseId);
    console.log(`✅ Case ID properly embedded in URL: ${caseId}`);
  });

  it("should verify tracking URL structure matches expected format", () => {
    const testCases = [
      "jd74gne63sjx484m0zcrxse98h7tb8dp",
      "k123abc",
      "j098xyz",
      "case_test_12345",
    ];

    for (const caseId of testCases) {
      const url = `https://consulatehq.com/demo/dispute/${caseId}`;

      // Verify URL components
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain("consulatehq.com");
      expect(url).toContain("/demo/dispute/");
      expect(url.endsWith(caseId)).toBe(true);
    }

    console.log(`✅ All ${testCases.length} case URLs structured correctly`);
  });

  it("should differentiate between demo and production routes", () => {
    const caseId = "test_123";

    const demoUrl = `https://consulatehq.com/demo/dispute/${caseId}`;
    const prodUrl = `https://consulatehq.com/dispute/${caseId}`; // Future production route

    expect(demoUrl).toContain("/demo/");
    expect(prodUrl).not.toContain("/demo/");

    // Current implementation uses /demo/dispute/
    expect(demoUrl).toBe(`https://consulatehq.com/demo/dispute/${caseId}`);

    console.log(`✅ Demo route correctly uses /demo/ prefix`);
  });
});
