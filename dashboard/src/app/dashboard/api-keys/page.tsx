"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Copy, Ban, Plus, CheckCircle2, AlertCircle, Loader2, Pencil } from "lucide-react"
import { Id } from "@convex/_generated/dataModel"
import { Checkbox } from "@/components/ui/checkbox"

export default function APIKeysPage() {
  const { user, isLoaded } = useUser()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyExpiresIn, setNewKeyExpiresIn] = useState<number | undefined>()
  const [isCreating, setIsCreating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingKeyId, setEditingKeyId] = useState<Id<"apiKeys"> | null>(null)
  const [editingKeyName, setEditingKeyName] = useState("")
  const [showRevokedKeys, setShowRevokedKeys] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<{ id: Id<"apiKeys">; name: string } | null>(null)
  
  // Queries
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  const allApiKeys = useQuery(
    api.apiKeys.listApiKeys,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  // Filter API keys based on revoked status
  const apiKeys = allApiKeys?.filter(key => 
    showRevokedKeys ? true : key.status !== "revoked"
  )
  
  // Mutations
  const generateApiKey = useMutation(api.apiKeys.generateApiKey)
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey)
  const updateApiKeyName = useMutation(api.apiKeys.updateApiKeyName)
  
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
  
  const handleCopyKey = (key: string, id?: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(true)
    if (id) setCopiedId(id)
    setTimeout(() => {
      setCopiedKey(false)
      setCopiedId(null)
    }, 2000)
  }
  
  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false)
    setGeneratedKey(null)
    setNewKeyName("")
    setNewKeyExpiresIn(undefined)
    setCopiedKey(false)
  }
  
  const handleRevokeClick = (keyId: Id<"apiKeys">, keyName: string) => {
    setKeyToRevoke({ id: keyId, name: keyName })
    setRevokeDialogOpen(true)
  }

  const handleRevokeConfirm = async () => {
    if (!currentUser || !keyToRevoke) return
    
    try {
      await revokeApiKey({
        keyId: keyToRevoke.id,
        userId: currentUser._id,
      })
      
      setRevokeDialogOpen(false)
      setKeyToRevoke(null)
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      alert(`Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  const handleStartEdit = (keyId: Id<"apiKeys">, currentName: string) => {
    setEditingKeyId(keyId)
    setEditingKeyName(currentName)
  }
  
  const handleSaveEdit = async (keyId: Id<"apiKeys">) => {
    if (!currentUser || !editingKeyName.trim()) {
      setEditingKeyId(null)
      return
    }
    
    try {
      await updateApiKeyName({
        keyId,
        name: editingKeyName.trim(),
        userId: currentUser._id,
      })
      setEditingKeyId(null)
    } catch (error) {
      console.error("Failed to update API key name:", error)
      alert(`Failed to update name: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  const handleCancelEdit = () => {
    setEditingKeyId(null)
    setEditingKeyName("")
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
  
  // Example full API key for the info card
  const exampleApiKey = "csk_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z"
  
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
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Key
          </Button>
        </div>
        
        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>
                  {apiKeys?.length === 0 
                    ? "No API keys yet. Generate one to get started." 
                    : `${apiKeys?.length} API key${apiKeys?.length === 1 ? '' : 's'} shown` +
                      (allApiKeys ? ` (${allApiKeys.filter(k => k.status === "active").length} active, ${allApiKeys.filter(k => k.status === "revoked").length} revoked)` : '')
                  }
                </CardDescription>
              </div>
              {allApiKeys && allApiKeys.some(k => k.status === "revoked") && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-revoked" 
                    checked={showRevokedKeys}
                    onCheckedChange={(checked) => setShowRevokedKeys(checked === true)}
                  />
                  <label
                    htmlFor="show-revoked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Show revoked keys
                  </label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys && apiKeys.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / Environment</TableHead>
                      <TableHead>Key Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key._id}>
                        <TableCell className="font-medium">
                          {editingKeyId === key._id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingKeyName}
                                onChange={(e) => setEditingKeyName(e.target.value)}
                                className="h-8 max-w-[200px]"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(key._id)
                                  if (e.key === "Escape") handleCancelEdit()
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(key._id)}
                                className="h-8 px-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{key.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(key._id, key.name)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <code className="text-xs font-mono text-slate-600">
                              {key.keyPreview}
                            </code>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Full key only shown at creation
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {key.status === "revoked" ? (
                            <Badge 
                              variant="secondary"
                              className="bg-red-100 text-red-800 border-red-200"
                            >
                              REVOKED
                            </Badge>
                          ) : (
                            <Badge 
                              variant="default"
                              className="bg-emerald-100 text-emerald-800 border-emerald-200"
                            >
                              ACTIVE
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {key.createdAt ? formatDate(key.createdAt) : "Unknown"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right min-w-[120px]">
                          <div className="flex justify-end gap-2">
                            {key.status !== "revoked" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeClick(key._id, key.name)}
                                title="Revoke this key (stops authentication, preserves audit trail)"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Revoke
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Audit trail preserved
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        
        {/* Info Card - Moved below API Keys table */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900 flex items-center gap-2">
              <Key className="h-4 w-4" />
              How API Keys Work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-3">
            <p>
              API keys allow your agents to register autonomously. Include the key in the Authorization header:
            </p>
            <div className="flex gap-2 items-center">
              <div className="bg-blue-100 p-3 rounded font-mono text-xs flex-1 overflow-x-auto">
                Authorization: Bearer {exampleApiKey}
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleCopyKey(exampleApiKey)}
                className="shrink-0 border-blue-300 hover:bg-blue-100"
              >
                {copiedKey && copiedId === null ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs">
              Keep your API keys secure. They provide full access to register agents under your organization.
            </p>
          </CardContent>
        </Card>
        
        {/* Create API Key Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={handleCloseCreateDialog}>
          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900">
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
                    className="bg-slate-900 hover:bg-slate-800 text-white"
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
                        onClick={() => handleCopyKey(generatedKey)}
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
                    <div className="bg-blue-100 p-2 rounded font-mono text-xs text-blue-900 break-all">
                      curl -X POST https://api.consulate.io/agents/register \<br />
                      &nbsp;&nbsp;-H &quot;Authorization: Bearer {generatedKey.substring(0, 20)}...&quot; \<br />
                      &nbsp;&nbsp;-d &apos;{"{"}&quot;name&quot;: &quot;My Agent&quot;{"}"}&#39;
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    I&apos;ve Saved the Key
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation Modal */}
        <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <AlertDialogContent className="bg-white dark:bg-slate-900">
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  You&apos;re about to revoke <span className="font-semibold text-slate-900 dark:text-slate-100">&quot;{keyToRevoke?.name}&quot;</span>
                </p>
                <p>
                  This will immediately stop all authentication with this key. The key cannot be reactivated, but audit trails will be preserved for compliance.
                </p>
                <p className="font-semibold text-red-600">
                  This action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevokeConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Revoke Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
