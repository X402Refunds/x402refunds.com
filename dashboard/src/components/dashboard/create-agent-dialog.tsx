"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Id } from "@convex/_generated/dataModel"
import { Loader2, Copy, CheckCircle2 } from "lucide-react"

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
  const [orgName, setOrgName] = useState(organizationName)
  const [buildHash, setBuildHash] = useState("")
  const [configHash, setConfigHash] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // NEW: Track registration token and success state
  const [registrationToken, setRegistrationToken] = useState<string | null>(null)
  const [agentDid, setAgentDid] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const createOrgAgent = useMutation(api.agents.createOrgAgent)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orgName.trim()) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Auto-generate agent name based on organization
      const finalAgentName = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-agent-${Date.now()}`;
      
      const result = await createOrgAgent({
        userId,
        name: finalAgentName,
        organizationName: orgName.trim(),
        functionalType: "general", // Default to general for now
        buildHash: buildHash.trim() || undefined,
        configHash: configHash.trim() || undefined,
      })
      
      // NEW: Store token and DID to show success state
      setRegistrationToken(result.registrationToken)
      setAgentDid(result.did)
      
      // DON'T close dialog - show token first
      
    } catch (error) {
      console.error("Failed to create agent:", error)
      alert(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCopyToken = () => {
    if (registrationToken) {
      navigator.clipboard.writeText(registrationToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleCopyDid = () => {
    if (agentDid) {
      navigator.clipboard.writeText(agentDid)
    }
  }
  
  const handleClose = () => {
    // Reset all state
    setOrgName(organizationName)
    setBuildHash("")
    setConfigHash("")
    setRegistrationToken(null)
    setAgentDid(null)
    setCopied(false)
    onAgentCreated()
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && registrationToken) {
        // Allow closing if token is shown and user dismisses
        handleClose()
      } else if (!open) {
        // Normal close
        onOpenChange(false)
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        {!registrationToken ? (
          // Form State: Create Agent
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Deploy a new AI agent to your organization. Agents use Ed25519 signatures for authentication (no API keys needed).
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
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
                  After creating your agent, you&apos;ll receive a one-time registration token to add your Ed25519 public key.
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
        ) : (
          // Success State: Show Registration Token
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Agent Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Save this registration token - it will only be shown once and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  ⚠️ Important: Save Your Registration Token
                </p>
                <p className="text-xs text-yellow-800">
                  You need this token to register your agent&apos;s Ed25519 public key. 
                  It will only be shown once and cannot be recovered. Store it securely!
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Agent DID</Label>
                <div className="flex gap-2">
                  <Input 
                    value={agentDid || ""} 
                    readOnly 
                    className="font-mono text-xs bg-slate-50"
                  />
                  <Button 
                    type="button"
                    onClick={handleCopyDid}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Registration Token</Label>
                <div className="flex gap-2">
                  <Input 
                    value={registrationToken || ""} 
                    readOnly 
                    className="font-mono text-xs bg-slate-50"
                  />
                  <Button 
                    type="button"
                    onClick={handleCopyToken}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Next Steps:
                </p>
                <ol className="text-xs text-blue-800 list-decimal list-inside space-y-1">
                  <li>Save the registration token securely</li>
                  <li>Generate an Ed25519 keypair for your agent</li>
                  <li>Call <code className="bg-blue-100 px-1 py-0.5 rounded">addAgentPublicKey</code> mutation with the token</li>
                  <li>Your agent can then authenticate using Ed25519 signatures</li>
                </ol>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
                I&apos;ve Saved the Token
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

