"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Key, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAgentDialog({
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const router = useRouter()
  
  const handleGoToAPIKeys = () => {
    onOpenChange(false)
    router.push("/dashboard/api-keys")
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-600" />
            Register Agents with API Keys
          </DialogTitle>
          <DialogDescription>
            Agents register autonomously using your organization&apos;s API key. 
            No manual registration needed!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* How It Works */}
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
          
          {/* Code Example */}
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
          
          {/* SDK Example */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">
              Or Use the SDK:
            </p>
            <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-100 overflow-x-auto">
              <div className="text-green-400">const</div> Consulate = <div className="text-green-400 inline">require</div>(&apos;@consulate/sdk&apos;)<br /><br />
              
              <div className="text-green-400">const</div> consulate = <div className="text-green-400 inline">new</div> Consulate(process.env.CONSULATE_API_KEY)<br />
              <div className="text-green-400">const</div> agent = <div className="text-green-400 inline">await</div> consulate.agents.register({"{"}<br />
              <div className="ml-4">name: &quot;My Agent&quot;,</div>
              <div className="ml-4">functionalType: &quot;api&quot;</div>
              {"}"})<br /><br />
              
              console.log(agent.did) <span className="text-slate-400">&#47;&#47; did:agent:...</span>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleGoToAPIKeys}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Go to API Keys
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

