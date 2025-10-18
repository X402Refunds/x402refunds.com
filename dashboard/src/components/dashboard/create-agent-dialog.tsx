"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Key, ExternalLink, UserPlus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  { value: "legal", label: "Legal Agent" },
  { value: "healthcare", label: "Healthcare Agent" },
  { value: "workflow", label: "Workflow Agent" },
]

export function CreateAgentDialog({
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const router = useRouter()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("automatic")
  
  // Manual registration state
  const [agentName, setAgentName] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [functionalType, setFunctionalType] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get current user for manual registration
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  const registerAgentManual = useMutation(api.agents.registerAgentManual)
  
  const handleGoToAPIKeys = () => {
    onOpenChange(false)
    router.push("/dashboard/api-keys")
  }
  
  const handleManualRegister = async () => {
    if (!currentUser || !agentName.trim() || !publicKey.trim()) {
      setError("Please fill in all required fields")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await registerAgentManual({
        userId: currentUser._id,
        name: agentName.trim(),
        publicKey: publicKey.trim(),
        functionalType: functionalType as "general" | "voice" | "chat" | "coding" | "data" | "api" | "research" | "financial" | "legal" | "healthcare" | "workflow",
      })
      
      // Success - reset form and close
      setAgentName("")
      setPublicKey("")
      setFunctionalType("general")
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
    setError(null)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Register Agent</DialogTitle>
          <DialogDescription>
            Choose how you want to register your agent
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatic">
              <Key className="h-4 w-4 mr-2" />
              Automatic
            </TabsTrigger>
            <TabsTrigger value="manual">
              <UserPlus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>
          
          {/* Automatic Registration Tab */}
          <TabsContent value="automatic" className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                How It Works:
              </p>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Generate an API key in the API Keys section</li>
                <li>Add the key to your agent&apos;s environment variables</li>
                <li>Your agent registers itself automatically on first run</li>
              </ol>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">
                Example: Register Agent via API
              </p>
              <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-100 overflow-x-auto">
                <div className="text-slate-400"># Set your API key</div>
                <div className="mb-2">export CONSULATE_API_KEY=&quot;csk_live_...&quot;</div>
                
                <div className="text-slate-400 mt-4"># Register agent</div>
                <div>curl -X POST https://api.consulate.io/agents/register \</div>
                <div className="ml-4">-H &quot;Authorization: Bearer $CONSULATE_API_KEY&quot; \</div>
                <div className="ml-4">-H &quot;Content-Type: application/json&quot; \</div>
                <div className="ml-4">-d &apos;{"{"}
                  &quot;name&quot;: &quot;My Agent&quot;,
                  &quot;functionalType&quot;: &quot;api&quot;
                {"}"}&#39;</div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleGoToAPIKeys}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
              >
                Go to API Keys
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </TabsContent>
          
          {/* Manual Registration Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">
                  Agent Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="agentName"
                  placeholder="My Production Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publicKey">
                  Public Key (Ed25519) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="publicKey"
                  placeholder="Enter your agent's Ed25519 public key"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-slate-600">
                  Paste the public key that your agent will use for authentication
                </p>
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleManualRegister}
                disabled={isSubmitting || !agentName.trim() || !publicKey.trim()}
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
