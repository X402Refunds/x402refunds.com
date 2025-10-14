"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Key, Shield } from "lucide-react"
import { ApiKeyList } from "@/components/dashboard/api-key-list"
import { CreateApiKeyDialog } from "@/components/dashboard/create-api-key-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ApiKeysPage() {
  const { user, isLoaded } = useUser()
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; token: string } | null>(null)
  
  // Sync user on page load
  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(
    api.users.getCurrentUser, 
    user ? { clerkUserId: user.id } : "skip"
  )
  
  const organization = useQuery(
    api.users.getUserOrganization,
    currentUser ? { userId: currentUser._id } : "skip"
  )
  
  // Sync user if not exists
  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      syncUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((error) => {
        console.error("Failed to sync user:", error)
      })
    }
  }, [user, isLoaded, currentUser, syncUser])
  
  const apiKeys = useQuery(
    api.apiKeys.listUserApiKeys,
    currentUser ? { userId: currentUser._id } : "skip"
  )
  
  // Handle successful key creation
  const handleKeyCreated = (keyData: { id: string; token: string }) => {
    setNewlyCreatedKey(keyData)
    setShowNewKeyDialog(false)
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
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">API Keys</h1>
            <p className="text-slate-600 mt-1">
              Manage API keys for your organization
              {organization && ` (${organization.name})`}
            </p>
          </div>
          <Button 
            onClick={() => setShowNewKeyDialog(true)}
            disabled={!currentUser}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>
        
        {/* New Key Alert (shown once after creation) */}
        {newlyCreatedKey && (
          <Alert className="bg-green-50 border-green-200">
            <Key className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2">
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-green-900">API Key Created Successfully!</p>
                <p className="text-sm text-green-800">
                  Make sure to copy your API key now. You won&apos;t be able to see it again.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-slate-900 select-all">
                    {newlyCreatedKey.token}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKey.token)
                    }}
                    className="border-green-300 hover:bg-green-100"
                  >
                    Copy
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewlyCreatedKey(null)}
                  className="self-end text-green-700 hover:text-green-900"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <CardTitle className="text-base text-blue-900">Secure API Access</CardTitle>
                <CardDescription className="text-blue-700">
                  API keys provide programmatic access to Consulate&apos;s dispute resolution APIs. 
                  Keep your keys secure and never share them publicly.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Active API Keys</CardTitle>
            <CardDescription>
              {apiKeys === undefined 
                ? "Loading..." 
                : apiKeys.length === 0
                ? "No API keys yet. Create one to get started."
                : `You have ${apiKeys.length} active API key${apiKeys.length !== 1 ? 's' : ''}.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys === undefined ? (
              <div className="text-center py-8 text-slate-600">
                Loading API keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No API keys yet</p>
                <Button 
                  onClick={() => setShowNewKeyDialog(true)}
                  variant="outline"
                  disabled={!currentUser}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First API Key
                </Button>
              </div>
            ) : (
              <ApiKeyList 
                apiKeys={apiKeys} 
                userId={currentUser?._id}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Documentation</CardTitle>
            <CardDescription>
              Learn how to use your API keys to integrate with Consulate&apos;s dispute resolution platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/api-overview" target="_blank" rel="noopener noreferrer">
                  View API Docs
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/agent-integration-guide" target="_blank" rel="noopener noreferrer">
                  Integration Guide
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create API Key Dialog */}
      {currentUser && (
        <CreateApiKeyDialog
          open={showNewKeyDialog}
          onOpenChange={setShowNewKeyDialog}
          userId={currentUser._id}
          onKeyCreated={handleKeyCreated}
        />
      )}
    </DashboardLayout>
  )
}

