import fs from "fs/promises";
import path from "path";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { DocsClient } from "./DocsClient";

export const metadata = {
  title: "Docs - x402Disputes",
  description: "Simple documentation for x402Disputes (pre-transaction vs post-transaction disputes).",
};

function splitDocsMarkdown(md: string): {
  title: string;
  overview: string;
  merchants: string;
  buyers: string;
} {
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || "Docs";

  const overviewIdx = md.search(/^##\s+Overview\s*$/m);
  const merchantsIdx = md.search(/^##\s+Integration Guide for Merchants\s*$/m);
  const buyersIdx = md.search(/^##\s+File Disputes as a Buyer Agent\s*$/m);

  const safeSlice = (start: number, end: number) => (start >= 0 ? md.slice(start, end >= 0 ? end : md.length).trim() : "");

  const overview = safeSlice(overviewIdx, merchantsIdx);
  const merchants = safeSlice(merchantsIdx, buyersIdx);
  const buyers = safeSlice(buyersIdx, -1);

  return { title, overview, merchants, buyers };
}

async function mdToHtml(md: string) {
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return processed.toString();
}

async function getDocsSections() {
  // Next.js app runs with cwd at `dashboard/`, so go up one directory.
  const markdownPath = path.join(process.cwd(), "..", "docs", "disputes.md");
  const md = await fs.readFile(markdownPath, "utf8");

  const { title, overview, merchants, buyers } = splitDocsMarkdown(md);

  const stripSuffix = (s: string) => s.replace(/\s*\(Developer Docs\)\s*$/i, "").trim();

  const splitBuyerPanels = (buyersMd: string) => {
    const httpIdx = buyersMd.search(/^###\s+HTTP\s+\(default\)\s*$/m);
    const mcpIdx = buyersMd.search(/^###\s+MCP\s+\(for LLMs\)\s*$/m);
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
      overview: await mdToHtml(overview),
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
        <div className="max-w-4xl mx-auto px-6 py-10">
          <DocsClient title={title} sections={sections} buyerPanels={buyerPanels} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

