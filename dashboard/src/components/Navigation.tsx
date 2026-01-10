"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface NavigationProps {
  currentPage?: 'home' | 'pricing' | 'about' | 'registry'
}

export function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHome = currentPage === "home"

  const handleNavigation = (href: string, external = false) => {
    setMobileMenuOpen(false)
    if (external) {
      window.open(href, '_blank')
    } else {
      window.location.href = href
    }
  }

  const handleAnchor = (hash: string) => {
    setMobileMenuOpen(false)

    // If we aren't on the homepage, route to it first so anchors exist.
    if (window.location.pathname !== "/") {
      window.location.href = `/${hash}`
      return
    }

    const el = document.getElementById(hash.replace("#", ""))
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="border-b border-slate-200 bg-white backdrop-blur-sm sticky top-0 z-50 shadow-sm relative">
      {/* Blue accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600/40 via-blue-600 to-blue-600/40" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-lg sm:text-2xl font-bold text-slate-950 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-lg px-2 py-1"
              >
                <span className="inline-flex items-center">
                  <span className="tracking-tight">X402</span>
                  <span
                    aria-hidden
                    className="mx-2 h-5 w-px bg-slate-300 sm:h-6"
                  />
                  <span className="font-semibold tracking-tight">Refunds</span>
                </span>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
              <button
                onClick={() => handleNavigation("/check-balance")}
                className={[
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isHome
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                Check Balance
              </button>
              <button
                onClick={() => handleNavigation("/docs")}
                className={[
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isHome
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                Docs
              </button>
              <button
                onClick={() => handleNavigation("/disputes")}
                className={[
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isHome
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                Check Your Disputes
              </button>
              <button
                onClick={() => handleNavigation("/file-dispute")}
                className={[
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isHome
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                File a Dispute
              </button>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Desktop quick actions */}
            <Button
              onClick={() => handleNavigation("/topup")}
              variant="outline"
              className="hidden md:flex"
              size="sm"
            >
              Top up
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold text-foreground">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <Button
                    onClick={() => handleAnchor("#enable")}
                    className="w-full justify-start"
                    variant="default"
                  >
                    Get started
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/topup")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Top up credits
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/check-balance")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Check Balance
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/docs")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Docs
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/disputes")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Check Your Disputes
                  </Button>

                  <Button
                    onClick={() => handleNavigation("/file-dispute")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    File a Dispute
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

