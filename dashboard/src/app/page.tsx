"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { StatsBar } from "@/components/registry/StatsBar"
import { SearchBar } from "@/components/registry/SearchBar"
import { DisputeFeed } from "@/components/registry/DisputeFeed"
import { ReputationSidebar } from "@/components/registry/ReputationSidebar"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText } from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all")

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation currentPage="home" />

      {/* Minimal Hero - Just one line */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dispute Registry</h1>
              <p className="text-slate-300">Real-time dispute resolution for X-402 payments</p>
                  </div>
            <div className="hidden md:flex gap-3">
              <Button 
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.location.href = 'https://docs.x402disputes.com'}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                API Docs
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => window.location.href = '/sign-in'}
              >
                <FileText className="mr-2 h-4 w-4" />
                File Dispute
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Main Content: Live Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed - Takes up most space */}
          <div className="lg:col-span-8 space-y-4">
            <SearchBar 
              onSearchChange={setSearchQuery}
              onFilterChange={setFilter}
              currentFilter={filter}
            />
            <DisputeFeed 
              filter={filter}
              searchQuery={searchQuery}
            />
        </div>

          {/* Sidebar - Reputation Rankings */}
          <div className="lg:col-span-4">
            <ReputationSidebar />
          </div>
        </div>
      </main>

      {/* Minimal Bottom CTA */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to integrate X-402 dispute resolution?
          </h2>
          <p className="text-slate-600 mb-6">
            Permissionless dispute filing. On-chain reputation. Fair arbitration.
          </p>
          <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
              className="bg-emerald-600 hover:bg-emerald-500"
              onClick={() => window.location.href = 'https://docs.x402disputes.com'}
            >
              View Documentation
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/sign-in'}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
