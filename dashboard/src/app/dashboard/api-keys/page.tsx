"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Key, Copy, Trash2, Plus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Id } from "@convex/_generated/dataModel"

export default function APIKeysPage() {
  const { user, isLoaded } = useUser()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyExpiresIn, setNewKeyExpiresIn] = useState<number | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  
  // Queries
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  const apiKeys = useQuery(
    api.apiKeys.listApiKeys,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  // Mutations
  const generateApiKey = useMutation(api.apiKeys.generateApiKey)
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey)
  
  const handleCreateKey = async () => {
    if (!currentUser || !newKeyName.trim()) return
    
    try {
      setIsCreating(true)
      const result = await generateApiKey({
        userId: currentUser._id,
        name: newKeyName.trim(),
        expiresIn: newKeyExpiresIn,
      })
      
      setGeneratedKey(result.key)
      setNewKeyName("")
      setNewKeyExpiresIn(undefined)
    } catch (error) {
      console.error("Failed to generate API key:", error)
      alert(`Failed to generate API key: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }
  
  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false)
    setGeneratedKey(null)
    setNewKeyName("")
    setNewKeyExpiresIn(undefined)
    setCopiedKey(false)
  }
  
  const handleRevokeKey = async (keyId: Id<"apiKeys">) => {
    if (!currentUser) return
    
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return
    }
    
    try {
      await revokeApiKey({
        keyId,
        userId: currentUser._id,
      })
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      alert(`Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  
  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Syncing user data...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
            <p className="text-slate-600 mt-1">
              Manage API keys for agent registration and authentication
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Key
          </Button>
        </div>
        
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 flex items-center gap-2">
              <Key className="h-4 w-4" />
              How API Keys Work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              API keys allow your agents to register autonomously. Include the key in the Authorization header:
            </p>
            <div className="bg-blue-100 p-3 rounded font-mono text-xs">
              Authorization: Bearer csk_live_...
            </div>
            <p className="text-xs">
              Keep your API keys secure. They provide full access to register agents under your organization.
            </p>
          </CardContent>
        </Card>
        
        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              {apiKeys?.length === 0 
                ? "No API keys yet. Generate one to get started." 
                : `${apiKeys?.length} API key${apiKeys?.length === 1 ? '' : 's'} total`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys && apiKeys.length > 0 ? (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key._id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{key.name}</span>
                        <Badge 
                          variant={key.status === "active" ? "default" : "secondary"}
                          className={key.status === "active" ? "bg-emerald-100 text-emerald-800" : ""}
                        >
                          {key.status}
                        </Badge>
                      </div>
                      <div className="font-mono text-xs text-slate-600 mb-1">
                        {key.keyPreview}
                      </div>
                      <div className="text-xs text-slate-500">
                        Created {formatDate(key.createdAt)}
                        {key.lastUsedAt && ` • Last used ${formatDate(key.lastUsedAt)}`}
                        {key.expiresAt && ` • Expires ${formatDate(key.expiresAt)}`}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {key.status === "active" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeKey(key._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Key className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No API keys yet</p>
                <p className="text-xs text-slate-400 mt-1">Generate your first key to start registering agents</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Create API Key Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={handleCloseCreateDialog}>
          <DialogContent className="sm:max-w-[550px]">
            {!generatedKey ? (
              // Creation Form
              <form onSubmit={(e) => { e.preventDefault(); handleCreateKey(); }}>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for agent registration. You&apos;ll only see the full key once.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="keyName">
                      Key Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="keyName"
                      placeholder="Production Key, CI/CD Key, etc."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-slate-600">
                      Give your key a descriptive name to identify it later
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="expiresIn">
                      Expiration (Optional)
                    </Label>
                    <select
                      id="expiresIn"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newKeyExpiresIn || ""}
                      onChange={(e) => setNewKeyExpiresIn(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                      <option value="">Never expires</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                    </select>
                    <p className="text-xs text-slate-600">
                      Set an expiration date for automatic key rotation
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseCreateDialog}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreating || !newKeyName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Key
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              // Success State - Show Generated Key
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    API Key Generated!
                  </DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You won&apos;t be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900">
                          Save Your API Key Now
                        </p>
                        <p className="text-xs text-yellow-800 mt-1">
                          This key will only be shown once and cannot be recovered. Store it securely!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={generatedKey} 
                        readOnly 
                        className="font-mono text-xs bg-slate-50"
                      />
                      <Button 
                        type="button"
                        onClick={handleCopyKey}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        {copiedKey ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Using Your API Key:
                    </p>
                    <div className="bg-blue-100 p-2 rounded font-mono text-xs text-blue-900">
                      curl -X POST https://api.consulate.io/agents/register \<br />
                      &nbsp;&nbsp;-H &quot;Authorization: Bearer {generatedKey.substring(0, 20)}...&quot; \<br />
                      &nbsp;&nbsp;-d &apos;{"{"}&quot;name&quot;: &quot;My Agent&quot;{"}"}&#39;
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    I&apos;ve Saved the Key
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

