"use client"

import * as React from "react"

import { CopyButton } from "@/components/ui/copy-button"
import { Card } from "@/components/ui/card"

export function CodeExampleCard({
  title,
  description,
  language,
  code,
  copyValue,
  collapsedLines,
}: {
  title: string
  description: string
  language: string
  code: string
  copyValue?: string
  collapsedLines?: number
}) {
  const displayCode = React.useMemo(() => {
    if (!collapsedLines || collapsedLines <= 0) return code
    const lines = code.split("\n")
    if (lines.length <= collapsedLines) return code
    return `${lines.slice(0, collapsedLines).join("\n")}\n…`
  }, [code, collapsedLines])

  return (
    <Card
      data-language={language}
      className="overflow-hidden rounded-2xl border-border/60 bg-card py-0 shadow-[0_1px_0_rgba(0,0,0,0.03),0_12px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground leading-snug break-words">
              {title}
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        </div>

        <CopyButton value={copyValue ?? code} label={`Copied ${title}`} />
      </div>

      <div className="border-t border-border/60 bg-muted/25">
        <pre className="m-0 overflow-x-auto px-5 py-4 text-[13px] leading-6 text-foreground whitespace-pre">
          <code className="font-mono">{displayCode}</code>
        </pre>
      </div>
    </Card>
  )
}

