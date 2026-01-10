"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import Image from "next/image"

// NOTE: We use versioned filenames for landing screenshots to avoid CDN/optimizer caches
// holding onto older `/public` assets after swaps.
const ALL_DISPUTES_DESKTOP_SRC = "/landing/all-disputes-2025-12-31.png"
const ALL_DISPUTES_MOBILE_SRC = "/landing/all-disputes-mobile-2025-12-31.png"
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                X402Refunds
                <span className="mx-2 text-slate-300">•</span>
                Payment refund requests
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950">
                Issue refunds
                <br />
                <span className="text-blue-600">for x402 payments.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
                Few lines to enable refunds. No signup required.
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
                  Enable refunds
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

              <div>
              <ResponsiveLandingScreenshot
                desktopSrc={ALL_DISPUTES_DESKTOP_SRC}
                mobileSrc={ALL_DISPUTES_MOBILE_SRC}
                alt="All refund requests dashboard view"
                priority
              />
              <div className="mt-2 text-xs text-slate-500">Illustration (AI-generated)</div>
              </div>
          </div>
        </div>
      </section>

      {/* ENABLE DISPUTES (PLUG AND PLAY) */}
      <section id="enable" className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Few lines to enable refunds
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              No signup required.
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
              <div className="mt-10 max-w-6xl mx-auto grid items-start gap-8 lg:grid-cols-3">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      Step 1 — Publish{" "}
                      <span className="font-mono rounded bg-muted px-1.5 py-0.5">
                        /.well-known/x402.json
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Your refund policy + support email.
                    </div>
                  </div>

                  <CodeBlock
                    language="json"
                    title="/.well-known/x402.json"
                    code={wellKnown}
                    copyLabel="Copied /.well-known/x402.json"
                  />

                  <div className="text-xs text-muted-foreground">
                    Optional: return this <span className="font-mono">Link</span> header on every paid response for discoverability.
                  </div>

                  <CodeBlock
                    language="text"
                    title="Link header"
                    code={linkHeader}
                    copyLabel="Copied Link header"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      Step 2 — Get refund requests by email
                    </div>
                    <div className="text-sm text-muted-foreground">
                      When a refund request is filed, we email the{" "}
                      <span className="font-mono">supportEmail</span> from your{" "}
                      <span className="font-mono">/.well-known/x402.json</span>.
                    </div>
                  </div>

                  <div className="text-sm text-foreground">
                    You’ll receive refund requests at{" "}
                    <span className="font-mono">supportEmail</span>.
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      Step 3 — Top up refund credits{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Add USDC so approved requests can refund automatically.
                    </div>
                  </div>

                  <a
                    href="/topup"
                    className="inline-flex items-center text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Top up refund credits →
                  </a>
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

