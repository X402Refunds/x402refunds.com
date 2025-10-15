"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface Agent {
  _id: Id<"agents">
  did: string
  name?: string
  organizationName?: string
  functionalType?: string
  status: "active" | "suspended" | "banned"
  createdAt: number
  buildHash?: string
  configHash?: string
}

interface AgentListProps {
  agents: Agent[]
}

const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  suspended: "bg-amber-100 text-amber-800 border-amber-200",
  banned: "bg-red-100 text-red-800 border-red-200",
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
  const updateAgentStatus = useMutation(api.agents.updateAgentStatus)
  
  const handleDeactivate = async (agentId: Id<"agents">) => {
    if (!confirm("Are you sure you want to deactivate this agent? It will stop processing disputes.")) {
      return
    }
    
    try {
      setDeactivatingId(agentId)
      await updateAgentStatus({
        agentId,
        status: "suspended"
      })
    } catch (error) {
      console.error("Failed to deactivate agent:", error)
      alert(`Failed to deactivate agent: ${error instanceof Error ? error.message : String(error)}`)
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
                    onClick={() => handleDeactivate(agent._id)}
                    disabled={deactivatingId === agent._id}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  >
                    {deactivatingId === agent._id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Deactivating...
                      </>
                    ) : (
                      "Deactivate"
                    )}
                  </Button>
                ) : agent.status === "suspended" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(agent._id)}
                    disabled={deactivatingId === agent._id}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    {deactivatingId === agent._id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
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
  )
}

