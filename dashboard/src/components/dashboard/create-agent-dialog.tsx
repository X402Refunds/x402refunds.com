"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Loader2, AlertCircle, CheckCircle2, Copy } from "lucide-react"

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
  // Registration state
  const [agentName, setAgentName] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [functionalType, setFunctionalType] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{walletAddress: string, agentName: string, claimMessage: string} | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Validate Ethereum address format (client-side)
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim())
  }
  
  const createUnclaimedAgent = useMutation(api.agents.createUnclaimedAgent)
  
  const handleManualRegister = async () => {
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
      const normalizedWallet = walletAddress.trim().toLowerCase()
      
      // Create unclaimed agent (will be claimed later with wallet signature)
      await createUnclaimedAgent({
        walletAddress: normalizedWallet,
        name: agentName.trim() || undefined,
        endpoint: undefined,
      })
      
      // Show success state with claim instructions
      const claimMessage = `I claim agent ${normalizedWallet} on x402disputes.com`
      setSuccessData({
        walletAddress: normalizedWallet,
        agentName: agentName.trim() || "Unnamed Agent",
        claimMessage: claimMessage
      })
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || "Failed to create agent")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCopyClaimMessage = async () => {
    if (!successData) return
    
    try {
      await navigator.clipboard.writeText(successData.claimMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = successData.claimMessage
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
    setWalletAddress("")
    setFunctionalType("general")
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
    setWalletAddress("")
    setFunctionalType("general")
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
            {successData ? "Agent Created - Claim with Wallet Signature" : "Create Agent"}
          </DialogTitle>
          <DialogDescription>
            {successData 
              ? `Your agent "${successData.agentName}" has been created as unclaimed. Claim it with your wallet signature.`
              : "Create an unclaimed agent that you can claim later with wallet signature"
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
                    Wallet Address
                  </p>
                  <code className="text-xs font-mono bg-background border border-border rounded px-3 py-2 block mb-3 break-all">
                    {successData.walletAddress}
                  </code>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Claim Message
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sign this message with your wallet to claim ownership:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-xs font-mono break-all">
                      {successData.claimMessage}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyClaimMessage}
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
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Next Steps
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Connect your wallet (must match the wallet address above)</li>
                    <li>Sign the claim message using your wallet</li>
                    <li>Submit the signature to claim the agent</li>
                    <li>Visit the Unclaimed Agents page to complete the claim process</li>
                  </ol>
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
              disabled={isSubmitting || !walletAddress.trim() || !isValidEthereumAddress(walletAddress)}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agent
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
