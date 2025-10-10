import { NextResponse } from 'next/server';

/**
 * .well-known/aap endpoint - Agentic Arbitration Protocol service discovery
 * Per AAP spec: https://github.com/consulatehq/agentic-arbitration-protocol
 */
export async function GET() {
  const manifest = {
    arbitrationService: "https://perceptive-lyrebird-89.convex.site/aap/v1",
    protocolVersion: "1.0",
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
      arbitratorDiscovery: true,
      aiArbitrators: true,
      humanArbitrators: false,
      confidentialArbitration: true,
      smartContractEnforcement: false
    },
    endpoints: {
      disputes: "/disputes",
      evidence: "/evidence",
      custody: "/api/custody/{caseId}",
      arbitrators: "/.well-known/aap/arbitrators"
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
      arbitrationRules: "/api/standards/arbitration-rules",
      evidenceFormat: "/docs/standards/evidence-format-specification",
      codeOfEthics: "/docs/standards/code-of-ethics-ai-arbitrators"
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

