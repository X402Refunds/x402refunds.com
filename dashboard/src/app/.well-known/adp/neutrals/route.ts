import { NextResponse } from 'next/server';

/**
 * .well-known/adp/neutrals endpoint - Neutral discovery per ADP spec
 * Returns available neutrals (experts, arbitrators, mediators) and their capabilities
 */
export async function GET() {
  const neutrals = {
    neutrals: [
      {
        id: "expert-panel-ai-001",
        name: "Consulate AI Expert Panel",
        type: "ai",
        resolutionMethod: "expert-determination",
        model: {
          provider: "openai",
          name: "gpt-4",
          version: "turbo"
        },
        specialization: [
          "SLA_BREACH",
          "CONTRACT_DISPUTE",
          "PERFORMANCE_ISSUE"
        ],
        languages: ["en"],
        availability: "24/7",
        avgResponseTime: "< 5 minutes",
        caseLoad: "unlimited",
        rulingFormat: ["json", "pdf"],
        qualifications: [
          "AI Ethics Board Certified",
          "Expert Determination Qualified",
          "Commercial Dispute Resolution Trained"
        ],
        biasAudit: {
          lastAudit: "2025-01-15",
          auditedBy: "Independent AI Auditors Inc.",
          report: "https://x402disputes.com/audits/bias-2025-q1.pdf",
          score: 98.5
        },
        fees: {
          filing: 100,
          perHour: 0,
          award: "5% of claim value",
          currency: "USD"
        },
        contact: {
          email: "disputes@x402disputes.com",
          endpoint: "https://api.x402disputes.com"
        }
      }
    ],
    meta: {
      totalNeutrals: 1,
      lastUpdated: new Date().toISOString(),
      service: "Consulate",
      protocolVersion: "draft-01",
      protocol: "Agentic Dispute Protocol (ADP)"
    }
  };

  return NextResponse.json(neutrals, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

