"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { CopyButton } from "@/components/ui/copy-button"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

// NOTE: We use versioned filenames for landing screenshots to avoid CDN/optimizer caches
// holding onto older `/public` assets after swaps.
const INBOX_EMPTY_DESKTOP_SRC = "/landing/inbox-empty-2025-12-31.png"
const INBOX_EMPTY_MOBILE_SRC = "/landing/inbox-empty-mobile-2025-12-31.png"
const DISPUTE_STATUS_DESKTOP_SRC = "/landing/dispute-status-2025-12-31.png"
const DISPUTE_STATUS_MOBILE_SRC = "/landing/dispute-status-mobile-2025-12-31.png"

function LandingScreenshot({
  src,
  alt,
  aspect = "aspect-[16/10]",
  priority = false,
  className,
}: {
  src: string
  alt: string
  aspect?: string
  priority?: boolean
  className?: string
}) {
  return (
    <div className={`relative w-full ${aspect} rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className || ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-contain"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
    </div>
  )
}

function ResponsiveLandingScreenshot({
  desktopSrc,
  mobileSrc,
  alt,
  priority = false,
}: {
  desktopSrc: string
  mobileSrc: string
  alt: string
  priority?: boolean
}) {
  return (
    <>
      <LandingScreenshot
        src={desktopSrc}
        alt={alt}
        priority={priority}
        className="hidden lg:block"
      />
      <LandingScreenshot
        src={mobileSrc}
        alt={alt}
        priority={priority}
        className="lg:hidden"
      />
    </>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold tracking-[0.18em] text-blue-800">
              FOR MERCHANTS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950">
              Enable refund requests
              <br />
              <span className="text-blue-600">for x402 payments.</span>
            </h1>
              
            <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
              Paste a template. Set your support email + merchant wallet. Get refund requests by email.
            </p>

            <ul className="space-y-2 text-sm sm:text-base text-slate-700">
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

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
              Enable refund requests in one file
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
                      Copy/paste this file. Refund requests will start arriving by email.
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
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            Copy Link header
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Add to paid responses for agent auto‑discovery.
                          </div>
                        </div>
                        <div className="shrink-0">
                          <CopyButton value={linkHeader} label="Copied Link header" />
                        </div>
                      </div>

                      <div className="h-px bg-border/60" />

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
                    </div>
                  </details>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-950">Inbox</h3>
              <p className="text-slate-600">Your place to review refund requests. Calm when there’s nothing to do.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- “All caught up” when empty</li>
                <li>- One click to jump into review</li>
              </ul>
        </div>
            <ResponsiveLandingScreenshot
              desktopSrc={INBOX_EMPTY_DESKTOP_SRC}
              mobileSrc={INBOX_EMPTY_MOBILE_SRC}
              alt="Inbox empty state"
            />
            <div className="mt-2 text-xs text-slate-500">Illustration (AI-generated)</div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <ResponsiveLandingScreenshot
              desktopSrc={DISPUTE_STATUS_DESKTOP_SRC}
              mobileSrc={DISPUTE_STATUS_MOBILE_SRC}
              alt="Refund request detail showing refund status"
            />
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-950">Refund status</h3>
              <p className="text-slate-600">See what happened and confirm the refund was sent.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- Status: executed / scheduled / failed</li>
                <li>- View on explorer</li>
              </ul>
              <div className="pt-1 text-xs text-slate-500">Illustration (AI-generated)</div>
            </div>
          </div>
        </div>
      </section>

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

