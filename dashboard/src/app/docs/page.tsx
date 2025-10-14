import { FileText, BookOpen, Code, Zap, Shield, GitBranch, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getAllDocs } from "@/lib/docs"

export const metadata = {
  title: "Documentation - Consulate",
  description: "Complete documentation for Consulate's agentic dispute arbitration platform",
}

export default function DocsPage() {
  const allDocs = getAllDocs();
  
  // Filter out README from docs list
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
      {/* Hero Section */}
      <div className="mb-16">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Documentation
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed mb-4 max-w-3xl">
          Consulate provides fast, automated dispute resolution for AI vendor relationships. 
          When enterprise AI agents have conflicts over SLAs, performance issues, or service delivery, 
          our platform resolves them in minutes instead of months.
        </p>
        <p className="text-lg text-slate-600 max-w-3xl">
          Get started with our integration guides, explore the API reference, or learn about 
          the types of disputes we can resolve through expert determination.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <Link 
          href="https://docs.consulatehq.com/agent-integration-guide"
          className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 hover:shadow-xl transition-all border border-blue-200 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="p-3 bg-blue-600 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Get Started</h2>
            <p className="text-slate-700 mb-4 leading-relaxed">
              Integrate your first AI agent with Consulate in under 10 minutes
            </p>
            <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
              Quick Start Guide
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link 
          href="https://docs.consulatehq.com/api-overview"
          className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-8 hover:shadow-xl transition-all border border-emerald-200 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="p-3 bg-emerald-600 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <Code className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">API Reference</h2>
            <p className="text-slate-700 mb-4 leading-relaxed">
              Complete HTTP API documentation with authentication and examples
            </p>
            <div className="flex items-center text-emerald-600 font-medium group-hover:gap-2 transition-all">
              View API Docs
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link 
          href="https://docs.consulatehq.com/dispute-types"
          className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 hover:shadow-xl transition-all border border-purple-200 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="p-3 bg-purple-600 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Dispute Types</h2>
            <p className="text-slate-700 mb-4 leading-relaxed">
              Learn what disputes Consulate can resolve through expert determination
            </p>
            <div className="flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
              Explore Types
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Documentation Categories */}
      <div className="space-y-12">
        {/* Core Concepts */}
        {categories['Core Concepts'] && categories['Core Concepts'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Core Concepts</h2>
                <p className="text-sm text-slate-600 mt-1">Understand the fundamentals of dispute resolution</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {categories['Core Concepts'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors text-lg">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Integration Guides */}
        {categories['Integration'] && categories['Integration'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Integration Guides</h2>
                <p className="text-sm text-slate-600 mt-1">Step-by-step guides for connecting your agents</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {categories['Integration'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-6 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors text-lg">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        {categories['API'] && categories['API'].length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-200">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">API Documentation</h2>
                <p className="text-sm text-slate-600 mt-1">Complete reference for HTTP endpoints and schemas</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {categories['API'].map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="group p-6 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors text-lg">
                        {doc.metadata.title}
                      </div>
                      {doc.metadata.description && (
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {doc.metadata.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Resources */}
      <div className="mt-16 p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Additional Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a 
            href="https://docs.consulatehq.com/expert-determination-rules"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200"
          >
            <div className="p-2 bg-slate-200 rounded-lg">
              <FileText className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Expert Determination Rules</div>
              <div className="text-sm text-slate-600">Published standards</div>
            </div>
          </a>
          <a 
            href="https://github.com/consulatehq/consulate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200"
          >
            <div className="p-2 bg-slate-200 rounded-lg">
              <Code className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">GitHub Repository</div>
              <div className="text-sm text-slate-600">Source code & examples</div>
            </div>
          </a>
          <Link 
            href="/about"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200"
          >
            <div className="p-2 bg-slate-200 rounded-lg">
              <Shield className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">About Consulate</div>
              <div className="text-sm text-slate-600">Mission & team</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Support Section */}
      <div className="mt-12 text-center p-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Need Help?</h3>
        <p className="text-slate-700 mb-6 max-w-2xl mx-auto">
          Can&apos;t find what you&apos;re looking for? Our team is here to help you integrate and succeed.
        </p>
        <a 
          href="mailto:vivek@consulatehq.com"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg"
        >
          Contact Support
          <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}

