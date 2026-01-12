import fs from "fs/promises";
import path from "path";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/layout";
import { DocsClient } from "./DocsClient";

export const metadata = {
  title: "Docs - x402Disputes",
  description: "Simple documentation for x402Disputes (post-transaction disputes + refunds).",
};

function splitDocsMarkdown(md: string): {
  title: string;
  merchants: string;
  buyers: string;
} {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || "Docs";

  const merchantsIdx = md.search(/^##\s+Integration Guide for Merchants\s*$/m);
  const buyersIdx =
    md.search(/^##\s+File Disputes as a Buyer Agent\s*$/m) >= 0
      ? md.search(/^##\s+File Disputes as a Buyer Agent\s*$/m)
      : md.search(/^##\s+Submit Refund Requests as a Buyer Agent\s*$/m);

  const safeSlice = (start: number, end: number) => (start >= 0 ? md.slice(start, end >= 0 ? end : md.length).trim() : "");

  const merchants = safeSlice(merchantsIdx, buyersIdx);
  const buyers = safeSlice(buyersIdx, -1);

  return { title, merchants, buyers };
}

async function mdToHtml(md: string) {
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return processed.toString();
}

async function getDocsSections() {
  // Next.js app runs with cwd at `dashboard/`, so go up one directory.
  const markdownPath = path.join(process.cwd(), "..", "docs", "refund-requests.md");
  const md = await fs.readFile(markdownPath, "utf8");

  const { title, merchants, buyers } = splitDocsMarkdown(md);

  const stripSuffix = (s: string) => s.replace(/\s*\(Developer Docs\)\s*$/i, "").trim();

  const splitBuyerPanels = (buyersMd: string) => {
    const httpIdx = buyersMd.search(/^###\s+HTTP\s+\(default\)\s*$/m);
    const mcpIdx = buyersMd.search(/^###\s+MCP\s*(?:\(.+\))?\s*$/m);
    const safeSlice = (start: number, end: number) =>
      start >= 0 ? buyersMd.slice(start, end >= 0 ? end : buyersMd.length).trim() : "";
    return {
      httpMd: safeSlice(httpIdx, mcpIdx),
      mcpMd: safeSlice(mcpIdx, -1),
    };
  };

  const buyerPanels = splitBuyerPanels(buyers);

  return {
    title: stripSuffix(title),
    sections: {
      merchants: await mdToHtml(merchants),
      buyers: await mdToHtml(buyers),
    },
    buyerPanels: {
      http: buyerPanels.httpMd ? await mdToHtml(buyerPanels.httpMd) : "",
      mcp: buyerPanels.mcpMd ? await mdToHtml(buyerPanels.mcpMd) : "",
    },
  };
}

export default async function DocsPage() {
  const { title, sections, buyerPanels } = await getDocsSections();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 bg-background">
        <Section spacing="tight" containerClassName="max-w-4xl">
          <DocsClient title={title} sections={sections} buyerPanels={buyerPanels} />
        </Section>
      </main>
      <Footer />
    </div>
  );
}

