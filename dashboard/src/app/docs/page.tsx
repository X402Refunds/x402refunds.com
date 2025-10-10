import { FileText, BookOpen, Code, FileCode } from "lucide-react"
import Link from "next/link"
import { getAllDocs } from "@/lib/docs"

export const metadata = {
  title: "Documentation - Consulate",
  description: "Complete documentation for Consulate's AI vendor dispute resolution platform",
}

export default function DocsPage() {
  const allDocs = getAllDocs();
  
  // Group docs by category
  const categories = {
    api: allDocs.filter(doc => doc.slug[0] === 'api'),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Documentation
        </h1>
        <p className="text-xl text-slate-600">
          Everything you need to integrate with Consulate&apos;s automated dispute resolution platform
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Link 
          href="/docs/api/endpoints"
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 hover:shadow-lg transition-shadow border border-blue-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">API Reference</h2>
              <p className="text-slate-600">
                Complete HTTP API documentation with examples
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/docs/AGENT_INTEGRATION_GUIDE"
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 hover:shadow-lg transition-shadow border border-emerald-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Integration Guide</h2>
              <p className="text-slate-600">
                Step-by-step guide for integrating AI agents
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Documentation Categories */}
      <div className="space-y-8">
        {/* API Documentation */}
        {categories.api.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FileCode className="h-5 w-5 text-slate-600" />
              <h2 className="text-2xl font-bold text-slate-900">API Documentation</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {categories.api.map(doc => (
                <Link
                  key={doc.slug.join('/')}
                  href={`/docs/${doc.slug.join('/')}`}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-slate-900 mb-1">{doc.metadata.title}</div>
                  {doc.metadata.description && (
                    <div className="text-sm text-slate-600">{doc.metadata.description}</div>
                  )}
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

