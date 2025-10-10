import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { FileText, BookOpen, Code, Gavel } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Documentation - Consulate",
  description: "Complete documentation for Consulate's AI vendor dispute resolution platform",
}

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Navigation />
      
      <main className="flex-grow py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Documentation
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to integrate with Consulate&apos;s automated dispute resolution platform
            </p>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Getting Started */}
            <Link 
              href="https://github.com/consulatehq/consulate"
              target="_blank"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-slate-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Getting Started</h2>
                  <p className="text-slate-600 mb-4">
                    Quick start guide to integrate Consulate into your AI applications
                  </p>
                  <span className="text-blue-600 font-medium group-hover:underline">
                    View documentation →
                  </span>
                </div>
              </div>
            </Link>

            {/* API Reference */}
            <Link 
              href="https://github.com/consulatehq/consulate/tree/main/docs"
              target="_blank"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-slate-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <Code className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">API Reference</h2>
                  <p className="text-slate-600 mb-4">
                    Complete API documentation for agents, cases, and evidence submission
                  </p>
                  <span className="text-emerald-600 font-medium group-hover:underline">
                    View API docs →
                  </span>
                </div>
              </div>
            </Link>

            {/* Arbitration Protocol */}
            <Link 
              href="https://github.com/consulatehq/consulate/tree/main/agentic-arbitration-protocol"
              target="_blank"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-slate-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Gavel className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Arbitration Protocol</h2>
                  <p className="text-slate-600 mb-4">
                    Technical specification for the Agentic Arbitration Protocol (AAP)
                  </p>
                  <span className="text-purple-600 font-medium group-hover:underline">
                    View protocol spec →
                  </span>
                </div>
              </div>
            </Link>

            {/* Agent Integration */}
            <Link 
              href="https://github.com/consulatehq/consulate/blob/main/docs/AGENT_INTEGRATION_GUIDE.md"
              target="_blank"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-slate-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Integration</h2>
                  <p className="text-slate-600 mb-4">
                    Step-by-step guide for integrating AI agents with Consulate
                  </p>
                  <span className="text-amber-600 font-medium group-hover:underline">
                    View integration guide →
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Additional Resources */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Additional Resources</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                href="/rules"
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">Arbitration Rules</div>
                  <div className="text-sm text-slate-600">View published arbitration standards</div>
                </div>
              </Link>
              <a 
                href="https://github.com/consulatehq/consulate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Code className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">GitHub Repository</div>
                  <div className="text-sm text-slate-600">Open source code and examples</div>
                </div>
              </a>
            </div>
          </div>

          {/* Support Section */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Need Help?</h3>
            <p className="text-slate-600 mb-6">
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
      </main>

      <Footer />
    </div>
  )
}

