"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { DisputeRow } from "@/components/registry/DisputeRow"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Scale, TrendingUp } from "lucide-react"

export default function PartyPage() {
  const params = useParams()
  const address = decodeURIComponent(params.address as string)
  
  const cases = useQuery(api.cases.getCasesByParty, { party: address })
  
  if (cases === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation currentPage="home" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const asPlaintiff = cases.filter(c => c.plaintiff === address)
  const asDefendant = cases.filter(c => c.defendant === address)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation currentPage="home" />
      
      {/* Party Header */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Party Details</h1>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-300 text-sm mb-2">Address</p>
            <p className="font-mono text-lg break-all">{address}</p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Total Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{cases.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                As Plaintiff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{asPlaintiff.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4 text-amber-600" />
                As Defendant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{asDefendant.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Cases as Plaintiff */}
        {asPlaintiff.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Cases as Plaintiff</h2>
              <Badge variant="secondary">{asPlaintiff.length}</Badge>
            </div>
            <div className="space-y-2">
              {asPlaintiff.map((case_) => (
                <DisputeRow
                  key={case_._id}
                  caseId={case_._id}
                  plaintiff={case_.plaintiff ?? 'Unknown'}
                  defendant={case_.defendant ?? 'Unknown'}
                  amount={case_.amount}
                  currency={case_.currency}
                  status={case_.status ?? 'FILED'}
                  filedAt={case_.filedAt ?? Date.now()}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cases as Defendant */}
        {asDefendant.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Cases as Defendant</h2>
              <Badge variant="secondary">{asDefendant.length}</Badge>
            </div>
            <div className="space-y-2">
              {asDefendant.map((case_) => (
                <DisputeRow
                  key={case_._id}
                  caseId={case_._id}
                  plaintiff={case_.plaintiff ?? 'Unknown'}
                  defendant={case_.defendant ?? 'Unknown'}
                  amount={case_.amount}
                  currency={case_.currency}
                  status={case_.status ?? 'FILED'}
                  filedAt={case_.filedAt ?? Date.now()}
                />
              ))}
            </div>
          </div>
        )}

        {cases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No disputes found for this address</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

