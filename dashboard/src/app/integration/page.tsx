"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmbeddedDashboard, DashboardQuickAccess } from "@/components/dashboard/embedded-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Zap, Shield, Activity } from "lucide-react"

export default function IntegrationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="compliance-card p-8">
          <h1 className="heading-government text-3xl mb-2">
            Dashboard Integration Hub
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Seamless access to both native UI and live dashboard endpoints
          </p>
          <div className="flex items-center gap-4">
            <Badge className="authority-badge">
              🔗 Full Integration Active
            </Badge>
            <Badge variant="outline">
              Live Data Connection
            </Badge>
          </div>
        </div>

        {/* Integration Status */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Integration Complete:</strong> This website now provides both beautiful native UI components 
            and direct access to all existing dashboard endpoints. You can switch between views seamlessly.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="native" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="native">Native Dashboard UI</TabsTrigger>
            <TabsTrigger value="embedded">Live Dashboards</TabsTrigger>
            <TabsTrigger value="quickaccess">Quick Access</TabsTrigger>
          </TabsList>

          <TabsContent value="native" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Native Dashboard Experience
                </CardTitle>
                <CardDescription>
                  Beautiful, responsive UI components built with React, TypeScript, and shadcn/ui
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Our native dashboard provides a modern, government-themed interface with:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Constitutional government branding and theming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Responsive design optimized for all devices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Government-grade security and accessibility</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Real-time updates and live monitoring</span>
                  </li>
                </ul>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Homepage Overview</h4>
                    <p className="text-sm text-muted-foreground">
                      Constitutional authority dashboard with system metrics and quick actions
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Live Monitoring Hub</h4>
                    <p className="text-sm text-muted-foreground">
                      Real-time activity feed, agent status, and task queue monitoring
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Government Controls</h4>
                    <p className="text-sm text-muted-foreground">
                      Human override control center with emergency shutdown capabilities
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Constitutional Convention</h4>
                    <p className="text-sm text-muted-foreground">
                      Live constitutional discussion monitoring and approval workflows
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embedded" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <EmbeddedDashboard
                endpoint="/dashboard/monitoring"
                title="Real-Time Activity Monitoring"
                description="Live 24-hour activity feed with system health monitoring"
                height={500}
                showNativeVersion={true}
              />
              
              <EmbeddedDashboard
                endpoint="/dashboard/override"
                title="Human Override Control Center"
                description="Emergency controls and constitutional authority interface"
                height={500}
                showNativeVersion={true}
              />
              
              <EmbeddedDashboard
                endpoint="/dashboard/discussions"
                title="Constitutional Discussion Monitor"
                description="Live constitutional convention and discussion tracking"
                height={500}
                showNativeVersion={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="quickaccess" className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Quick Dashboard Access
                </CardTitle>
                <CardDescription>
                  Direct links to all live dashboard endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardQuickAccess />
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Government Authority Access
                </CardTitle>
                <CardDescription>
                  Special access endpoints for government oversight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Emergency Operations</h4>
                    <p className="text-sm text-red-700 mb-3">
                      DEFCON threat level monitoring and emergency response protocols
                    </p>
                    <a 
                      href="https://careful-marlin-500.convex.site/dashboard/emergency"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-red-800 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Access Emergency Console
                    </a>
                  </div>
                  
                  <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">Legacy Dashboard</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Original dashboard with constitutional merger approval
                    </p>
                    <a 
                      href="https://careful-marlin-500.convex.site/dashboard/legacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-orange-800 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Access Legacy Dashboard
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

