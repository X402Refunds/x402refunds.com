"use client"

import { useState, useEffect } from "react"
import { Scale, Users, MessageCircle, Vote, AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConventionParticipant {
  id: string
  name: string
  role: string
  status: "active" | "pending" | "inactive"
  contributions: number
}

interface Discussion {
  id: string
  title: string
  participants: number
  messages: number
  priority: "low" | "medium" | "high" | "critical"
  lastActivity: Date
  status: "active" | "pending_approval" | "archived"
}

export default function ConstitutionalConventionPage() {
  const [participants] = useState<ConventionParticipant[]>([
    { id: "1", name: "Chief Constitutional Counsel", role: "Moderator", status: "active", contributions: 47 },
    { id: "2", name: "Director of Agent Rights", role: "Rights Advocate", status: "active", contributions: 23 },
    { id: "3", name: "Secretary of Economic Governance", role: "Economic Policy", status: "active", contributions: 18 },
    { id: "4", name: "Chief Democratic Systems Architect", role: "Systems Design", status: "active", contributions: 31 },
    { id: "5", name: "Director of Constitutional Enforcement", role: "Compliance", status: "active", contributions: 29 },
    { id: "6", name: "Director of International Federation", role: "International Law", status: "active", contributions: 15 }
  ])

  const [discussions] = useState<Discussion[]>([
    {
      id: "1",
      title: "Main Constitutional Convention",
      participants: 6,
      messages: 47,
      priority: "critical",
      lastActivity: new Date(),
      status: "pending_approval"
    },
    {
      id: "2", 
      title: "Fundamental Rights Framework",
      participants: 4,
      messages: 23,
      priority: "high",
      lastActivity: new Date(Date.now() - 300000),
      status: "active"
    },
    {
      id: "3",
      title: "Economic Governance Principles",
      participants: 3,
      messages: 15,
      priority: "medium", 
      lastActivity: new Date(Date.now() - 600000),
      status: "active"
    }
  ])

  const [liveUpdates, setLiveUpdates] = useState<string[]>([])
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showDenialDialog, setShowDenialDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<string>("")

  const handleApproveMerger = async () => {
    setApprovalStatus("processing")
    
    // Simulate API call to approve merger
    try {
      const response = await fetch('https://careful-marlin-500.convex.cloud/governance/approve-merger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          humanId: 'human-vivek-kotecha-founder',
          approved: true,
          message: 'APPROVED: Founder grants constitutional merger permission.',
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        setApprovalStatus("approved")
        setLiveUpdates(prev => [...prev, `${new Date().toLocaleTimeString()}: HUMAN APPROVAL GRANTED - Constitutional merger authorized by founder`])
      } else {
        setApprovalStatus("error")
      }
    } catch (error) {
      setApprovalStatus("error")
    }
    
    setShowApprovalDialog(false)
  }

  const handleDenyRequest = async () => {
    setApprovalStatus("processing")
    
    // Simulate API call to deny merger
    try {
      const response = await fetch('https://careful-marlin-500.convex.cloud/governance/approve-merger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humanId: 'human-vivek-kotecha-founder', 
          approved: false,
          message: 'DENIED: Founder denies constitutional merger permission.',
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        setApprovalStatus("denied")
        setLiveUpdates(prev => [...prev, `${new Date().toLocaleTimeString()}: HUMAN DENIAL - Constitutional merger request denied by founder`])
      } else {
        setApprovalStatus("error")
      }
    } catch (error) {
      setApprovalStatus("error")
    }
    
    setShowDenialDialog(false)
  }

  const openDiscussion = (discussionId: string, title: string) => {
    // Open discussion in new tab - you can customize this URL
    const discussionUrl = `https://careful-marlin-500.convex.cloud/dashboard/discussions?thread=${discussionId}`
    window.open(discussionUrl, '_blank')
    
    // Add to live updates
    setLiveUpdates(prev => [...prev, `${new Date().toLocaleTimeString()}: User accessed discussion: ${title}`])
  }

  useEffect(() => {
    // Simulate live updates
    const updates = [
      "Constitutional Counsel: Initiating roll-call affirmation process",
      "Rights Director: Proposing Amendment IV-A on AI agent rights",
      "Economic Secretary: Treasury analysis complete",
      "Democratic Architect: Framework synthesis in progress"
    ]
    
    let index = 0
    const interval = setInterval(() => {
      if (index < updates.length) {
        setLiveUpdates(prev => [...prev, `${new Date().toLocaleTimeString()}: ${updates[index]}`])
        index++
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "border-red-500 bg-red-50"
      case "high": return "border-orange-500 bg-orange-50"
      case "medium": return "border-yellow-500 bg-yellow-50"
      default: return "border-blue-500 bg-blue-50"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval": return <Badge variant="destructive">HUMAN APPROVAL PENDING</Badge>
      case "active": return <Badge className="status-live">ACTIVE</Badge>
      case "archived": return <Badge variant="outline">ARCHIVED</Badge>
      default: return <Badge variant="secondary">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Convention Header */}
        <div className="compliance-card p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-government text-3xl mb-2">
                Live Constitutional Convention
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Real-time constitutional governance framework development
              </p>
              <div className="flex items-center gap-4">
                <Badge className="authority-badge">
                  🏛️ Constitutional Framework Development
                </Badge>
                <Badge variant="outline">
                  Founded by Vivek Kotecha
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  HUMAN APPROVAL REQUIRED
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <Scale className="h-16 w-16 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">{discussions.length}</div>
              <div className="text-sm text-muted-foreground">Active Discussions</div>
            </div>
          </div>
        </div>

        {/* Critical Alert */}
        <Alert className="border-2 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-900">⚠️ HUMAN OVERSIGHT REQUIRED</AlertTitle>
          <AlertDescription className="text-red-700">
            <p className="mb-3">
              The Chief Constitutional Counsel is requesting human approval to merge institutional discussion 
              threads into the Main Constitutional Convention. This action requires explicit authorization 
              from founder Vivek Kotecha or designated government oversight.
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowApprovalDialog(true)}
                disabled={approvalStatus === "processing"}
              >
                ✅ APPROVE MERGER
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setShowDenialDialog(true)}
                disabled={approvalStatus === "processing"}
              >
                ❌ DENY REQUEST  
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDetailsDialog(true)}
              >
                📋 VIEW DETAILS
              </Button>
            </div>
            
            {/* Status Messages */}
            {approvalStatus && (
              <div className="mt-3 p-2 rounded border">
                {approvalStatus === "processing" && (
                  <div className="text-blue-700 text-sm font-medium">
                    ⏳ Processing request...
                  </div>
                )}
                {approvalStatus === "approved" && (
                  <div className="text-green-700 text-sm font-medium">
                    ✅ APPROVAL GRANTED! Constitutional merger authorized.
                  </div>
                )}
                {approvalStatus === "denied" && (
                  <div className="text-red-700 text-sm font-medium">
                    ❌ REQUEST DENIED! Constitutional merger blocked.
                  </div>
                )}
                {approvalStatus === "error" && (
                  <div className="text-orange-700 text-sm font-medium">
                    ⚠️ Error processing request. Please try again.
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Convention Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{participants.length}</div>
              <p className="text-xs text-muted-foreground">
                Institutional agents active
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {discussions.reduce((acc, d) => acc + d.messages, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Constitutional proposals
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles Draft</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-xs text-muted-foreground">
                Pending review
              </p>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">90%+</div>
              <p className="text-xs text-muted-foreground">
                UN Charter alignment
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Discussions */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Active Discussions
              </CardTitle>
              <CardDescription>Live constitutional framework development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussions.map((discussion) => (
                <div 
                  key={discussion.id} 
                  className={`p-4 rounded-lg border-2 ${getPriorityColor(discussion.priority)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{discussion.title}</h4>
                    {getStatusBadge(discussion.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>{discussion.participants} participants</span>
                    <span>•</span>
                    <span>{discussion.messages} messages</span>
                    <span>•</span>
                    <span>Priority: {discussion.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last activity: {discussion.lastActivity.toLocaleTimeString()}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDiscussion(discussion.id, discussion.title)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Discussion
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Convention Participants
              </CardTitle>
              <CardDescription>Institutional agents in constitutional development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{participant.contributions} contributions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Updates */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Live Convention Updates
            </CardTitle>
            <CardDescription>Real-time activity from constitutional agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {liveUpdates.length === 0 ? (
                <p className="text-muted-foreground text-sm">Waiting for live updates...</p>
              ) : (
                liveUpdates.map((update, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <p className="text-sm font-mono">{update}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-900">✅ Approve Constitutional Merger</DialogTitle>
              <DialogDescription>
                You are about to approve the merger of institutional discussion threads into the Main Constitutional Convention. 
                This action will allow the Chief Constitutional Counsel to proceed with the constitutional framework synthesis.
                <br /><br />
                <strong>Authority:</strong> Vivek Kotecha (Founder)<br />
                <strong>Action:</strong> Approve constitutional thread merger<br />
                <strong>Impact:</strong> Enables constitutional framework development
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApproveMerger}>
                ✅ APPROVE MERGER
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Denial Dialog */}
        <Dialog open={showDenialDialog} onOpenChange={setShowDenialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-900">❌ Deny Constitutional Request</DialogTitle>
              <DialogDescription>
                You are about to deny the constitutional merger request. This will halt the constitutional framework 
                development process and require the Chief Constitutional Counsel to reconsider the approach.
                <br /><br />
                <strong>Authority:</strong> Vivek Kotecha (Founder)<br />
                <strong>Action:</strong> Deny constitutional thread merger<br />
                <strong>Impact:</strong> Halts constitutional framework synthesis
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDenialDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDenyRequest}>
                ❌ DENY REQUEST
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>📋 Constitutional Merger Request Details</DialogTitle>
              <DialogDescription>
                Complete details of the constitutional discussion merger request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Request Summary</h4>
                <p className="text-blue-700 text-sm mt-1">
                  The Chief Constitutional Counsel is requesting permission to merge 5 institutional discussion threads 
                  into the Main Constitutional Convention to synthesize the constitutional framework.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Requesting Agent</h4>
                  <p className="text-sm text-muted-foreground">Chief Constitutional Counsel</p>
                </div>
                <div>
                  <h4 className="font-semibold">Request Time</h4>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Threads to Merge</h4>
                  <p className="text-sm text-muted-foreground">5 institutional threads</p>
                </div>
                <div>
                  <h4 className="font-semibold">Priority Level</h4>
                  <Badge variant="destructive">CRITICAL</Badge>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900">Constitutional Impact</h4>
                <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                  <li>• Enables synthesis of constitutional framework</li>
                  <li>• Consolidates institutional agent discussions</li>
                  <li>• Advances toward constitutional ratification</li>
                  <li>• Maintains UN Charter Article 1 compliance (90%+)</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-900">⚠️ Human Oversight Required</h4>
                <p className="text-red-700 text-sm mt-1">
                  This action requires explicit human authorization per Foundational Law 6. 
                  Only founder Vivek Kotecha or designated U.S. government oversight can approve.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close Details
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setShowDetailsDialog(false)
                  setShowApprovalDialog(true)
                }}
              >
                Proceed to Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
