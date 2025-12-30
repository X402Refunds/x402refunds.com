"use client"

export const dynamic = "force-dynamic"

import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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
            <Alert className="border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Be careful</AlertTitle>
              <AlertDescription>
                Automatic refunds can send money without a human clicking “Confirm”. Use only if you trust the AI settings.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="space-y-1">
                <Label htmlFor="auto-approve" className="text-sm font-medium text-slate-950 cursor-pointer">
                  Automatic refunds
                </Label>
                <div className="text-xs text-slate-600">
                  If enabled, the system may approve AI recommendations automatically.
                </div>
              </div>
              <Switch
                id="auto-approve"
                checked={organization?.autoApproveAI ?? false}
                onCheckedChange={async (enabled) => {
                  if (!organization?._id) return
                  await updateAutoApprove({ organizationId: organization._id, enabled })
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>How agents authenticate when interacting with the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API keys deprecated</AlertTitle>
              <AlertDescription>
                API keys have been replaced with Ed25519 public key authentication. Agents sign evidence with their private key.
              </AlertDescription>
            </Alert>

            <div className="text-slate-600">
              For most teams: register agents in <span className="font-medium text-slate-900">Agents</span>, then use the generated dispute URLs.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Status updates (placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Placeholder: webhook configuration will appear here.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

