"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import {
  Mail,
  ShieldCheck,
  BadgeCheck,
  Search,
  Zap,
  Sparkles,
} from "lucide-react"

export default function HomePage() {
  const aiPrompt = [
    "You are integrating x402refunds.com into a repo with X-402 paywalled endpoints.",
    "",
    "Do these steps exactly (end-to-end):",
    "",
    "0) Find every X-402 paywalled endpoint in this repo",
    "   - Identify all routes/handlers that can return HTTP 402 Payment Required for X-402.",
    "   - These are the endpoints we mean by “paid endpoints” (exclude payment/signature/facilitator plumbing endpoints).",
    "",
    "1) Add a Link header with your refund email (refund contact) to ALL paywalled endpoints",
    "   - Add this on every response those endpoints produce: both 200 and 402.",
    "   - Apply it to every method used (GET, POST, etc.).",
    '     Link: <mailto:refunds@yourdomain.com>; rel=\"https://x402refunds.com/rel/refund-contact\"',
    "   - The <...> target should be mailto:refunds@yourdomain.com",
    "   - This must be the email the owner wants to receive refund requests at.",
    "",
    "2) Add a Link header advertising the refund-request filing URL on paid 200 responses",
    "   - On every paywalled endpoint, when returning 200 OK after a paid request, include:",
    '     Link: <https://api.x402refunds.com/v1/refunds>; rel="https://x402refunds.com/rel/refund-request"; type="application/json"',
    "   - Return this on successful paid 200 responses only.",
    "",
    "3) Deploy + test (required)",
    "   - Deploy to production.",
    "   - Test at least one paywalled endpoint:",
    "     - Unpaid request => 402 response MUST include the refund-contact Link header.",
    "     - Paid request => 200 response MUST include refund-contact + refund-request Link headers.",
    "",
    "Important:",
    "If you do not know the correct refund contact email, ask your owner for it. Do not guess.",
  ].join("\n")

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="relative border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-300/30 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:min-h-[calc(100svh-4rem)] lg:px-8">
          <div className="mx-auto w-full rounded-[32px] border border-slate-200 bg-white px-7 py-12 shadow-[0_25px_80px_-35px_rgba(37,99,235,0.35)] sm:px-14 sm:py-16">
            <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
              <h1 className="text-4xl font-semibold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-8xl">
                <span className="block whitespace-nowrap">
                  Turn on <span className="text-blue-600">refunds</span>
                </span>
                <span className="mt-4 block text-[0.9em] font-semibold text-slate-950">
                  <span className="font-medium text-slate-500">for</span>{" "}
                  <span className="text-blue-600">AI payments.</span>
                </span>
              </h1>
              
              <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl">
                Add two headers. Refund requests land in your email.
              </p>

              <div className="mt-5 text-sm text-slate-600 sm:text-base">
                Email-first · One-click approve/deny/partial · Shareable proof
              </div>

              <Button
                size="lg"
                className="mt-8 h-14 rounded-full bg-blue-600 px-12 text-base text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 sm:text-lg"
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
            <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-foreground">
              Takes 10 seconds.
            </h2>
            <h2 className="mt-2 text-sm sm:text-lg font-medium tracking-tight text-muted-foreground">
              Add two headers. That&apos;s it.
            </h2>
          </div>

          {(() => {
            const filingUrl = "https://api.x402refunds.com/v1/refunds"
            const linkHeader = `Link: <${filingUrl}>; rel=\"https://x402refunds.com/rel/refund-request\"; type=\"application/json\"`
            const refundContactHeader = `Link: <mailto:refunds@yourdomain.com>; rel=\"https://x402refunds.com/rel/refund-contact\"`

            return (
              <div className="mt-12 max-w-7xl mx-auto space-y-10">
                <div className="grid items-start gap-10 lg:grid-cols-2">
                  {/* Step 1 (primary) */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        1) Add refund email header.
                      </div>
                    </div>

                    <CodeBlock
                      language="txt"
                      code={refundContactHeader}
                      header="caption"
                      title="Paid endpoint response header"
                      copyPlacement="overlay"
                      showCopy={false}
                    />

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        2) Add refund URL header.
                      </div>

                      <CodeBlock
                        language="txt"
                        code={linkHeader}
                        header="none"
                        copyPlacement="overlay"
                        showCopy={false}
                      />
                    </div>
                  </div>

                  {/* Step 2 (confirmation + optional) */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        You’ll get refund requests by email
                      </div>
                      <div className="text-sm text-muted-foreground">
                        We email the address from your 402 <span className="font-mono">Link</span> refund-contact header. No signup required.
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          Optional: one‑click refunds
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
                </div>

                <div className="flex justify-center">
                  <div
                    className="inline-flex rounded-full p-[2px] bg-[conic-gradient(from_180deg_at_50%_50%,#93c5fd,#c4b5fd,#fbcfe8,#fde68a,#a7f3d0,#93c5fd)]"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-0 bg-white/60 px-8 text-slate-700 hover:bg-white hover:text-slate-900"
                      onClick={() => {
                        const el = document.getElementById("ai-prompt")
                        el?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }}
                    >
                      Get AI prompt (copy/paste)
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* AI PROMPT */}
      <section id="ai-prompt" className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              AI prompt (Claude Code/Cursor)
            </h2>
          </div>

          <div className="mt-10 max-w-3xl mx-auto space-y-3">
            <CodeBlock
              language="txt"
              code={aiPrompt}
              copyLabel="Copied AI prompt"
              header="none"
              copyPlacement="overlay"
              copyOverlayClassName="scale-200 origin-top-right"
              clickToCopy
            />
          </div>
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
                  <div className="font-semibold text-slate-950">Discoverability</div>
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

