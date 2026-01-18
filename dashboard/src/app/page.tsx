"use client"

import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { Container, Section, SectionHeading } from "@/components/layout"
import {
  Mail,
  ShieldCheck,
  BadgeCheck,
  Search,
  Zap,
  Sparkles,
} from "lucide-react"
import { REFUND_HEADERS_AI_PROMPT } from "@/lib/refundHeadersAiPrompt"

export default function HomePage() {
  const aiPrompt = REFUND_HEADERS_AI_PROMPT

  return (
    <div className="min-h-screen bg-white">
      <Navigation currentPage="home" />

      {/* HERO */}
      <section className="relative border-b border-slate-200 bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-120px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-300/30 blur-3xl" />
        </div>

        <Container className="relative flex flex-col py-16 sm:py-24">
          <div className="mx-auto w-full rounded-[32px] border border-slate-200 bg-white px-7 py-12 shadow-[0_25px_80px_-35px_rgba(37,99,235,0.35)] sm:px-14 sm:py-16">
            <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
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
        </Container>
      </section>

      {/* ENABLE DISPUTES (PLUG AND PLAY) */}
      <Section id="enable" className="border-b border-slate-200 bg-slate-50">
        <SectionHeading title="Sellers: add two refund headers." />

          {(() => {
            const filingUrl = "https://api.x402refunds.com/v1/refunds"
            const linkHeader = `Link: <${filingUrl}>; rel=\"https://x402refunds.com/rel/refund-request\"; type=\"application/json\"`
            const refundContactHeader = `Link: <mailto:refunds@yourdomain.com>; rel=\"https://x402refunds.com/rel/refund-contact\"`

            return (
              <div className="mt-12 mx-auto space-y-10">
                <div className="grid items-start gap-10 lg:grid-cols-2">
                  {/* Step 1 (primary) */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground">
                        1) Add refund email header.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Return these headers on paywalled endpoints on both Base and Solana.
                      </div>
                    </div>

                    <CodeBlock
                      language="txt"
                      code={refundContactHeader}
                      header="none"
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
      </Section>

      {/* AI PROMPT */}
      <Section id="ai-prompt" className="border-b border-slate-200 bg-slate-50">
        <SectionHeading title="AI prompt (Claude Code/Cursor)" />

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
      </Section>

      {/* (Removed) WHAT YOU GET */}

      {/* WHAT YOU GET */}
      <section className="bg-slate-50 border-y border-slate-200">
        <Container className="py-16 sm:py-24">
          <SectionHeading
            title="What you get"
            description="A lightweight refund-requests inbox for paid APIs—without building a dashboard."
          />

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
        </Container>
      </section>

      <Footer />
    </div>
  )
}

