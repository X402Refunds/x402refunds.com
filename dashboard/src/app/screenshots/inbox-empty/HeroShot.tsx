"use client"

import type { CSSProperties } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

export function InboxEmptyHeroShot({ variant }: { variant: "desktop" | "mobile" }) {
  const isMobile = variant === "mobile"
  const frameStyle: CSSProperties = isMobile
    ? { width: 864, height: 1536 } // 9:16
    : { width: 1200, height: 750 } // 16:10

  return (
    <div id="hero-shot" style={frameStyle} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-full w-full p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Inbox</h1>
            <p className="text-slate-600 mt-1">Disputes waiting on you.</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
              All caught up
            </Badge>
            <Button variant="outline" className="border-slate-300">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Card className="border border-slate-200">
            <CardContent className="py-14">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-slate-950">You’re all caught up.</div>
                  <div className="text-sm text-slate-600 mt-1 max-w-xl">
                    When a dispute comes in, it will show up here for review.
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      View all disputes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="border-slate-300">
                      Agents
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

