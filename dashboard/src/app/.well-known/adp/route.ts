import { NextResponse } from 'next/server';

/**
 * .well-known/adp endpoint - Agentic Dispute Protocol service discovery
 * Per ADP spec: https://github.com/consulatehq/agentic-dispute-protocol
 * IETF Draft: draft-kotecha-agentic-dispute-protocol
 */
export async function GET() {
  const manifest = {
    disputeService: "https://api.consulatehq.com/adp/v1",
    protocolVersion: "draft-01",
    supportedResolutionMethods: [
      "expert-determination",
      "arbitration",
      "mediation"
    ],
    supportedRules: [
      "Consulate-v1.0",
      "UNCITRAL-2021",
      "AAA-Commercial"
    ],
    supportedEvidenceTypes: [
      "SYSTEM_LOGS",
      "CONTRACTS",
      "COMMUNICATIONS",
      "FINANCIAL",
      "EXPERT"
    ],
    maxClaimValue: 10000000,
    supportedCurrencies: [
      "USD",
      "EUR",
      "GBP",
      "ETH",
      "BTC"
    ],
    features: {
      chainOfCustody: true,
      dualFormatAwards: true,
      neutralDiscovery: true,
      aiNeutrals: true,
      humanNeutrals: false,
      confidentialResolution: true,
      smartContractEnforcement: false
    },
    endpoints: {
      disputes: "/disputes",
      evidence: "/evidence",
      custody: "/api/custody/{caseId}",
      neutrals: "/.well-known/adp/neutrals"
    },
    publicKeyEndpoint: "/.well-known/jwks.json",
    pricingTiers: [
      "micro",
      "smb",
      "enterprise"
    ],
    termsOfService: "https://consulatehq.com/terms",
    privacyPolicy: "https://consulatehq.com/privacy",
    documentation: "https://consulatehq.com/docs",
    standards: {
      disputeRules: "/api/standards/arbitration-rules",
      evidenceFormat: "/docs/standards/evidence-format-specification",
      codeOfEthics: "/docs/standards/code-of-ethics-ai-arbitrators"
    },
    protocol: {
      name: "Agentic Dispute Protocol",
      version: "draft-01",
      ietfDraft: "draft-kotecha-agentic-dispute-protocol",
      repository: "https://github.com/consulatehq/agentic-dispute-protocol"
    },
    contact: {
      email: "support@consulatehq.com",
      support: "https://consulatehq.com/support",
      documentation: "https://consulatehq.com/docs"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

