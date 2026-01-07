"use client"

import type { CSSProperties } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type MockDispute = {
  amount: string
  reason: string
  decided: boolean
  ageLabel: string
  customer: string
  decision?: string
}

const MOCK_DISPUTES: MockDispute[] = [
  {
    amount: "$0.01 USDC",
    reason: "quality issue",
    decided: false,
    ageLabel: "Filed 3d ago",
    customer: "0x1830dadb0a16eb569b5f8526aaddf47ce85ac8e0",
  },
  {
    amount: "$0.01 USDC",
    reason: "quality issue",
    decided: false,
    ageLabel: "Filed 3d ago",
    customer: "0x1830dadb0a16eb569b5f8526aaddf47ce85ac8e0",
  },
  {
    amount: "$0.01 USDC",
    reason: "quality issue",
    decided: true,
    ageLabel: "Filed 3d ago",
    customer: "0x1830dadb0a16eb569b5f8526aaddf47ce85ac8e0",
    decision: "CONSUMER_WINS",
  },
  {
    amount: "$0.01 USDC",
    reason: "quality issue",
    decided: true,
    ageLabel: "Filed 3d ago",
    customer: "0x1830dadb0a16eb569b5f8526aaddf47ce85ac8e0",
    decision: "CONSUMER_WINS",
  },
  {
    amount: "$0.01 USDC",
    reason: "quality issue",
    decided: true,
    ageLabel: "Filed 3d ago",
    customer: "0x1830dadb0a16eb569b5f8526aaddf47ce85ac8e0",
    decision: "CONSUMER_WINS",
  },
]

export function HeroShot({ variant }: { variant: "desktop" | "mobile" }) {
  const isMobile = variant === "mobile"

  // Fixed canvases so screenshots are deterministic. Kept within the browser tool's capture limits.
  const frameStyle: CSSProperties = isMobile
    ? { width: 864, height: 1536 } // 9:16
    : { width: 1200, height: 750 } // 16:10

  return (
    <div id="hero-shot" style={frameStyle} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-full w-full p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">All disputes</h1>
              <p className="text-slate-600 mt-1">Search, filter, and review any dispute.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">All</Button>
              <Button variant="outline" className="border-slate-300">
                Waiting
              </Button>
              <Button variant="outline" className="border-slate-300">
                Decided
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <Card className="border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="text-slate-950">Disputes</CardTitle>
                  <div className="w-full sm:w-96">
                    <Input placeholder="Search by case ID, tx hash, email…" className="border-slate-300" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-slate-200">
                  {MOCK_DISPUTES.map((d, idx) => (
                    <div key={idx} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="font-semibold text-slate-950">{d.amount}</div>
                          <Badge variant="secondary" className="border border-slate-200">
                            {d.reason}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              d.decided
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }
                          >
                            {d.decided ? "Decided" : "Waiting"}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                            {d.ageLabel}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-slate-600 truncate">Customer: {d.customer}</div>
                        {d.decision && <div className="mt-1 text-xs text-slate-500">Decision: {d.decision}</div>}
                      </div>

                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Review <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  )
}

