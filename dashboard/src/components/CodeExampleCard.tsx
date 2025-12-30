"use client"

import * as React from "react"

import { CopyButton } from "@/components/ui/copy-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <Card className="gap-0 py-0 overflow-hidden shadow-sm border-border/60">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm truncate">{title}</CardTitle>
              <Badge variant="outline" className="text-[11px] py-0.5">
                {language}
              </Badge>
            </div>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <CardAction>
            <CopyButton value={copyValue ?? code} label={`Copied ${title}`} />
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <pre className="m-0 bg-muted/40 text-foreground px-6 py-4 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto whitespace-pre">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

