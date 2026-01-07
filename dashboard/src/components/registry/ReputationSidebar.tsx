"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"

export function ReputationSidebar() {
  const topAgents = useQuery(api.agents.getTopAgentsByReputation, { limit: 10 })
  const router = useRouter()

  if (topAgents === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Top Merchants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-4">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!topAgents || !Array.isArray(topAgents)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Top Merchants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-4">
            Unable to load reputation data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          Top Merchants
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAgents.map((agent: typeof topAgents[number], index: number) => {
            const formatAddress = (agentDid: string | null | undefined, walletAddress: string | null | undefined) => {
              // Prefer wallet address if available
              if (walletAddress?.startsWith('0x')) {
                return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              }
              
              // Fall back to formatting DID
              if (!agentDid) return 'Unknown'
              
              // Extract meaningful part from DID
              // Format: did:agent:consulatehq-com-1762761761424 -> consulatehq.com
              if (agentDid.includes(':')) {
                const parts = agentDid.split(':')
                const lastPart = parts[parts.length - 1]
                
                // If it looks like a domain with timestamp, extract just domain
                if (lastPart.includes('-') && /\d{13}/.test(lastPart)) {
                  const domainPart = lastPart.split('-').slice(0, -1).join('-')
                  // Convert consulatehq-com to consulatehq.com
                  return domainPart.replace(/-/g, '.').substring(0, 20)
                }
                
                // Otherwise show shortened last part
                return lastPart.length > 20 ? `${lastPart.substring(0, 17)}...` : lastPart
              }
              
              return agentDid.length > 20 ? `${agentDid.substring(0, 17)}...` : agentDid
            }

            const getScoreColor = (score: number) => {
              if (score >= 700) return 'text-blue-600'
              if (score >= 500) return 'text-amber-600'
              return 'text-red-600'
            }

            const getTrendIcon = (score: number) => {
              if (score >= 700) return <TrendingUp className="h-3 w-3 text-blue-600" />
              if (score >= 500) return <TrendingUp className="h-3 w-3 text-amber-600" />
              return <TrendingDown className="h-3 w-3 text-red-600" />
            }

            return (
              <div
                key={agent._id || index}
                onClick={() => {
                  const agentId = agent.walletAddress || agent.agentDid
                  if (agentId) router.push(`/agents/${agentId}`)
                }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-mono font-medium text-slate-900">
                      {formatAddress(agent.agentDid, agent.walletAddress)}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      Score: <span className={`font-bold ${getScoreColor(agent.reputationScore ?? 0)}`}>
                        {agent.reputationScore ?? 0}
                      </span>
                      {getTrendIcon(agent.reputationScore ?? 0)}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {agent.casesAsDefendant ?? 0} disputes
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

