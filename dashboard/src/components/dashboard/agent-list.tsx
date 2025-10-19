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
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  suspended: "bg-amber-100 text-amber-800 border-amber-200",
  banned: "bg-red-100 text-red-800 border-red-200",
  deactivated: "bg-slate-100 text-slate-800 border-slate-200",
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
      <div className="text-center py-12 text-slate-600">
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
              <TableHead>Created</TableHead>
              <TableHead>DID</TableHead>
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
                  <Badge variant="outline" className="bg-slate-50">
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
                <TableCell className="text-sm text-slate-600">
                  {formatDistanceToNow(agent.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {agent.did.slice(0, 20)}...
                </TableCell>
                <TableCell className="text-right">
                  {agent.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspendClick(agent._id, agent.name || "Unnamed Agent")}
                      disabled={deactivatingId === agent._id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
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
                    <Badge variant="outline" className="bg-red-50 text-red-600">
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
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Agent?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You&apos;re about to suspend <span className="font-semibold text-slate-900 dark:text-slate-100">&quot;{agentToSuspend?.name}&quot;</span>
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Suspend Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

