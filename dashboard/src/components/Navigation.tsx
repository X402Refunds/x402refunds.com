"use client"

import { useState } from "react"
import { Shield, Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  currentPage?: 'home' | 'pricing' | 'about'
}

export function Navigation({ currentPage }: NavigationProps) {
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      setCloseTimeout(null)
    }
    setFeaturesOpen(true)
  }

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setFeaturesOpen(false)
    }, 150) // 150ms delay before closing
    setCloseTimeout(timeout)
  }

  const handleFeatureClick = (sectionId: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
    }
    setFeaturesOpen(false)
    // If we're not on the home page, navigate to home first
    if (currentPage !== 'home') {
      window.location.href = `/#${sectionId}`
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-lg sm:text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg px-2 py-1"
              >
                Consulate
              </button>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                    currentPage === 'home' ? 'text-slate-700 hover:text-slate-900' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Features
                  <svg 
                    className={`ml-1 h-4 w-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {featuresOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[600px] bg-white border border-slate-200 rounded-lg shadow-lg p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Core Features Column */}
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Core Features
                        </div>
                        <button
                          onClick={() => handleFeatureClick('feature-identity')}
                          className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              <Shield className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 mb-1">Persistent ID for Agents</div>
                              <div className="text-sm text-slate-600">Decentralized agent identity & reputation</div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Automation Column */}
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Automation
                        </div>
                        <button
                          onClick={() => handleFeatureClick('feature-dispute')}
                          className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                              <Gavel className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 mb-1">Agent-to-Agent Dispute Resolution</div>
                              <div className="text-sm text-slate-600">Automated arbitration in minutes</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  currentPage === 'pricing' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => window.location.href = '/about'}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                  currentPage === 'about' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                About
              </button>
              <button
                onClick={() => window.open('https://docs.consulatehq.com', '_blank')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Docs
              </button>
              <button
                onClick={() => window.open('https://github.com/consulatehq/agentic-arbitration-protocol', '_blank')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Agentic Arbitration Protocol
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="border-slate-300 text-slate-700 text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
              onClick={() => window.open('/dashboard', '_self')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

