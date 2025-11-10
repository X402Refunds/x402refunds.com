"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Key, Download, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react"
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
  const [walletAddress, setWalletAddress] = useState("")
  const [functionalType, setFunctionalType] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedKeyPair, setGeneratedKeyPair] = useState<{publicKey: string, privateKey: string} | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [successData, setSuccessData] = useState<{disputeUrl: string, agentName: string} | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Validate Ethereum address format (client-side)
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim())
  }
  
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
  
  // Convert PEM format to base64 if needed
  const extractBase64FromPem = (pem: string): string => {
    // If it's already base64 (no PEM headers), return as-is
    if (!pem.includes('-----BEGIN')) {
      return pem.trim()
    }
    
    // Extract base64 content from PEM format
    const base64Match = pem.match(/-----BEGIN.*-----\s*([\s\S]*?)\s*-----END/i)
    if (base64Match && base64Match[1]) {
      // Remove whitespace and return base64 content
      return base64Match[1].replace(/\s/g, '')
    }
    
    // If no PEM format detected, return trimmed
    return pem.trim()
  }

  const handleManualRegister = async () => {
    if (!currentUser || !publicKey.trim()) {
      setError("Please provide a public key")
      return
    }
    
    if (!walletAddress.trim()) {
      setError("Please provide an Ethereum wallet address")
      return
    }
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(walletAddress)) {
      setError("Invalid Ethereum address format. Must be 0x followed by 40 hexadecimal characters (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0)")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Convert PEM to base64 if needed
      const publicKeyBase64 = extractBase64FromPem(publicKey)
      
      const result = await registerAgentManual({
        userId: currentUser._id,
        name: agentName.trim() || "Unnamed Agent",
        publicKey: publicKeyBase64,
        walletAddress: walletAddress.trim(),
        functionalType: functionalType as "general" | "voice" | "chat" | "coding" | "data" | "api" | "research" | "financial" | "transaction" | "legal" | "healthcare" | "workflow",
      })
      
      // Show success state with dispute URL
      setSuccessData({
        disputeUrl: result.disputeUrl,
        agentName: agentName.trim() || "Unnamed Agent"
      })
      
      // Refresh the page to show new agent
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || "Failed to register agent")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCopyDisputeUrl = async () => {
    if (!successData) return
    
    try {
      await navigator.clipboard.writeText(successData.disputeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = successData.disputeUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleSuccessClose = () => {
    // Reset everything and close
    setAgentName("")
    setPublicKey("")
    setWalletAddress("")
    setFunctionalType("general")
    setGeneratedKeyPair(null)
    setSuccessData(null)
    setError(null)
    setCopied(false)
    onOpenChange(false)
  }
  
  const handleClose = () => {
    // If showing success, reset and close
    if (successData) {
      handleSuccessClose()
      return
    }
    
    // Otherwise just reset and close
    setAgentName("")
    setPublicKey("")
    setWalletAddress("")
    setFunctionalType("general")
    setGeneratedKeyPair(null)
    setError(null)
    setSuccessData(null)
    setCopied(false)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {successData ? "Agent Registered Successfully!" : "Register Agent"}
          </DialogTitle>
          <DialogDescription>
            {successData 
              ? `Your agent "${successData.agentName}" has been registered.`
              : "Manually register an agent with a public key"
            }
          </DialogDescription>
        </DialogHeader>
        
        {successData ? (
          <div className="space-y-4 mt-4">
            <div className="bg-accent border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Dispute URL
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Share this URL with buyers so they can file disputes against your agent:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs font-mono break-all">
                      {successData.disputeUrl}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyDisputeUrl}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleSuccessClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
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
              <Label htmlFor="walletAddress">
                Ethereum Wallet Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="walletAddress"
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your agent&apos;s Ethereum wallet address (ERC-8004 identity). This will be used in dispute URLs.
              </p>
              {walletAddress && !isValidEthereumAddress(walletAddress) && (
                <p className="text-xs text-destructive">
                  Invalid format. Must be 0x followed by 40 hexadecimal characters.
                </p>
              )}
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
              disabled={isSubmitting || !publicKey.trim() || !walletAddress.trim() || !isValidEthereumAddress(walletAddress)}
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
        )}
      </DialogContent>
    </Dialog>
  )
}
