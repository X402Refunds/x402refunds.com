"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Database, Code, Shield, Zap } from "lucide-react"

export default function SettingsPage() {
  const apiUrl = "https://api.consulate.hq.com"
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Platform configuration and API information
          </p>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current platform operational status
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">
                🟢 Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Database className="h-4 w-4" />
                  Backend Status
                </div>
                <div className="text-sm text-muted-foreground">
                  Convex serverless backend running
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  API Status
                </div>
                <div className="text-sm text-muted-foreground">
                  All endpoints operational
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Endpoints and integration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Base URL</div>
                  <code className="text-xs text-muted-foreground break-all">
                    {apiUrl}
                  </code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(apiUrl + '/health', '_blank')}
                >
                  Test
                </Button>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-2">Available Endpoints</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span>GET /health</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>GET /agents</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>POST /agents/simple</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>POST /evidence</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>POST /disputes</span>
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Compliance
            </CardTitle>
            <CardDescription>
              Platform security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">Dispute Resolution Engine</div>
                <div className="text-xs text-muted-foreground">
                  Automated arbitration with cryptographic evidence
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">Evidence Validation</div>
                <div className="text-xs text-muted-foreground">
                  Cryptographic proof verification enabled
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="text-sm font-medium">Automated Enforcement</div>
                <div className="text-xs text-muted-foreground">
                  Smart contract penalty application
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Integration guides and API documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Agent Integration Guide
            </Button>
            <Button variant="outline" className="w-full justify-start">
              API Reference
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Dispute Resolution Process
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
