import { remark } from "remark";
import remarkHtml from "remark-html";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/layout";
import { DocsClient } from "./DocsClient";
import { readRefundRequestsMarkdown, splitBuyerPanels, splitDocsMarkdown } from "./docsMarkdown";

export const metadata = {
  title: "Docs - x402Disputes",
  description: "Simple documentation for x402Disputes (post-transaction disputes + refunds).",
};

async function mdToHtml(md: string) {
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return processed.toString();
}

async function getDocsSections() {
  const md = await readRefundRequestsMarkdown();

  const { title, merchants, buyers } = splitDocsMarkdown(md);

  const stripSuffix = (s: string) => s.replace(/\s*\(Developer Docs\)\s*$/i, "").trim();

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

