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
import { Loader2, KeyRound, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAgentDialog({ open, onOpenChange }: CreateAgentDialogProps) {
  const [name, setName] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [generating, setGenerating] = useState(false)
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedPrivate, setCopiedPrivate] = useState(false)

  const currentUser = useQuery(api.users.getCurrentUser, {})
  const registerAgent = useMutation(api.agents.registerAgentManual)

  // Validate and normalize base64 public key: accept base64 or SSH .pub format
  const normalizePublicKey = (input: string): string | null => {
    const trimmed = input.trim()
    
    // Handle SSH .pub format: ssh-ed25519 <base64> <comment>
    if (trimmed.startsWith('ssh-ed25519')) {
      const parts = trimmed.split(/\s+/)
      if (parts.length >= 2) {
        const sshBase64 = parts[1]
        try {
          // Decode SSH format to extract raw Ed25519 key
          const decoded = atob(sshBase64)
          const bytes = new Uint8Array(decoded.length)
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i)
          }
          
          // SSH format: [4 bytes: key type len][key type][4 bytes: pubkey len][32 bytes: pubkey]
          // The last 32 bytes are the actual Ed25519 public key
          if (bytes.length >= 32) {
            const pubkeyBytes = bytes.slice(-32) // Last 32 bytes are the Ed25519 key
            return btoa(String.fromCharCode(...pubkeyBytes))
          }
        } catch (error) {
          console.error("Failed to parse SSH format:", error)
          return null
        }
      }
      return null
    }
    
    // Handle raw base64 (could be 32-byte key, SPKI format, or SSH format without prefix)
    // Try to decode and extract 32-byte Ed25519 key
    const base64Pattern = /^[A-Za-z0-9+/=]+$/
    if (base64Pattern.test(trimmed)) {
      try {
        const decoded = atob(trimmed)
        const bytes = new Uint8Array(decoded.length)
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i)
        }
        
        // If it's exactly 32 bytes, it's the raw key
        if (bytes.length === 32) {
          return trimmed // Already valid 32-byte base64
        }
        
        // If it's longer (SPKI format ~44 bytes, or SSH format ~51 bytes), extract last 32 bytes
        if (bytes.length >= 32) {
          const pubkeyBytes = bytes.slice(-32)
          return btoa(String.fromCharCode(...pubkeyBytes))
        }
        
        // Too short
        return null
      } catch (error) {
        console.error("Failed to decode base64:", error)
        return null
      }
    }
    
    return null // Invalid format
  }

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

      // Export public key as raw bytes (32 bytes for Ed25519)
      const publicKeyBytes = await crypto.subtle.exportKey("raw", keyPair.publicKey)
      const publicKeyArray = new Uint8Array(publicKeyBytes)
      
      // Convert to base64 for display and storage
      const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray))

      // Export private key as PKCS8 (for display, users should save this)
      const privateKeyBytes = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBytes)))

      setPublicKey(publicKeyBase64) // Display as base64
      setPrivateKey(privateKeyBase64) // Private key stays as base64 (PKCS8 format)
      
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

    // Validate and normalize base64 public key
    const normalizedKey = normalizePublicKey(publicKey)
    if (!normalizedKey) {
      toast.error("Invalid public key. Must be base64 or SSH .pub format (ssh-ed25519 ...)")
      return
    }

    try {
      const result = await registerAgent({
        userId: currentUser._id,
        name,
        publicKey: normalizedKey, // Base64 format (32 bytes)
        walletAddress,
        functionalType: "general", // Default to general
      })

      toast.success(`Agent registered: ${result.did}`)
      
      // Reset form
      setName("")
      setPublicKey("")
      setPrivateKey("")
      setWalletAddress("")
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
                placeholder="Paste base64 or SSH .pub file content"
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
            <p className="text-xs text-muted-foreground">
              Paste from ~/.ssh/id_ed25519.pub or enter base64 (43-44 characters)
            </p>
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

