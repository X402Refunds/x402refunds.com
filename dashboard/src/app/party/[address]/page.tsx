"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { DisputeRow } from "@/components/registry/DisputeRow"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Container, Section } from "@/components/layout"
import { Loader2, User, Scale, TrendingUp } from "lucide-react"

// NOTE: Avoid importing Convex generated `api` types here; TS can hit "excessively deep" instantiation.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require("@convex/_generated/api").api

type PartyCaseRow = {
  _id: string
  plaintiff?: string | null
  defendant?: string | null
  amount?: number | null
  currency?: string | null
  status?: string | null
  filedAt?: number | null
}

export default function PartyPage() {
  const params = useParams()
  const address = decodeURIComponent(params.address as string)
  
  // NOTE: Convex `useQuery` inference can trigger TS "excessively deep" instantiation on some routes.
  // We only need a small subset of fields here, so we keep the type local and explicit.
  const cases = useQuery(api.cases.getCasesByParty, { party: address }) as
    | PartyCaseRow[]
    | undefined
  
  if (cases === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation currentPage="home" />
        <main>
          <Container className="py-12">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    )
  }

  const asPlaintiff = cases.filter((c: { plaintiff?: string | null }) => c.plaintiff === address)
  const asDefendant = cases.filter((c: { defendant?: string | null }) => c.defendant === address)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation currentPage="home" />
      
      {/* Party Header */}
      <Section spacing="tight" className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Party Details</h1>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-slate-300 text-sm mb-2">Address</p>
          <p className="font-mono text-lg break-all">{address}</p>
        </div>
      </Section>

      {/* Stats Overview */}
      <section>
        <Container className="py-12 sm:py-16">
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
                <TrendingUp className="h-4 w-4 text-blue-600" />
                As Plaintiff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{asPlaintiff.length}</div>
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
                  amount={case_.amount ?? undefined}
                  currency={case_.currency ?? undefined}
                  status={case_.status ?? 'FILED'}
                  filedAt={case_.filedAt ?? 0}
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
                  amount={case_.amount ?? undefined}
                  currency={case_.currency ?? undefined}
                  status={case_.status ?? 'FILED'}
                  filedAt={case_.filedAt ?? 0}
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
        </Container>
      </section>

      <Footer />
    </div>
  )
}

