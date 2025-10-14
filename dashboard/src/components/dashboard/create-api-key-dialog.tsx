"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  onKeyCreated: (keyData: { id: Id<"apiKeys">; token: string }) => void
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  userId,
  onKeyCreated,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState("")
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiryDays, setExpiryDays] = useState("90")
  const [error, setError] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  
  const createKey = useMutation(api.apiKeys.createUserApiKey)
  
  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your API key")
      return
    }
    
    setIsCreating(true)
    setError("")
    
    try {
      const expiresAt = hasExpiry 
        ? Date.now() + (parseInt(expiryDays) * 24 * 60 * 60 * 1000)
        : undefined
      
      const result = await createKey({
        userId,
        name: name.trim(),
        expiresAt,
        permissions: ["*"], // Full access for now
      })
      
      onKeyCreated(result)
      
      // Reset form
      setName("")
      setHasExpiry(false)
      setExpiryDays("90")
      setError("")
      
    } catch (err) {
      console.error("Failed to create API key:", err)
      setError(err instanceof Error ? err.message : "Failed to create API key")
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to Consulate APIs.
            You&apos;ll only be able to see the full key once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="key-name">
              Key Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="key-name"
              placeholder="e.g., Production, Development, CI/CD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-slate-500">
              Choose a descriptive name to identify where this key will be used
            </p>
          </div>
          
          {/* Expiry Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="has-expiry"
              checked={hasExpiry}
              onCheckedChange={(checked: boolean) => setHasExpiry(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="has-expiry"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set expiration date
              </Label>
              <p className="text-xs text-slate-500">
                Automatically expire this key after a set period
              </p>
            </div>
          </div>
          
          {/* Expiry Days Input */}
          {hasExpiry && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="expiry-days">Expires in (days)</Label>
              <Input
                id="expiry-days"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-32"
              />
            </div>
          )}
          
          {/* Permissions Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              This key will have <strong>full access</strong> to all API endpoints. 
              Keep it secure and never commit it to version control.
            </AlertDescription>
          </Alert>
          
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create API Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

