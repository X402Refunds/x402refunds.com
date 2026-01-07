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
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeMerchantToCaip10Base } from "@/lib/caip10"

interface NavigationProps {
  currentPage?: 'home' | 'pricing' | 'about' | 'registry'
}

export function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checkWallet, setCheckWallet] = useState("")
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [balanceMicrousdc, setBalanceMicrousdc] = useState<number | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)

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

  const checkWalletNormalized = normalizeMerchantToCaip10Base(checkWallet)
  const checkMerchant = checkWalletNormalized.caip10

  const runBalanceCheck = async () => {
    try {
      setBalanceError(null)
      setBalanceMicrousdc(null)
      setBalanceStatus("loading")
      if (!checkMerchant) throw new Error(checkWalletNormalized.error || "Enter a wallet address")
      const res = await fetch(
        `https://api.x402disputes.com/v1/merchant/balance?merchant=${encodeURIComponent(checkMerchant)}`,
        { method: "GET" },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error(data?.message || `Failed to fetch balance (${res.status})`)
      const micros = Number(data.availableMicrousdc ?? 0)
      setBalanceMicrousdc(Number.isFinite(micros) ? micros : 0)
      setBalanceStatus("success")
    } catch (e: unknown) {
      setBalanceStatus("error")
      setBalanceError(e instanceof Error ? e.message : String(e))
    }
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
                onClick={() => handleNavigation("/topup")}
                className={cn(
                  "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  currentPage === "home"
                    ? "text-slate-900 hover:bg-slate-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                Top up
              </button>

              <Dialog open={checkOpen} onOpenChange={setCheckOpen}>
                <DialogTrigger asChild>
                  <button
                    onClick={() => setCheckOpen(true)}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      currentPage === "home"
                        ? "text-slate-900 hover:bg-slate-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    Check
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Check your status</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="check-wallet">Merchant wallet</Label>
                      <Input
                        id="check-wallet"
                        placeholder="0x… or eip155:8453:0x…"
                        value={checkWallet}
                        onChange={(e) => {
                          setCheckWallet(e.target.value)
                          setBalanceStatus("idle")
                          setBalanceMicrousdc(null)
                          setBalanceError(null)
                        }}
                      />
                      {checkWallet.trim() && checkWalletNormalized.error && (
                        <div className="text-xs text-destructive">{checkWalletNormalized.error}</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        disabled={!checkMerchant || balanceStatus === "loading"}
                        onClick={runBalanceCheck}
                      >
                        {balanceStatus === "loading" ? "Checking refund credits…" : "Check refund credits"}
                      </Button>

                      {balanceStatus === "success" && typeof balanceMicrousdc === "number" && (
                        <div className="text-sm text-muted-foreground">
                          Available:{" "}
                          <code className="font-mono">{(balanceMicrousdc / 1_000_000).toFixed(6)} USDC</code>
                        </div>
                      )}
                      {balanceStatus === "error" && balanceError && (
                        <div className="text-sm text-destructive">{balanceError}</div>
                      )}

                      <Button
                        disabled={!checkMerchant}
                        onClick={() => window.location.href = `/party/${encodeURIComponent(checkMerchant || "")}`}
                      >
                        View disputes for this wallet
                      </Button>

                      <Button
                        variant="outline"
                        disabled={!checkMerchant}
                        onClick={() => window.location.href = `/topup?merchant=${encodeURIComponent(checkMerchant || "")}`}
                      >
                        Top up refund credits
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Primary CTA - Desktop */}
            <Button
              onClick={() => handleAnchor("#enable")}
              className="hidden md:flex"
              size="sm"
            >
              Enable disputes
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
                    onClick={() => handleNavigation("/topup")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Top up
                  </Button>

                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setCheckOpen(true)
                    }}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    Check refund credits / disputes
                  </Button>

                  <div className="border-t border-border pt-4 space-y-3">
                    {/* Main Navigation */}
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleAnchor("#enable")}
                        className={cn(
                          "w-full justify-start",
                          currentPage === 'home' && 'bg-blue-50 text-blue-700'
                        )}
                      >
                        Enable disputes
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

