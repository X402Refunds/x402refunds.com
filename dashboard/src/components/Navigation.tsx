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
  currentPage?: 'home' | 'pricing' | 'about'
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

  return (
    <nav className="border-b border-emerald-200 bg-gradient-to-r from-white via-emerald-50/30 to-white backdrop-blur-sm sticky top-0 z-50 shadow-lg relative">
      {/* Emerald accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-lg sm:text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg px-2 py-1"
              >
                Consulate
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-2">
              <button
                onClick={() => handleNavigation('/pricing')}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentPage === 'pricing' 
                    ? 'text-primary bg-accent' 
                    : 'text-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                Pricing
              </button>
              <button
                onClick={() => handleNavigation('/about')}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentPage === 'about' 
                    ? 'text-primary bg-accent' 
                    : 'text-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                About
              </button>
              <button
                onClick={() => handleNavigation('https://docs.consulatehq.com', true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                Docs
              </button>
              <button
                onClick={() => handleNavigation('https://github.com/consulatehq/agentic-dispute-protocol', true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap"
              >
                Agentic Dispute Protocol
              </button>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Go to Dashboard Button - Desktop (when signed in) */}
            {isSignedIn && (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="hidden md:flex"
                size="sm"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            )}
            {/* Sign In Button - Desktop */}
            {!isSignedIn && (
              <Button
                onClick={() => window.location.href = '/sign-in'}
                className="hidden md:flex"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
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
                      className="w-full justify-start"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  )}
                  {/* Sign In - Mobile */}
                  {!isSignedIn && (
                    <Button
                      onClick={() => handleNavigation('/sign-in')}
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  )}

                  <div className="border-t border-border pt-4 space-y-3">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/pricing')}
                        className={cn(
                          "w-full justify-start",
                          currentPage === 'pricing' && 'bg-accent text-primary'
                        )}
                      >
                        Pricing
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('/about')}
                        className={cn(
                          "w-full justify-start",
                          currentPage === 'about' && 'bg-accent text-primary'
                        )}
                      >
                        About
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('https://docs.consulatehq.com', true)}
                        className="w-full justify-start"
                      >
                        Documentation
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation('https://github.com/consulatehq/agentic-dispute-protocol', true)}
                        className="w-full justify-start text-sm"
                      >
                        Agentic Dispute Protocol
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

