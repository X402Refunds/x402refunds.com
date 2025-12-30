"use client"

import { useState } from "react"
import { User, Menu, LayoutDashboard } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface NavigationProps {
  currentPage?: 'home' | 'pricing' | 'about' | 'registry'
}

export function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()

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
                x402Disputes
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
              <button
                onClick={() => handleAnchor("#how-it-works")}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentPage === "home"
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                How it works
              </button>
              <button
                onClick={() => handleAnchor("#api")}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentPage === "home"
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                API
              </button>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Go to Dashboard Button - Desktop (when signed in) */}
            {isSignedIn && (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Open dashboard
              </Button>
            )}
            {/* Sign In Button - Desktop */}
            {!isSignedIn && (
              <Button
                onClick={() => window.location.href = '/sign-in'}
                className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Get ready to receive disputes
              </Button>
            )}

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
                  {/* Go to Dashboard - Mobile (when signed in) */}
                  {isSignedIn && (
                    <Button
                      onClick={() => handleNavigation('/dashboard')}
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Open dashboard
                    </Button>
                  )}
                  {/* Sign In - Mobile */}
                  {!isSignedIn && (
                    <Button
                      onClick={() => handleNavigation('/sign-in')}
                      className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Get ready to receive disputes
                    </Button>
                  )}

                  <div className="border-t border-border pt-4 space-y-3">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleAnchor("#how-it-works")}
                        className={cn(
                          "w-full justify-start",
                          currentPage === 'home' && 'bg-blue-50 text-blue-700'
                        )}
                      >
                        How it works
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAnchor("#api")}
                        className={cn(
                          "w-full justify-start",
                          currentPage === 'home' && 'bg-blue-50 text-blue-700'
                        )}
                      >
                        API
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

