"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { Ban, Loader2 } from "lucide-react"
import { useState } from "react"

interface Agent {
  _id: Id<"agents">
  did: string
  name?: string
  organizationName?: string
  functionalType?: string
  status: "active" | "suspended" | "banned" | "deactivated"
  createdAt: number
  buildHash?: string
  configHash?: string
  deactivatedAt?: number
  deactivatedBy?: Id<"users">
  anonymizedAt?: number
}

interface AgentListProps {
  agents: Agent[]
}

const STATUS_COLORS = {
  active: "bg-accent text-foreground border-border",
  suspended: "bg-accent text-foreground border-border",
  banned: "bg-destructive/10 text-destructive border-destructive/20",
  deactivated: "bg-muted text-muted-foreground border-border",
}

const FUNCTIONAL_TYPE_LABELS: Record<string, string> = {
  general: "General",
  voice: "Voice",
  chat: "Chat",
  social: "Social",
  coding: "Coding",
  devops: "DevOps",
  security: "Security",
  data: "Data",
  api: "API",
  writing: "Writing",
  design: "Design",
  video: "Video",
  music: "Music",
  research: "Research",
  financial: "Financial",
  sales: "Sales",
  marketing: "Marketing",
  legal: "Legal",
  healthcare: "Healthcare",
  education: "Education",
  scientific: "Scientific",
  workflow: "Workflow",
  scheduler: "Scheduler",
}

export function AgentList({ agents }: AgentListProps) {
  const [deactivatingId, setDeactivatingId] = useState<Id<"agents"> | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [agentToSuspend, setAgentToSuspend] = useState<{ id: Id<"agents">; name: string } | null>(null)
  const updateAgentStatus = useMutation(api.agents.updateAgentStatus)
  
  const handleSuspendClick = (agentId: Id<"agents">, agentName: string) => {
    setAgentToSuspend({ id: agentId, name: agentName })
    setSuspendDialogOpen(true)
  }

  const handleSuspendConfirm = async () => {
    if (!agentToSuspend) return
    
    try {
      setDeactivatingId(agentToSuspend.id)
      await updateAgentStatus({
        agentId: agentToSuspend.id,
        status: "suspended"
      })
      setSuspendDialogOpen(false)
      setAgentToSuspend(null)
    } catch (error) {
      console.error("Failed to suspend agent:", error)
      alert(`Failed to suspend agent: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setDeactivatingId(null)
    }
  }
  
  const handleActivate = async (agentId: Id<"agents">) => {
    try {
      setDeactivatingId(agentId)
      await updateAgentStatus({
        agentId,
        status: "active"
      })
    } catch (error) {
      console.error("Failed to activate agent:", error)
      alert(`Failed to activate agent: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setDeactivatingId(null)
    }
  }
  
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No agents deployed yet
      </div>
    )
  }
  
  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dispute URL</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent._id}>
                <TableCell className="font-medium">
                  {agent.name || "Unnamed Agent"}
                </TableCell>
                <TableCell>
                  {agent.organizationName || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-muted">
                    {FUNCTIONAL_TYPE_LABELS[agent.functionalType || "general"] || agent.functionalType || "General"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={STATUS_COLORS[agent.status]}
                  >
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <a 
                    href={`https://api.consulatehq.com/disputes/claim?vendor=${agent.did}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    title={`Dispute URL: https://api.consulatehq.com/disputes/claim?vendor=${agent.did}`}
                  >
                    /disputes/claim?vendor={agent.did.slice(0, 20)}...
                  </a>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(agent.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  {agent.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspendClick(agent._id, agent.name || "Unnamed Agent")}
                      disabled={deactivatingId === agent._id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                      {deactivatingId === agent._id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Suspending...
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </>
                      )}
                    </Button>
                  ) : agent.status === "suspended" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(agent._id)}
                      disabled={deactivatingId === agent._id}
                      className="text-foreground hover:text-foreground hover:bg-accent border-border"
                    >
                      {deactivatingId === agent._id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  ) : (
                    <Badge variant="destructive">
                      Banned
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Confirmation Modal */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Agent?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You&apos;re about to suspend <span className="font-semibold text-foreground">&quot;{agentToSuspend?.name}&quot;</span>
              </p>
              <p>
                This will stop the agent from processing disputes. You can reactivate it later.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Suspend Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

