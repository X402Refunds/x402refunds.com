"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Billing page error:", error)
  }, [error])

  return (
    <DashboardLayout>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Billing is not available yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This usually happens when the website was updated but the Convex backend
            hasn’t been deployed with the new <code className="font-mono">refundCredits</code>{" "}
            functions/tables.
          </p>
          <div className="rounded-md border border-border bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
            {error.message}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Fix: deploy Convex, then refresh this page.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}


