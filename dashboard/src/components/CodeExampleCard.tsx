"use client"

import * as React from "react"

import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
  const [expanded, setExpanded] = React.useState(false)

  const displayCode = React.useMemo(() => {
    if (!collapsedLines || collapsedLines <= 0) return code
    const lines = code.split("\n")
    if (expanded || lines.length <= collapsedLines) return code
    return `${lines.slice(0, collapsedLines).join("\n")}\n…`
  }, [code, collapsedLines, expanded])

  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-card py-0 shadow-[0_1px_0_rgba(0,0,0,0.03),0_12px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-foreground leading-snug break-words">
              {title}
            </div>
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            >
              {language}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        </div>

        <div className="flex items-center gap-1">
          {collapsedLines && collapsedLines > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Less" : "More"}
            </Button>
          )}
          <CopyButton value={copyValue ?? code} label={`Copied ${title}`} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-muted/25">
        <pre className="m-0 overflow-x-auto px-5 py-4 text-[13px] leading-6 text-foreground whitespace-pre">
          <code className="font-mono">{displayCode}</code>
        </pre>
      </div>
    </Card>
  )
}

