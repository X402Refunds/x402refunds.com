import fs from "fs/promises";
import path from "path";

export function splitDocsMarkdown(md: string): {
  title: string;
  merchants: string;
  buyers: string;
} {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || "Docs";

  const merchantsIdx = md.search(/^##\s+Integration Guide for Sellers\s*$/m);
  const buyersIdx =
    md.search(/^##\s+File Disputes as a Buyer\s*$/m) >= 0
      ? md.search(/^##\s+File Disputes as a Buyer\s*$/m)
      : md.search(/^##\s+Submit Refund Requests as a Buyer\s*$/m);

  const safeSlice = (start: number, end: number) =>
    start >= 0 ? md.slice(start, end >= 0 ? end : md.length).trim() : "";

  const merchants = safeSlice(merchantsIdx, buyersIdx);
  const buyers = safeSlice(buyersIdx, -1);

  return { title, merchants, buyers };
}

export function splitBuyerPanels(buyersMd: string): { httpMd: string; mcpMd: string } {
  const mcpIdx = buyersMd.search(/^###\s+MCP\s*(?:\(.+\))?\s*$/m);
  const httpIdx = buyersMd.search(/^###\s+HTTP\s*$/m);
  const safeSlice = (start: number, end: number) =>
    start >= 0 ? buyersMd.slice(start, end >= 0 ? end : buyersMd.length).trim() : "";
  return {
    mcpMd: safeSlice(mcpIdx, httpIdx),
    httpMd: safeSlice(httpIdx, -1),
  };
}

export async function readRefundRequestsMarkdown(): Promise<string> {
  // Next.js app runs with cwd at `dashboard/`, so go up one directory.
  const markdownPath = path.join(process.cwd(), "..", "docs", "refund-requests.md");
  return await fs.readFile(markdownPath, "utf8");
}

