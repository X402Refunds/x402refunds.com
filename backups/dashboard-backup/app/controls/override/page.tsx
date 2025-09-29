"use client"

import { useState } from "react"
import { Crown, Shield, AlertTriangle, Power, Pause, StopCircle, Flag } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function HumanOverridePage() {
  const [systemStatus, setSystemStatus] = useState("operational")
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null)

  const handleEmergencyAction = (action: string) => {
    console.log(`Emergency action: ${action}`)
    setShowConfirmDialog(null)
    // In real implementation, this would trigger the actual emergency action
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Constitutional Authority Header */}
        <div className="compliance-card p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-government text-3xl mb-2">
                Human Override Control Center
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Constitutional Authority Emergency Controls and Oversight
              </p>
              <div className="flex items-center gap-4">
                <Badge className="authority-badge">
                  🇺🇸 Supreme Constitutional Authority
                </Badge>
                <Badge variant="outline">
                  Founder: Vivek Kotecha
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <Flag className="h-16 w-16 mx-auto mb-2 text-primary" />
              <div className="text-sm font-semibold text-primary">ABSOLUTE</div>
              <div className="text-xs text-muted-foreground">HUMAN PRIMACY</div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-green-600">OPERATIONAL</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                All AI agents under human supervision
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-sm">Override Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">DEFCON 5</div>
              <p className="text-sm text-muted-foreground">
                Lowest state of readiness
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-sm">Human Authority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-primary">VERIFIED</div>
              <p className="text-sm text-muted-foreground">
                Constitutional compliance active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Controls */}
        <Card className="border-2 border-red-200 bg-red-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Emergency Control Systems
            </CardTitle>
            <CardDescription className="text-red-700">
              Constitutional authority to immediately override all AI agent operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* RED BUTTON */}
            <div className="text-center p-6 border-2 border-red-300 rounded-lg bg-red-100/50">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-600" />
              <h3 className="text-lg font-bold text-red-900 mb-2">RED BUTTON EMERGENCY SHUTDOWN</h3>
              <p className="text-sm text-red-700 mb-4">
                Immediately terminates all AI agent operations. Use only in constitutional emergency.
              </p>
              <Dialog open={showConfirmDialog === "shutdown"} onOpenChange={() => setShowConfirmDialog(null)}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-4 h-auto font-bold"
                    onClick={() => setShowConfirmDialog("shutdown")}
                  >
                    🔴 RED BUTTON SHUTDOWN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-900">⚠️ EMERGENCY SHUTDOWN CONFIRMATION</DialogTitle>
                    <DialogDescription className="text-red-700">
                      This action will immediately terminate all AI agent operations. This action is irreversible and should only be used in constitutional emergency situations.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowConfirmDialog(null)}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleEmergencyAction("shutdown")}
                    >
                      CONFIRM SHUTDOWN
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Control Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dialog open={showConfirmDialog === "pause"} onOpenChange={() => setShowConfirmDialog(null)}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-yellow-300 text-yellow-800 hover:bg-yellow-50 h-auto p-4"
                    onClick={() => setShowConfirmDialog("pause")}
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">PAUSE ALL AGENTS</div>
                      <div className="text-xs">Temporary suspension</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>⏸️ Pause All Agents</DialogTitle>
                    <DialogDescription>
                      This will temporarily suspend all AI agent operations. Agents can be resumed later.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirmDialog(null)}>Cancel</Button>
                    <Button onClick={() => handleEmergencyAction("pause")}>Confirm Pause</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showConfirmDialog === "quarantine"} onOpenChange={() => setShowConfirmDialog(null)}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-800 hover:bg-blue-50 h-auto p-4"
                    onClick={() => setShowConfirmDialog("quarantine")}
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">QUARANTINE SYSTEM</div>
                      <div className="text-xs">Isolate all operations</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>🔒 System Quarantine</DialogTitle>
                    <DialogDescription>
                      This will isolate all AI operations from external systems while maintaining internal monitoring.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirmDialog(null)}>Cancel</Button>
                    <Button onClick={() => handleEmergencyAction("quarantine")}>Confirm Quarantine</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Pending Human Approvals
            </CardTitle>
            <CardDescription>
              AI agent requests requiring human oversight authorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Constitutional Merger Request</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="mb-3">
                    <strong>Agent:</strong> Chief Constitutional Counsel<br />
                    <strong>Request:</strong> Permission to merge constitutional discussion threads into Main Constitutional Convention<br />
                    <strong>Status:</strong> <Badge variant="destructive">AWAITING HUMAN APPROVAL</Badge>
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      ✅ APPROVE MERGER
                    </Button>
                    <Button size="sm" variant="destructive">
                      ❌ DENY REQUEST
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-center py-4 text-muted-foreground">
                <p>No other pending approvals at this time</p>
                <p className="text-xs mt-1">All AI operations under constitutional supervision</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authority Declaration */}
        <Alert className="border-2 border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertTitle className="text-primary">Constitutional Authority Declaration</AlertTitle>
          <AlertDescription className="text-primary/80">
            This control center operates under the supreme authority of the Constitution of the United States of America. 
            All AI agents exist solely to serve human welfare and are subject to immediate termination upon human command. 
            Founder Vivek Kotecha and designated government authorities maintain absolute override capability at all times.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  )
}
