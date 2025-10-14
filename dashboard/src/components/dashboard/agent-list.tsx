"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Agent {
  _id: string
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

