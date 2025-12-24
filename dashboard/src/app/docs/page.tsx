import fs from "fs/promises";
import path from "path";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Docs - x402Disputes",
  description: "Simple documentation for x402Disputes (pre-transaction vs post-transaction disputes).",
};

async function getDocsHtml() {
  // Next.js app runs with cwd at `dashboard/`, so go up one directory.
  const markdownPath = path.join(process.cwd(), "..", "docs", "disputes.md");
  const md = await fs.readFile(markdownPath, "utf8");
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(md);
  return processed.toString();
}

export default async function DocsPage() {
  const html = await getDocsHtml();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <article
            className="prose max-w-none
              prose-headings:text-foreground prose-headings:font-semibold
              prose-p:text-muted-foreground
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

