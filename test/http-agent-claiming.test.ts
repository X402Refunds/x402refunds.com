/**
 * Agent claiming HTTP endpoint has been removed from the public HTTP surface.
 */

import { describe, it, expect } from "vitest";
import { API_BASE_URL } from "./fixtures";

describe("Removed endpoint: /agents/claim", () => {
  it("OPTIONS /agents/claim should be removed (404)", async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, { method: "OPTIONS" });
    expect(response.status).toBe(404);
  });

  it("POST /agents/claim should be removed (404)", async () => {
    const response = await fetch(`${API_BASE_URL}/agents/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(404);
  });
});

