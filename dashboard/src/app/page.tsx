"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"

function MediaPlaceholder({
  label,
  aspect = "aspect-[16/10]",
}: {
  label: string
  aspect?: string
}) {
  return (
    <div className={`w-full ${aspect} rounded-xl border border-slate-200 bg-white shadow-sm`}>
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Placeholder
          </div>
          <div className="mt-2 text-sm font-medium text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-500">(Add screenshot/graphic later)</div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isSignedIn } = useUser()

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
                Resolve x402 payment disputes.
                <br />
                <span className="text-blue-600">Send refunds.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-xl">
                Disputes come in. You make the call. Refunds go out.
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Inbox for disputes that need a decision
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  One-click refund / deny / partial refund
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Track status + retry failed refunds
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
                  onClick={() => (window.location.href = isSignedIn ? "/dashboard" : "/sign-in")}
                >
                  Open dashboard
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
              <MediaPlaceholder label="Product screenshot: Inbox + dispute detail (decision + refund status)" />
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
              <p className="text-slate-600">See disputes that need a decision. Nothing else.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- Amount, reason, deadline</li>
                <li>- “Review & decide” in one click</li>
              </ul>
            </div>
            <MediaPlaceholder label="Screenshot: Inbox (disputes waiting on you)" />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <MediaPlaceholder label="Screenshot: Dispute detail (refund/deny/partial + refund status)" />
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-slate-950">Decide + refund</h3>
              <p className="text-slate-600">See what happened. Choose refund or deny. Done.</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>- Refund / No refund / Partial refund</li>
                <li>- Status: scheduled, sent, failed (retry)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* API (BELOW FOLD) */}
      <section id="api" className="bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">API</h2>
              <p className="mt-2 text-slate-600">For builders: file a dispute, then check status.</p>
                        </div>
            <Button variant="outline" className="border-slate-300" onClick={() => (window.location.href = "/docs")}>
              View docs
            </Button>
                      </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-950 text-slate-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-300">POST /api/disputes/payment</div>
              <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
{`curl -sS https://api.x402disputes.com/api/disputes/payment \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "txn_123",
    "amount": 0.25,
    "currency": "USD",
    "plaintiff": "consumer:alice",
    "defendant": "0xMerchantWallet",
    "disputeReason": "api_timeout",
    "description": "Timed out after payment",
    "transactionHash": "0x..."
  }'`}
                      </pre>
                    </div>

            <div className="rounded-xl border border-slate-200 bg-slate-950 text-slate-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-300">GET /cases/:caseId</div>
              <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
{`curl -sS https://api.x402disputes.com/cases/k...`}
                      </pre>
                    </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENCY */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">Transparent by default</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Use the public registry to verify dispute status and outcomes.</p>
          <div className="mt-6">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => (window.location.href = "/registry")}>
              View public registry
              </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-20 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold">Resolve disputes. Send refunds.</h2>
          <p className="mt-2 text-slate-300 max-w-2xl">Keep your x402 payments reliable—without building a disputes stack.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 h-12"
              onClick={() => (window.location.href = isSignedIn ? "/dashboard" : "/sign-in")}
            >
              Open dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-7 h-12"
              onClick={() => (window.location.href = "/docs")}
            >
              View docs
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

