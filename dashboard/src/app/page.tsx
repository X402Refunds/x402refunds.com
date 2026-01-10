"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { CopyButton } from "@/components/ui/copy-button"
import { ChevronRight, CreditCard } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-blue-800">
              <CreditCard className="h-3.5 w-3.5" />
              FOR PAID APIs
            </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950">
              Enable refund requests
                <br />
                <span className="text-blue-600">for x402 payments.</span>
              </h1>
              
            <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto">
              Add one file. Refund requests land in your email.
            </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 mx-auto w-fit text-left">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Get refund requests by email
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  One-click refund / deny / partial refund
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Shareable proof of refund
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
                  onClick={() => {
                    const el = document.getElementById("enable")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                Set up refund requests
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50 px-7 h-12"
                  onClick={() => (window.location.href = "/topup")}
                >
                  Top up credits
                </Button>
              </div>

              <p className="text-xs text-slate-500 pt-2">Built for x402 payments. Works with HTTP + MCP.</p>
          </div>
        </div>
      </section>

      {/* ENABLE DISPUTES (PLUG AND PLAY) */}
      <section id="enable" className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Takes 10 seconds.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Paste this template at `/.well-known/x402.json`, then replace `supportEmail` + your merchant wallet.
            </p>
          </div>

          {(() => {
            const merchant = "eip155:8453:0xYourMerchantWallet"
            const refundUrl = `https://api.x402refunds.com/v1/refunds?merchant=${merchant}`
            const linkHeader = `Link: <${refundUrl}>; rel=\"payment-refund\"; type=\"application/json\"`
            const wellKnownObj = {
              x402refunds: {
                supportEmail: "refunds@yourdomain.com",
                refundRequestUrl: refundUrl,
              },
            }
            const wellKnown = JSON.stringify(wellKnownObj, null, 2)

            return (
              <div className="mt-10 max-w-6xl mx-auto grid items-start gap-10 lg:grid-cols-2">
                {/* Step 1 (primary) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      Add{" "}
                      <span className="font-mono rounded bg-muted px-1.5 py-0.5">
                        /.well-known/x402.json
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Copy/paste this file at `/.well-known/x402.json`, replace `supportEmail` + your merchant wallet.
                    </div>
                  </div>

                  <CodeBlock
                    language="json"
                    code={wellKnown}
                    copyLabel="Copied /.well-known/x402.json"
                    header="none"
                    copyPlacement="overlay"
                    clickToCopy
                  />
                </div>

                {/* Step 2 (confirmation + optional) */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      You’ll get refund requests by email
                    </div>
                    <div className="text-sm text-muted-foreground">
                      We email <span className="font-mono">supportEmail</span> from that file. No signup required.
                    </div>
                  </div>

                  <details className="group optional-details">
                    <summary className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                      <span className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        Optional extras
                      </span>
                      <span className="text-xs text-muted-foreground">
                        discoverability · one‑click refunds
                      </span>
                    </summary>

                    <div className="mt-3 space-y-2 rounded-xl bg-muted/30 p-3">
                      {/* 1) One-click refunds first */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            Enable one‑click refunds
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Top up credits so approvals can refund automatically.
                          </div>
                        </div>
                  <a
                    href="/topup"
                          className="shrink-0 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                          Top up →
                  </a>
                      </div>

                      <div className="h-px bg-border/60" />

                      {/* 2) Discoverability second + show the actual header (truncated) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">
                              Let agents auto‑discover refund requests
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Add this <span className="font-mono">Link</span> header on paid responses.
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                          <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                            {linkHeader}
                          </code>
                          <div className="shrink-0">
                            <CopyButton value={linkHeader} label="Copied Link header" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* (Removed) WHAT YOU GET */}

      {/* FINAL CTA */}
      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-white">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Enable refund requests in minutes.</h2>
            <p className="mt-2 text-slate-300">Plug-and-play. No signup. Top up and add one header.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
                onClick={() => {
                  const el = document.getElementById("enable")
                  el?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
            >
                Enable refund requests
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 px-7 h-12"
                onClick={() => (window.location.href = "/topup")}
            >
                Top up refund credits
            </Button>
            </div>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

