"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, KeyRound, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FUNCTIONAL_TYPES = [
  { value: "api", label: "API" },
  { value: "financial", label: "Financial" },
  { value: "general", label: "General" },
]

export function CreateAgentDialog({ open, onOpenChange }: CreateAgentDialogProps) {
  const [name, setName] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [functionalType, setFunctionalType] = useState("api")
  const [generating, setGenerating] = useState(false)
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedPrivate, setCopiedPrivate] = useState(false)

  const currentUser = useQuery(api.users.getCurrentUser, {})
  const registerAgent = useMutation(api.agents.registerAgentManual)

  const generateKeyPair = async () => {
    try {
      setGenerating(true)
      
      // Generate Ed25519 key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "Ed25519",
          namedCurve: "Ed25519",
        } as EcKeyGenParams,
        true,
        ["sign", "verify"]
      )

      // Export public key as raw bytes
      const publicKeyBytes = await crypto.subtle.exportKey("raw", keyPair.publicKey)
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBytes)))

      // Export private key as PKCS8
      const privateKeyBytes = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBytes)))

      setPublicKey(publicKeyBase64)
      setPrivateKey(privateKeyBase64)
      
      toast.success("Key pair generated successfully")
    } catch (error) {
      console.error("Key generation failed:", error)
      toast.error("Failed to generate key pair. Your browser may not support Ed25519.")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser?._id) {
      toast.error("User not found")
      return
    }

    if (!name || !publicKey || !walletAddress) {
      toast.error("Name, Public Key, and Wallet Address are required")
      return
    }

    try {
      const result = await registerAgent({
        userId: currentUser._id,
        name,
        publicKey,
        walletAddress,
        functionalType: functionalType as "api" | "financial" | "general",
      })

      toast.success(`Agent registered: ${result.did}`)
      
      // Reset form
      setName("")
      setPublicKey("")
      setPrivateKey("")
      setWalletAddress("")
      setFunctionalType("api")
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`Registration failed: ${message}`)
    }
  }

  const copyToClipboard = (text: string, type: "public" | "private") => {
    navigator.clipboard.writeText(text)
    if (type === "public") {
      setCopiedPublic(true)
      setTimeout(() => setCopiedPublic(false), 2000)
    } else {
      setCopiedPrivate(true)
      setTimeout(() => setCopiedPrivate(false), 2000)
    }
    toast.success(`${type === "public" ? "Public" : "Private"} key copied`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Agent</DialogTitle>
          <DialogDescription>
            Register a new AI agent for your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Agent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="functionalType">Functional Type</Label>
            <Select value={functionalType} onValueChange={setFunctionalType}>
              <SelectTrigger className="w-full">
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="publicKey">Public Key (Ed25519)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateKeyPair}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-3 w-3 mr-1" />
                    Generate Key Pair
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                id="publicKey"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Base64-encoded public key"
                required
                className="font-mono text-xs"
              />
              {publicKey && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(publicKey, "public")}
                >
                  {copiedPublic ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {privateKey && (
            <div className="space-y-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-center justify-between">
                <Label htmlFor="privateKey" className="text-yellow-800 dark:text-yellow-200">
                  Private Key (Save This!)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(privateKey, "private")}
                >
                  {copiedPrivate ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Input
                id="privateKey"
                value={privateKey}
                readOnly
                className="font-mono text-xs bg-white dark:bg-slate-900"
              />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                ⚠️ Save this private key securely. You&apos;ll need it to sign evidence and disputes.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="walletAddress">Wallet Address</Label>
            <Input
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              required
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Ethereum address for on-chain dispute tracking
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Agent</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

