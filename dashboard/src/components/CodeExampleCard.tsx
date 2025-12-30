"use client"

import * as React from "react"

import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function CodeExampleCard({
  title,
  description,
  language,
  code,
  copyValue,
}: {
  title: string
  description: string
  language: string
  code: string
  copyValue?: string
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-card py-0 shadow-[0_1px_0_rgba(0,0,0,0.03),0_12px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground truncate">{title}</div>
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            >
              {language}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        </div>

        <CopyButton value={copyValue ?? code} label={`Copied ${title}`} />
      </div>

      <div className="border-t border-border/60 bg-muted/25">
        <pre className="m-0 overflow-x-auto px-5 py-4 text-[13px] leading-6 text-foreground whitespace-pre">
          <code className="font-mono">{code}</code>
        </pre>
      </div>
    </Card>
  )
}

