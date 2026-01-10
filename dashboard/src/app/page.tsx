"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { CopyButton } from "@/components/ui/copy-button"
import {
  ChevronRight,
  Mail,
  ShieldCheck,
  BadgeCheck,
  Search,
  Zap,
  Sparkles,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="relative border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-300/30 blur-3xl" />
              </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white px-7 py-14 sm:px-14 sm:py-20 shadow-[0_25px_80px_-35px_rgba(37,99,235,0.35)]">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-semibold tracking-tight leading-[1.0] text-slate-950">
                Turn on refunds
                <span className="mt-4 block text-[0.9em] font-semibold text-blue-600">
                  for AI payments.
                </span>
              </h1>
              
              <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl">
                Add one file. Refund requests land in your email.
              </p>

              <div className="mt-6 text-sm sm:text-base text-slate-600">
                Email-first · One-click approve/deny/partial · Shareable proof
              </div>

                <Button
                  size="lg"
                className="mt-9 h-14 px-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg shadow-lg shadow-blue-600/25"
                  onClick={() => {
                    const el = document.getElementById("enable")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                Get started →
                </Button>

              <p className="mt-6 text-xs text-slate-500">
                Built for x402 payments. Works with HTTP + MCP.
              </p>
              </div>
          </div>
        </div>
      </section>

      {/* ENABLE DISPUTES (PLUG AND PLAY) */}
      <section id="enable" className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Takes 10 seconds.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Then you’re live.
            </p>
          </div>

          {(() => {
            const merchant = "eip155:8453:0xYOUR_WALLET_HERE"
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
              <div className="mt-12 max-w-7xl mx-auto grid items-start gap-10 lg:grid-cols-2">
                {/* Step 1 (primary) */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      Create{" "}
                      <span className="font-mono rounded bg-muted px-1.5 py-0.5">
                        https://YOUR_DOMAIN/.well-known/x402.json
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Copy/paste this file, and replace{" "}
                      <span className="font-mono rounded bg-muted px-1.5 py-0.5">
                        supportEmail
                      </span>{" "}
                      +{" "}
                      <span className="font-mono rounded bg-muted px-1.5 py-0.5">
                        0xYOUR_WALLET_HERE
                      </span>
                      .
                    </div>
                  </div>

                  <CodeBlock
                    language="json"
                    code={wellKnown}
                    copyLabel="Copied /.well-known/x402.json"
                    header="caption"
                    title="/.well-known/x402.json"
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
                        one‑click refunds · discoverability
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

      {/* WHAT YOU GET */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
              What you get
            </h2>
            <p className="mt-3 text-slate-600">
              A lightweight refund-requests inbox for paid APIs—without building a dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">Email-first</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Refund requests land in your email. No account required.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">One-click decisions</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Approve, deny, or partial refund from the email link.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">Shareable proof</div>
                  <div className="mt-1 text-sm text-slate-600">
                    A public status page for “was it refunded?” checks.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">On-chain verification</div>
                  <div className="mt-1 text-sm text-slate-600">
                    We verify the USDC payment on-chain (Base/Solana supported).
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">Discoverability (optional)</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Add one Link header so agent clients can auto-discover refunds support.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">Automated refunds (optional)</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Top up credits so approved requests can refund automatically.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
              onClick={() => (window.location.href = "/docs")}
            >
              View docs →
            </Button>
            </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

