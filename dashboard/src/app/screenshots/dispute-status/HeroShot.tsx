"use client"

import type { CSSProperties } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function DisputeStatusHeroShot({ variant }: { variant: "desktop" | "mobile" }) {
  const isMobile = variant === "mobile"
  const frameStyle: CSSProperties = isMobile
    ? { width: 864, height: 1536 } // 9:16
    : { width: 1200, height: 750 } // 16:10

  return (
    <div id="hero-shot" style={frameStyle} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-full w-full p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Refund status</h1>
            <p className="text-slate-600 mt-1">Confirm the refund was sent and track progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
              Executed
            </Badge>
            <Badge variant="secondary" className="border border-slate-200">
              CONSUMER_WINS
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-950">Refund</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Status</div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                  executed
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Amount</div>
                <div className="font-semibold text-slate-950">$0.01 USDC</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Transaction</div>
                <Button variant="outline" className="border-slate-300 h-8 px-3">
                  View on explorer <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-slate-500">
                Last updated: 2 minutes ago
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-950">Decision</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Verdict</div>
                <Badge variant="secondary" className="border border-slate-200">
                  CONSUMER_WINS
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Decision type</div>
                <div className="text-sm text-slate-700">Approved AI</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Notes</div>
                <div className="text-sm text-slate-700">Refund sent successfully.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

