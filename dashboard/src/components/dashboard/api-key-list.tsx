"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, User, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ApiKey {
  _id: Id<"apiKeys">
  name?: string
  tokenPreview: string
  creatorName: string
  permissions: string[]
  createdAt: number
  lastUsed?: number
  expiresAt?: number
}

interface ApiKeyListProps {
  apiKeys: ApiKey[]
  userId?: Id<"users">
}

export function ApiKeyList({ apiKeys, userId }: ApiKeyListProps) {
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null)
  const revokeKey = useMutation(api.apiKeys.revokeUserApiKey)
  
  const handleRevoke = async () => {
    if (!keyToRevoke || !userId) return
    
    try {
      await revokeKey({
        userId,
        apiKeyId: keyToRevoke._id,
      })
      setKeyToRevoke(null)
    } catch (error) {
      console.error("Failed to revoke key:", error)
      alert("Failed to revoke API key. Please try again.")
    }
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }
  
  const isExpired = (expiresAt?: number) => {
    if (!expiresAt) return false
    return Date.now() > expiresAt
  }
  
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    {apiKey.name || "Unnamed Key"}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {apiKey.tokenPreview}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{formatDate(apiKey.createdAt)}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {apiKey.creatorName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {apiKey.lastUsed ? (
                    <span className="text-sm text-slate-600">
                      {formatDistanceToNow(apiKey.lastUsed, { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.includes("*") ? (
                      <Badge variant="secondary" className="text-xs">
                        Full Access
                      </Badge>
                    ) : (
                      apiKey.permissions.slice(0, 2).map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))
                    )}
                    {apiKey.permissions.length > 2 && !apiKey.permissions.includes("*") && (
                      <Badge variant="outline" className="text-xs">
                        +{apiKey.permissions.length - 2}
                      </Badge>
                    )}
                  </div>
                  {isExpired(apiKey.expiresAt) && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Expired
                    </Badge>
                  )}
                  {apiKey.expiresAt && !isExpired(apiKey.expiresAt) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      Expires {formatDate(apiKey.expiresAt)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setKeyToRevoke(apiKey)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke the API key <strong>{keyToRevoke?.name || "Unnamed Key"}</strong>. 
              Any applications using this key will no longer be able to access the API.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

