"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface DisputeRowProps {
  caseId: string
  plaintiff: string
  defendant: string
  amount?: number
  currency?: string
  status: string
  filedAt: number
}

export function DisputeRow({
  caseId,
  plaintiff,
  defendant,
  amount,
  currency = "USD",
  status,
  filedAt
}: DisputeRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const router = useRouter()

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatAddress = (address: string) => {
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    if (address.includes(':')) {
      const parts = address.split(':')
      return parts[parts.length - 1]
    }
    return address.length > 20 ? `${address.slice(0, 20)}...` : address
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FILED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ANALYZED': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'AUTORULED': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_REVIEW': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'DECIDED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'CLOSED': return 'bg-slate-100 text-slate-800 border-slate-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <Card 
      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-slate-200"
      onClick={() => router.push(`/cases/${caseId}`)}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Case ID */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-sm font-mono text-slate-900 font-medium">
            #{caseId.slice(0, 8)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyToClipboard(caseId, 'caseId')
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {copiedField === 'caseId' ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Parties */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyToClipboard(plaintiff, 'plaintiff')
            }}
            className="text-sm font-mono text-slate-600 hover:text-slate-900 transition-colors truncate"
          >
            {formatAddress(plaintiff)}
          </button>
          <span className="text-slate-400">→</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              copyToClipboard(defendant, 'defendant')
            }}
            className="text-sm font-mono text-slate-600 hover:text-slate-900 transition-colors truncate"
          >
            {formatAddress(defendant)}
          </button>
        </div>

        {/* Amount */}
        {amount !== undefined && (
          <div className="text-sm font-medium text-slate-900 min-w-[80px] text-right">
            ${amount.toFixed(2)} {currency}
          </div>
        )}

        {/* Status */}
        <Badge className={`${getStatusColor(status)} min-w-[100px] justify-center`}>
          {status.replace('_', ' ')}
        </Badge>

        {/* Timestamp */}
        <div className="text-xs text-slate-500 min-w-[80px] text-right">
          {formatDistanceToNow(filedAt, { addSuffix: true })}
        </div>

        {/* Link icon */}
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </div>
    </Card>
  )
}

