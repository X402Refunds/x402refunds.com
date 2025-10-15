"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Id } from "@convex/_generated/dataModel"
import { Loader2 } from "lucide-react"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  organizationName: string
  onAgentCreated: () => void
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  userId,
  organizationName,
  onAgentCreated,
}: CreateAgentDialogProps) {
  const [name, setName] = useState("")
  const [orgName, setOrgName] = useState(organizationName)
  const [buildHash, setBuildHash] = useState("")
  const [configHash, setConfigHash] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createOrgAgent = useMutation(api.agents.createOrgAgent)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orgName.trim()) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Auto-generate agent name if not provided
      const finalAgentName = name.trim() || `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-agent-${Date.now()}`;
      
      await createOrgAgent({
        userId,
        name: finalAgentName,
        organizationName: orgName.trim(),
        functionalType: "general", // Default to general for now
        buildHash: buildHash.trim() || undefined,
        configHash: configHash.trim() || undefined,
      })
      
      // Reset form
      setName("")
      setOrgName(organizationName)
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
                Agent Name <span className="text-slate-500 text-xs font-normal">(optional)</span>
              </Label>
              <Input
                id="name"
                placeholder="Leave empty to auto-generate"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-slate-600">
                {name.trim() ? `Will create: ${name}` : `Auto-generates as: ${orgName ? orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'org'}-agent-{timestamp}`}
              </p>
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
              disabled={isSubmitting || !orgName.trim()}
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

