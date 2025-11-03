"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Key, Download, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FUNCTIONAL_TYPES = [
  { value: "general", label: "General Purpose" },
  { value: "voice", label: "Voice Agent" },
  { value: "chat", label: "Chat Agent" },
  { value: "coding", label: "Coding Agent" },
  { value: "data", label: "Data Agent" },
  { value: "api", label: "API Agent" },
  { value: "research", label: "Research Agent" },
  { value: "financial", label: "Financial Agent" },
  { value: "transaction", label: "Transaction Agent" },
  { value: "legal", label: "Legal Agent" },
  { value: "healthcare", label: "Healthcare Agent" },
  { value: "workflow", label: "Workflow Agent" },
]

export function CreateAgentDialog({
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const router = useRouter()
  
  // Registration state
  const [agentName, setAgentName] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [functionalType, setFunctionalType] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedKeyPair, setGeneratedKeyPair] = useState<{publicKey: string, privateKey: string} | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  
  // Get current user for manual registration
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )
  
  const registerAgentManual = useMutation(api.agents.registerAgentManual)
  
  const generateKeyPair = async () => {
    setIsGeneratingKey(true)
    setError(null)
    
    try {
      // Generate Ed25519 keypair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "Ed25519",
        } as EcKeyGenParams,
        true,
        ["sign", "verify"]
      )
      
      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey)
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`
      
      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`
      
      setGeneratedKeyPair({
        publicKey: publicKeyPem,
        privateKey: privateKeyPem
      })
      setPublicKey(publicKeyPem)
    } catch (err) {
      setError("Failed to generate key pair. Your browser may not support Ed25519.")
      console.error("Key generation error:", err)
    } finally {
      setIsGeneratingKey(false)
    }
  }
  
  const downloadPrivateKey = () => {
    if (!generatedKeyPair) return
    
    const blob = new Blob([generatedKeyPair.privateKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-private-key-${Date.now()}.pem`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const handleManualRegister = async () => {
    if (!currentUser || !publicKey.trim()) {
      setError("Please provide a public key")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await registerAgentManual({
        userId: currentUser._id,
        name: agentName.trim() || "Unnamed Agent",
        publicKey: publicKey.trim(),
        functionalType: functionalType as "general" | "voice" | "chat" | "coding" | "data" | "api" | "research" | "financial" | "transaction" | "legal" | "healthcare" | "workflow",
      })
      
      // Success - reset form and close
      setAgentName("")
      setPublicKey("")
      setFunctionalType("general")
      setGeneratedKeyPair(null)
      onOpenChange(false)
      
      // Refresh the page to show new agent
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || "Failed to register agent")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleClose = () => {
    setAgentName("")
    setPublicKey("")
    setFunctionalType("general")
    setGeneratedKeyPair(null)
    setError(null)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Register Agent</DialogTitle>
          <DialogDescription>
            Manually register an agent with a public key
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">
                Agent Name (Optional)
              </Label>
              <Input
                id="agentName"
                placeholder="My Production Agent"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate a name
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="publicKey">
                  Public Key (Ed25519) <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateKeyPair}
                  disabled={isGeneratingKey || isSubmitting}
                >
                  {isGeneratingKey ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3 mr-1" />
                      Generate Key Pair
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="publicKey"
                placeholder="Enter your agent's Ed25519 public key or generate one"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="font-mono text-xs"
              />
              {generatedKeyPair && (
                <div className="bg-accent border border-border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        Save Your Private Key!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Download and store your private key securely. You&apos;ll need it for agent authentication.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadPrivateKey}
                        className="mt-2"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Private Key
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {!generatedKeyPair && (
                <p className="text-xs text-muted-foreground">
                  Paste your agent&apos;s public key or generate a new key pair above
                </p>
              )}
            </div>
              
            <div className="space-y-2">
              <Label htmlFor="functionalType">
                Functional Type (Optional)
              </Label>
              <select
                id="functionalType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={functionalType}
                onChange={(e) => setFunctionalType(e.target.value)}
                disabled={isSubmitting}
              >
                {FUNCTIONAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleManualRegister}
              disabled={isSubmitting || !publicKey.trim()}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Agent
            </Button>
            <Button 
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
