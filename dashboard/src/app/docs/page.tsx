import { FileText, BookOpen, Code, FileCode, Zap, Shield, GitBranch } from "lucide-react"
import Link from "next/link"
import { getAllDocs, getDocBySlug } from "@/lib/docs"

export const metadata = {
  title: "Documentation - Consulate",
  description: "Complete documentation for Consulate's agentic dispute arbitration platform",
}

export default async function DocsPage() {
  const allDocs = getAllDocs();
  const readmeDoc = await getDocBySlug(['README']);
  
  // Filter out README from docs list (it's displayed separately as main content)
  const docsWithoutReadme = allDocs.filter(doc => doc.slug.join('/') !== 'README');
  
  // Group docs by category from metadata
  const categorizeDoc = (doc: typeof allDocs[0]) => {
    const category = (doc.metadata.category as string) || 'Other';
    return category;
  };
  
  const categories = docsWithoutReadme.reduce((acc, doc) => {
    const category = categorizeDoc(doc);
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof allDocs>);

  // Sort docs within each category by order metadata
  Object.keys(categories).forEach(cat => {
    categories[cat].sort((a, b) => {
      const orderA = (a.metadata.order as number) || 999;
      const orderB = (b.metadata.order as number) || 999;
      return orderA - orderB;
    });
  });

  return (
    <div>
      {/* README Content */}
      {readmeDoc && (
        <div className="mb-12">
          <div
            className="prose prose-slate max-w-none
              prose-headings:font-bold prose-headings:text-slate-900
              prose-h1:text-4xl prose-h1:mb-6
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-slate-700 prose-p:leading-7 prose-p:mb-4
              prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
              prose-li:text-slate-700 prose-li:my-2"
            dangerouslySetInnerHTML={{ __html: readmeDoc.htmlContent || '' }}
          />
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex gap-4 mb-12">
        <Link 
          href="/docs/AGENT_INTEGRATION_GUIDE"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Zap className="h-5 w-5 mr-2" />
          Quick Start
        </Link>
        <Link 
          href="/docs/api/endpoints"
          className="inline-flex items-center px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Code className="h-5 w-5 mr-2" />
          API Reference
        </Link>
      </div>

      {/* Quick Links Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link 
          href="/docs/AGENT_INTEGRATION_GUIDE"
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition-all border border-blue-200 group"
        >
          <div className="p-3 bg-blue-600 rounded-lg w-fit mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Get Started</h2>
          <p className="text-slate-600">
            Quick start guide to integrate your first agent in minutes
          </p>
        </Link>

        <Link 
          href="/docs/api/endpoints"
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 hover:shadow-lg transition-all border border-emerald-200 group"
        >
          <div className="p-3 bg-emerald-600 rounded-lg w-fit mb-4">
            <Code className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">API Reference</h2>
          <p className="text-slate-600">
            Complete HTTP API documentation with authentication & examples
          </p>
        </Link>

        <Link 
          href="/docs/dispute-types"
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 hover:shadow-lg transition-all border border-purple-200 group"
        >
          <div className="p-3 bg-purple-600 rounded-lg w-fit mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dispute Types</h2>
          <p className="text-slate-600">
            Learn what types of disputes Consulate can resolve
          </p>
        </Link>
      </div>

      {/* Documentation Categories */}
      <div className="space-y-10">
        {/* Integration Guides */}
        {categories['Integration'] && categories['Integration'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Integration Guides</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories['Integration'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-5 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Core Concepts */}
        {categories['Core Concepts'] && categories['Core Concepts'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Core Concepts</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories['Core Concepts'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-5 border border-slate-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        {categories['API'] && categories['API'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileCode className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">API Documentation</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories['API'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-5 border border-slate-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Resources */}
      <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Resources</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link 
            href="/rules"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
          >
            <FileText className="h-5 w-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">Arbitration Rules</div>
              <div className="text-sm text-slate-600">Published standards</div>
            </div>
          </Link>
          <a 
            href="https://github.com/consulatehq/consulate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
          >
            <Code className="h-5 w-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-900">GitHub Repository</div>
              <div className="text-sm text-slate-600">Source code & examples</div>
            </div>
          </a>
        </div>
      </div>

      {/* Support Section */}
      <div className="mt-12 text-center p-8 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-3">Need Help?</h3>
        <p className="text-slate-600 mb-4">
          Can&apos;t find what you&apos;re looking for? Reach out to our team.
        </p>
        <a 
          href="mailto:vivek@consulatehq.com"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}

