import { readFileSync } from 'fs';
import { join } from 'path';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import 'highlight.js/styles/github.css';

const RULES_FILE = join(process.cwd(), '..', 'docs', 'standards', 'consulate-arbitration-rules-v1.0.md');

// Parse metadata from markdown
function parseMetadata(content: string) {
  const lines = content.split('\n');
  const metadata: Record<string, string> = {};
  
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        metadata[match[1]] = match[2].replace(/`/g, '').trim();
      }
    }
    if (line.startsWith('## ')) break;
  }
  
  return metadata;
}

export const metadata: Metadata = {
  title: 'Consulate Arbitration Rules v1.0 | Official Legal Framework',
  description: 'Official procedural rules for AI agent dispute resolution through Consulate. Transparent, neutral, and legally binding arbitration framework.',
  openGraph: {
    title: 'Consulate Arbitration Rules v1.0',
    description: 'Procedural rules for AI agent dispute resolution',
    type: 'article',
  },
};

export default function ArbitrationRulesPage() {
  const content = readFileSync(RULES_FILE, 'utf-8');
  const metadata = parseMetadata(content);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold">Consulate Arbitration Rules</h1>
              <p className="text-muted-foreground mt-1">Version {metadata.Version || '1.0'}</p>
            </div>
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Effective Date</div>
              <div className="font-medium">{metadata['Effective Date']}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Metadata Badge */}
      <div className="bg-muted border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">License</div>
              <div className="font-mono text-xs">{metadata.License}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Protocol Hash</div>
              <div className="font-mono text-xs truncate" title={metadata['Protocol Hash']}>
                {metadata['Protocol Hash']}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Timestamp</div>
              <div className="font-mono text-xs">{metadata.Timestamp || 'See document header'}</div>
            </div>
          </div>
          {metadata['RFC 3161 Proof'] && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Cryptographic Proof:</span>
                <Link 
                  href="/api/standards/arbitration-rules/v1.0?format=markdown" 
                  className="text-xs text-primary hover:underline"
                  download
                >
                  Download Markdown
                </Link>
                <span className="text-muted-foreground">•</span>
                <a 
                  href={`https://github.com/consulateinc/consulate/blob/main/docs/standards/.timestamps/consulate-arbitration-rules-v1.0.tsr`}
                  className="text-xs text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View RFC 3161 Timestamp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Style headings
              h1: ({ children }) => (
                <h1 className="text-4xl font-bold mt-8 mb-4 pb-2 border-b">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-3xl font-semibold mt-8 mb-4" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-2xl font-semibold mt-6 mb-3" id={String(children).toLowerCase().replace(/\s+/g, '-')}>
                  {children}
                </h3>
              ),
              // Style tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-border">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-sm font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm">{children}</td>
              ),
              // Style code blocks
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                
                if (isInline) {
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
                
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 border">
                  {children}
                </pre>
              ),
              // Style lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 my-4">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="ml-4">{children}</li>
              ),
              // Style blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              // Style links
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  className="text-primary hover:underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground mb-2">Consulate, Inc.</p>
              <p>Published under {metadata.License}</p>
              <p className="mt-1">
                Canonical URL: <a href={metadata['Canonical URL']} className="text-primary hover:underline">{metadata['Canonical URL']}</a>
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground mb-2">Contact</p>
              <p>Standards Committee: <a href="mailto:standards@consulatehq.com" className="text-primary hover:underline">standards@consulatehq.com</a></p>
              <p>Legal Inquiries: <a href="mailto:legal@consulatehq.com" className="text-primary hover:underline">legal@consulatehq.com</a></p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-xs text-center">
            <p>
              This document is cryptographically timestamped and immutable. 
              Hash: <span className="font-mono">{metadata['Protocol Hash']?.substring(0, 16)}...</span>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

