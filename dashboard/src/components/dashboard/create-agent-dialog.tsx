"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Id } from "@convex/_generated/dataModel"
import { Loader2 } from "lucide-react"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  organizationName: string
  onAgentCreated: () => void
}

const FUNCTIONAL_TYPES = [
  { value: "general", label: "General Purpose" },
  { value: "voice", label: "Voice/Audio" },
  { value: "chat", label: "Chat/Messaging" },
  { value: "social", label: "Social Media" },
  { value: "translation", label: "Translation" },
  { value: "coding", label: "Coding/Development" },
  { value: "devops", label: "DevOps" },
  { value: "security", label: "Security" },
  { value: "data", label: "Data Processing" },
  { value: "api", label: "API Integration" },
  { value: "writing", label: "Writing/Content" },
  { value: "design", label: "Design" },
  { value: "video", label: "Video" },
  { value: "music", label: "Music/Audio" },
  { value: "research", label: "Research" },
  { value: "financial", label: "Financial" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "scientific", label: "Scientific" },
  { value: "workflow", label: "Workflow Automation" },
  { value: "scheduler", label: "Scheduling" },
] as const

export function CreateAgentDialog({
  open,
  onOpenChange,
  userId,
  organizationName,
  onAgentCreated,
}: CreateAgentDialogProps) {
  const [name, setName] = useState("")
  const [orgName, setOrgName] = useState(organizationName)
  const [functionalType, setFunctionalType] = useState<string>("general")
  const [buildHash, setBuildHash] = useState("")
  const [configHash, setConfigHash] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createOrgAgent = useMutation(api.agents.createOrgAgent)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !orgName.trim()) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      await createOrgAgent({
        userId,
        name: name.trim(),
        organizationName: orgName.trim(),
        functionalType: functionalType as "voice" | "chat" | "social" | "translation" | "presentation" | "coding" | "devops" | "security" | "data" | "api" | "writing" | "design" | "video" | "music" | "gaming" | "research" | "financial" | "sales" | "marketing" | "legal" | "healthcare" | "education" | "scientific" | "manufacturing" | "transportation" | "scheduler" | "workflow" | "procurement" | "project" | "general",
        buildHash: buildHash.trim() || undefined,
        configHash: configHash.trim() || undefined,
      })
      
      // Reset form
      setName("")
      setOrgName(organizationName)
      setFunctionalType("general")
      setBuildHash("")
      setConfigHash("")
      
      onAgentCreated()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create agent:", error)
      alert(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Deploy a new AI agent to your organization. Agents use Ed25519 signatures for authentication (no API keys needed).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Agent Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="My AI Assistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="orgName">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orgName"
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <p className="text-xs text-slate-600">
                Organization identifier for the agent
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="functionalType">Functional Type</Label>
              <Select value={functionalType} onValueChange={setFunctionalType}>
                <SelectTrigger id="functionalType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNCTIONAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600">
                Primary function of this agent
              </p>
            </div>
            
            <div className="grid gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900">
                🔐 Signature-Based Authentication
              </p>
              <p className="text-xs text-blue-800">
                After creating your agent, you can enable autonomous operation by calling the{" "}
                <code className="bg-blue-100 px-1 py-0.5 rounded">addAgentPublicKey</code> mutation with your Ed25519 public key.
                No API keys needed!
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim() || !orgName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

