"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { CopyButton } from "@/components/ui/copy-button"

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
        aspect="aspect-[16/10]"
        className="hidden lg:block"
      />
      <LandingScreenshot
        src={mobileSrc}
        alt={alt}
        priority={priority}
        aspect="aspect-[9/16]"
        className="lg:hidden"
      />
    </>
  )
}

export default function HomePage() {
  const { isSignedIn } = useUser()
  const primaryCtaLabel = isSignedIn ? "Open dashboard" : "Get ready to receive disputes"
  const primaryCtaHref = isSignedIn ? "/dashboard" : "/sign-in"

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                x402Disputes
                <span className="mx-2 text-slate-300">•</span>
                Payment disputes & refunds
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950">
                Receive x402 payment disputes.
                <br />
                <span className="text-blue-600">Send refunds.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
                Set your dispute link once. Disputes show up here. Refunds go out.
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Inbox when you need it (empty when you don’t)
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  One-click refund / deny / partial refund
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Refund status you can verify
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
                  onClick={() => (window.location.href = primaryCtaHref)}
                >
                  {primaryCtaLabel}
                  </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-900 hover:bg-slate-50 px-7 h-12"
                  onClick={() => {
                    const el = document.getElementById("how-it-works")
                    el?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                  See how it works
                </Button>
              </div>

              <p className="text-xs text-slate-500 pt-2">Built for x402 payments. Works with HTTP + MCP.</p>
            </div>

              <div>
              <ResponsiveLandingScreenshot
                desktopSrc="/landing/all-disputes.png"
                mobileSrc="/landing/all-disputes-mobile.png"
                alt="All disputes dashboard view"
                priority
              />
              </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">How it works</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Three steps. No jargon.</p>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-semibold text-blue-600">STEP 1</div>
              <div className="mt-2 font-semibold text-slate-950">Receive disputes</div>
              <div className="mt-1 text-sm text-slate-600">Disputes arrive from x402 payments (API).</div>
                </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-semibold text-blue-600">STEP 2</div>
              <div className="mt-2 font-semibold text-slate-950">Make a decision</div>
              <div className="mt-1 text-sm text-slate-600">Refund, deny, or partial refund.</div>
                </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-semibold text-blue-600">STEP 3</div>
              <div className="mt-2 font-semibold text-slate-950">Send + track refunds</div>
              <div className="mt-1 text-sm text-slate-600">See refund status and retry failures.</div>
              </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-950">Inbox</h3>
              <p className="text-slate-600">Your place to review disputes. Calm when there’s nothing to do.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- “All caught up” when empty</li>
                <li>- One click to jump into review</li>
              </ul>
        </div>
            <ResponsiveLandingScreenshot
              desktopSrc="/landing/inbox-empty.png"
              mobileSrc="/landing/inbox-empty-mobile.png"
              alt="Inbox empty state"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <ResponsiveLandingScreenshot
              desktopSrc="/landing/dispute-status.png"
              mobileSrc="/landing/dispute-status-mobile.png"
              alt="Dispute detail showing refund status and resolution"
            />
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-950">Refund status</h3>
              <p className="text-slate-600">See what happened and confirm the refund was sent.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- Status: executed / scheduled / failed</li>
                <li>- View on explorer</li>
              </ul>
                  </div>
          </div>
        </div>
      </section>

      {/* API (BELOW FOLD) */}
      <section id="api" className="bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">Expose a Dispute API for your agent</h2>
            <p className="mt-2 text-slate-600">Copy/paste this request to file a dispute.</p>
                </div>
                
          {(() => {
            const curl = `curl -sS https://api.x402disputes.com/api/disputes/payment \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"transactionId\": \"txn_123\",\n    \"amount\": 0.25,\n    \"currency\": \"USD\",\n    \"plaintiff\": \"consumer:alice\",\n    \"defendant\": \"0xMerchantWallet\",\n    \"disputeReason\": \"api_timeout\",\n    \"description\": \"Timed out after payment\",\n    \"transactionHash\": \"0x...\"\n  }'`

            return (
              <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-950 truncate">Dispute API request</div>
                    <div className="text-xs text-slate-500">HTTP • POST /api/disputes/payment</div>
                  </div>
                  <CopyButton value={curl} label="Copied dispute API request" />
                </div>
                <pre className="px-5 py-4 text-xs sm:text-sm overflow-x-auto text-slate-900 bg-slate-50">
{curl}
                </pre>
                <div className="px-5 pb-5 pt-1 text-left">
                  <Button
                    variant="outline"
                    className="border-slate-300"
                    onClick={() => (window.location.href = "/docs")}
                  >
                    View docs
                  </Button>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">Start receiving disputes.</h2>
          <p className="mt-2 text-slate-300 max-w-2xl">A simple dashboard to review disputes and send refunds.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
              onClick={() => (window.location.href = primaryCtaHref)}
            >
              {primaryCtaLabel}
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-7 h-12"
              onClick={() => {
                const el = document.getElementById("api")
                el?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              View dispute API request
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

