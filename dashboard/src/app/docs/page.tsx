import { Metadata } from "next";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/layout";
import { DocsClient } from "./DocsClient";
import { readRefundRequestsMarkdown, splitBuyerPanels, splitDocsMarkdown } from "./docsMarkdown";

export const metadata: Metadata = {
  title: "X402 Refund Process Documentation | X402Refunds",
  description: "Complete guide to requesting x402 payment refunds. Learn how to file refund requests via API or web form. Includes JSON Schema, code examples, and step-by-step instructions for Base and Solana USDC payments.",
  keywords: [
    "x402 refund process",
    "how to request x402 refund",
    "x402 payment refund",
    "file x402 refund request",
    "x402 refund API",
    "x402 refund schema",
    "USDC refund request",
    "Base USDC refund",
    "Solana USDC refund",
    "x402 payment documentation",
    "AI payment refunds"
  ],
  openGraph: {
    title: "X402 Refund Process - Complete Documentation",
    description: "Step-by-step guide to filing x402 payment refund requests. API schema, examples, and best practices.",
    url: "https://x402refunds.com/docs",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "X402 Refund Process Documentation",
    description: "Complete guide to requesting x402 payment refunds via API or web form.",
  },
  alternates: {
    canonical: "https://x402refunds.com/docs",
  },
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

