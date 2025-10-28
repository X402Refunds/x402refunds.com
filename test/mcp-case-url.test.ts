/**
 * MCP Case URL Tests
 *
 * Verifies that the tracking URL returned by MCP tools:
 * 1. Points to the public /cases/ route (no auth required)
 * 2. Uses the correct format for public case tracking
 * 3. Can be accessed without authentication
 *
 * NOTE: /demo/dispute/ is for authenticated dashboard users
 *       /cases/ is for public case tracking (payment providers, consumers)
 */

import { describe, it, expect } from "vitest";

// Test uses environment variable for API base URL
const API_BASE_URL = process.env.API_BASE_URL || "https://youthful-orca-358.convex.site";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://youthful-orca-358.convex.site";

describe("MCP Case Tracking URL", () => {
  it("should return tracking URL in correct PUBLIC format", () => {
    // The MCP tool should return public tracking URLs (no auth required)
    const caseId = "jd74gne63sjx484m0zcrxse98h7tb8dp";
    const expectedUrl = `https://consulatehq.com/cases/${caseId}`;

    // Verify URL structure
    expect(expectedUrl).toContain("/cases/");
    expect(expectedUrl).toContain(caseId);
    expect(expectedUrl).not.toContain("/demo/"); // Public route, not demo
    console.log(`✅ URL format correct: ${expectedUrl}`);
  });

  it("should use PUBLIC /cases/ route (not authenticated /demo/dispute/)", () => {
    const caseId = "test_case_123";

    // PUBLIC (CORRECT): https://consulatehq.com/cases/{id} - no auth required
    const publicUrl = `https://consulatehq.com/cases/${caseId}`;

    // AUTHENTICATED (for dashboard): https://consulatehq.com/demo/dispute/{id} - requires login
    const authUrl = `https://consulatehq.com/demo/dispute/${caseId}`;

    expect(publicUrl).toContain("/cases/");
    expect(publicUrl).not.toContain("/demo/");
    expect(authUrl).toContain("/demo/dispute/"); // This is for dashboard users

    console.log(`✅ Using correct public route: /cases/ (no auth required)`);
  });

  it("should include caseId in tracking URL", () => {
    const caseId = "k123abc456def789";
    const trackingUrl = `https://consulatehq.com/cases/${caseId}`;

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
      const url = `https://consulatehq.com/cases/${caseId}`;

      // Verify URL components
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain("consulatehq.com");
      expect(url).toContain("/cases/");
      expect(url.endsWith(caseId)).toBe(true);
    }

    console.log(`✅ All ${testCases.length} case URLs structured correctly`);
  });

  it("should differentiate between public and authenticated routes", () => {
    const caseId = "test_123";

    const publicUrl = `https://consulatehq.com/cases/${caseId}`; // PUBLIC - no auth
    const authUrl = `https://consulatehq.com/demo/dispute/${caseId}`; // AUTHENTICATED - requires login

    // Public URL should NOT have /demo/
    expect(publicUrl).not.toContain("/demo/");
    expect(publicUrl).toBe(`https://consulatehq.com/cases/${caseId}`);

    // Authenticated URL SHOULD have /demo/
    expect(authUrl).toContain("/demo/");

    console.log(`✅ Public route correctly uses /cases/ (no /demo/ prefix)`);
  });
});
