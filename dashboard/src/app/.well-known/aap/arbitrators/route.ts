import { NextResponse } from 'next/server';

/**
 * .well-known/aap/arbitrators endpoint - Arbitrator discovery per AAP spec
 * Returns available arbitrators and their capabilities
 */
export async function GET() {
  const arbitrators = {
    arbitrators: [
      {
        id: "judge-panel-ai-001",
        name: "Consulate AI Judge Panel",
        type: "ai",
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
          "Commercial Arbitration Trained"
        ],
        biasAudit: {
          lastAudit: "2025-01-15",
          auditedBy: "Independent AI Auditors Inc.",
          report: "https://consulatehq.com/audits/bias-2025-q1.pdf",
          score: 98.5
        },
        fees: {
          filing: 100,
          perHour: 0,
          award: "5% of claim value",
          currency: "USD"
        },
        contact: {
          email: "arbitration@consulatehq.com",
          endpoint: "https://perceptive-lyrebird-89.convex.site"
        }
      }
    ],
    meta: {
      totalArbitrators: 1,
      lastUpdated: new Date().toISOString(),
      service: "Consulate",
      protocolVersion: "1.0"
    }
  };

  return NextResponse.json(arbitrators, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

