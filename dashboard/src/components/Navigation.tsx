"use client"

import { useState } from "react"
import { Shield, Gavel, User, Menu } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
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

  const handleFeatureClick = (sectionId: string) => {
    setMobileMenuOpen(false)
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
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium">
                      Features
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[600px] p-6 bg-gradient-to-br from-white to-emerald-50/20 border-2 border-emerald-200 shadow-2xl rounded-lg">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Core Features Column */}
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                              Core Features
                            </div>
                            <button
                              onClick={() => handleFeatureClick('feature-identity')}
                              className="w-full text-left p-3 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                  <Shield className="h-5 w-5 text-emerald-600" />
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
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                              Automation
                            </div>
                            <button
                              onClick={() => handleFeatureClick('feature-dispute')}
                              className="w-full text-left p-3 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all group"
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
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

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
            {/* Sign In Button - Desktop */}
            <Button
              onClick={() => window.location.href = isSignedIn ? '/dashboard' : '/sign-in'}
              className="hidden md:flex"
              size="sm"
            >
              <User className="h-4 w-4 mr-2" />
              {isSignedIn ? 'Dashboard' : 'Sign In'}
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
                  {/* Sign In - Mobile */}
                  <Button
                    onClick={() => handleNavigation(isSignedIn ? '/dashboard' : '/sign-in')}
                    className="w-full justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isSignedIn ? 'Dashboard' : 'Sign In'}
                  </Button>

                  <div className="border-t border-border pt-4 space-y-3">
                    {/* Features Section */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Features
                      </div>
                      <button
                        onClick={() => handleFeatureClick('feature-identity')}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-accent rounded-lg">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">Persistent ID for Agents</div>
                            <div className="text-xs text-muted-foreground">Decentralized agent identity</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleFeatureClick('feature-dispute')}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-accent rounded-lg">
                            <Gavel className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">Dispute Resolution</div>
                            <div className="text-xs text-muted-foreground">Automated arbitration</div>
                          </div>
                        </div>
                      </button>
                    </div>

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

