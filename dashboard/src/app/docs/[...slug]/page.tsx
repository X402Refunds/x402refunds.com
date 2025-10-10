import { notFound } from 'next/navigation';
import { getDocBySlug, getAllDocPaths, formatSlugTitle } from '@/lib/docs';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const paths = getAllDocPaths();
  return paths.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  
  if (!doc) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${doc.metadata.title} - Consulate Docs`,
    description: doc.metadata.description || `Documentation for ${doc.metadata.title}`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
        <Link href="/docs" className="hover:text-blue-600">
          Docs
        </Link>
        {slug.map((part, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            {index === slug.length - 1 ? (
              <span className="text-slate-900 font-medium">
                {formatSlugTitle(part)}
              </span>
            ) : (
              <Link
                href={`/docs/${slug.slice(0, index + 1).join('/')}`}
                className="hover:text-blue-600"
              >
                {formatSlugTitle(part)}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Page Title */}
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        {doc.metadata.title}
      </h1>

      {doc.metadata.description && (
        <p className="text-xl text-slate-600 mb-8">
          {doc.metadata.description}
        </p>
      )}

      {/* Markdown Content */}
      <div
        className="prose prose-slate max-w-none
          prose-headings:font-bold prose-headings:text-slate-900
          prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-slate-700 prose-p:leading-7
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-slate-900 prose-pre:text-slate-50
          prose-ul:list-disc prose-ol:list-decimal
          prose-li:text-slate-700
          prose-strong:text-slate-900 prose-strong:font-semibold
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4"
        dangerouslySetInnerHTML={{ __html: doc.htmlContent || '' }}
      />

      {/* Edit on GitHub Link */}
      <div className="mt-12 pt-8 border-t border-slate-200">
        <a
          href={`https://github.com/consulatehq/consulate/edit/main/docs/${slug.join('/')}.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-600 hover:text-blue-600 inline-flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Edit this page on GitHub
        </a>
      </div>
    </div>
  );
}

