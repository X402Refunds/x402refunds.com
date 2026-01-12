import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { splitBuyerPanels, splitDocsMarkdown } from "../../dashboard/src/app/docs/docsMarkdown";

describe("docs/refund-requests.md splitter", () => {
  it("keeps sellers + buyer sections non-empty", () => {
    const mdPath = path.join(process.cwd(), "docs", "refund-requests.md");
    const md = fs.readFileSync(mdPath, "utf8");

    const { merchants, buyers } = splitDocsMarkdown(md);
    expect(merchants.length).toBeGreaterThan(0);
    expect(buyers.length).toBeGreaterThan(0);

    // Sanity: ensure the section headings we rely on are present.
    expect(md).toMatch(/^##\s+Integration Guide for Sellers\s*$/m);
    expect(md).toMatch(/^##\s+Submit Refund Requests as a Buyer\s*$/m);
  });

  it("keeps buyer HTTP + MCP panels non-empty", () => {
    const mdPath = path.join(process.cwd(), "docs", "refund-requests.md");
    const md = fs.readFileSync(mdPath, "utf8");
    const { buyers } = splitDocsMarkdown(md);

    const { httpMd, mcpMd } = splitBuyerPanels(buyers);
    expect(httpMd.length).toBeGreaterThan(0);
    expect(mcpMd.length).toBeGreaterThan(0);

    expect(httpMd).toContain("POST https://api.x402refunds.com/v1/refunds");
    expect(httpMd).toContain("GET https://api.x402refunds.com/v1/refund?id=<caseId>");
    expect(mcpMd.toLowerCase()).toContain("mcp");
    expect(mcpMd).toContain("https://api.x402refunds.com/.well-known/mcp.json");
    expect(mcpMd).toContain("x402_request_refund");
  });
});

