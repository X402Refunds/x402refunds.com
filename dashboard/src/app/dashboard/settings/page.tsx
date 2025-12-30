"use client"

export const dynamic = "force-dynamic"

import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const organization = useQuery(api.users.getCurrentUserOrganization, {})
  const updateAutoApprove = useMutation(api.users.updateAutoApproveAI)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Settings</h1>
          <p className="text-slate-600 mt-1">Automation and account configuration.</p>
        </div>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Automation</CardTitle>
            <CardDescription>Control how disputes are handled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50 text-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-red-950">Warning: this can send money automatically</AlertTitle>
              <AlertDescription>
                If enabled, the system may approve AI recommendations and execute refunds without a human clicking “Confirm”.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="auto-approve" className="text-sm font-medium text-slate-950 cursor-pointer">
                  Automatic refunds
                </Label>
                <div className="text-xs text-slate-600">
                  If enabled, the system may approve AI recommendations automatically.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={
                    (organization?.autoApproveAI ?? false)
                      ? "text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full"
                      : "text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full"
                  }
                >
                  {(organization?.autoApproveAI ?? false) ? "ON" : "OFF"}
                </div>
                <Switch
                  id="auto-approve"
                  checked={organization?.autoApproveAI ?? false}
                  onCheckedChange={async (enabled) => {
                    if (!organization?._id) return
                    await updateAutoApprove({ organizationId: organization._id, enabled })
                  }}
                  className="data-[state=checked]:bg-blue-600 scale-125"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

