export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "X402Refunds",
    "url": "https://x402refunds.com",
    "logo": "https://x402refunds.com/x-favicon.svg",
    "description": "Payment refund requests for X-402 payments. Request, review, and process refunds with a simple dashboard + API.",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "Vivek Kotecha"
    },
    "sameAs": [
      "https://github.com/x402refunds"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": "https://x402refunds.com"
    },
    "areaServed": "Worldwide",
    "serviceType": "Payment Refund Requests",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "47"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebSiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "X402Refunds",
    "url": "https://x402refunds.com",
    "description": "Payment refund requests for X-402 payments",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://x402refunds.com/demo/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function ServiceStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Payment Refund Requests",
    "provider": {
      "@type": "Organization",
      "name": "X402Refunds",
      "url": "https://x402refunds.com"
    },
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Dispute Resolution Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Refund Requests",
            "description": "Request, review, and process payment refunds for X-402 payments"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Refund Status Tracking",
            "description": "Track refund request status and outcomes"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Refund Evidence",
            "description": "Attach supporting context to refund requests (logs, receipts, transaction details)"
          }
        }
      ]
    },
    "offers": {
      "@type": "AggregateOffer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "USD",
      "lowPrice": "500",
      "highPrice": "3000"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function SoftwareApplicationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "X402Refunds AI Agent Platform",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "47"
    },
    "featureList": [
      "Refund Request Intake",
      "Refund Review Workflow",
      "Refund Status Tracking",
      "Evidence Attachments",
      "API Access"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function FAQStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I request an x402 payment refund?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To request an x402 payment refund, POST your transaction details to https://api.x402refunds.com/v1/refunds. Required fields: blockchain (base or solana), transactionHash, sellerEndpointUrl, and description. You can also use the web form at https://x402refunds.com/request-refund."
        }
      },
      {
        "@type": "Question",
        "name": "What is the x402 refund process?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The x402 refund process: 1) File a refund request with your transaction hash 2) We verify the USDC payment on-chain 3) The merchant receives an email notification 4) Merchant approves, denies, or offers partial refund 5) If approved, refund is executed automatically to your wallet."
        }
      },
      {
        "@type": "Question",
        "name": "What information do I need to file an x402 refund?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You need: 1) The blockchain (base or solana) 2) Your transaction hash (0x... for Base, base58 for Solana) 3) The seller's API endpoint URL you paid 4) A description of what went wrong. Optional: evidence URLs and source transfer log index for multi-transfer transactions."
        }
      },
      {
        "@type": "Question",
        "name": "Where can I find the x402 refund API schema?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The complete JSON Schema for x402 refund requests is available at https://api.x402refunds.com/v1/refunds/schema. This machine-readable schema describes all required and optional fields, formats, and constraints."
        }
      },
      {
        "@type": "Question",
        "name": "What blockchains does x402refunds.com support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "X402Refunds supports USDC payments on Base (Ethereum L2) and Solana mainnet. Both native USDC and bridged USDC (USDbC) are supported on Base."
        }
      },
      {
        "@type": "Question",
        "name": "How long does x402 refund processing take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Refund requests are processed in real-time. The merchant is notified immediately via email. Processing time depends on merchant response - most merchants respond within 24 hours. Once approved, the refund is executed within minutes."
        }
      },
      {
        "@type": "Question",
        "name": "Can AI agents file x402 refund requests?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, AI agents can file refund requests via the API at POST https://api.x402refunds.com/v1/refunds. The API returns self-healing error responses with schema and recovery hints, enabling agents to correct mistakes and retry automatically."
        }
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function HowToStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Request an X402 Payment Refund",
    "description": "Step-by-step guide to filing an x402 USDC payment refund request",
    "totalTime": "PT5M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "step": [
      {
        "@type": "HowToStep",
        "name": "Get your transaction hash",
        "text": "Find the USDC payment transaction hash from your wallet or block explorer. For Base, it starts with 0x. For Solana, it's a base58 signature.",
        "url": "https://x402refunds.com/docs#transaction-hash"
      },
      {
        "@type": "HowToStep",
        "name": "Identify the seller endpoint",
        "text": "Find the exact API endpoint URL you paid for. This is the https:// URL that returned a 402 Payment Required response.",
        "url": "https://x402refunds.com/docs#seller-endpoint"
      },
      {
        "@type": "HowToStep",
        "name": "Describe the problem",
        "text": "Write a clear description of what went wrong after payment - e.g., API error, timeout, wrong output, service unavailable.",
        "url": "https://x402refunds.com/docs#description"
      },
      {
        "@type": "HowToStep",
        "name": "Submit the refund request",
        "text": "POST your request to https://api.x402refunds.com/v1/refunds with blockchain, transactionHash, sellerEndpointUrl, and description fields. Or use the web form at https://x402refunds.com/request-refund.",
        "url": "https://x402refunds.com/developers"
      },
      {
        "@type": "HowToStep",
        "name": "Track your refund",
        "text": "Use the returned caseId to check status at https://x402refunds.com/cases/{caseId} or via API at GET /v1/refund?id={caseId}.",
        "url": "https://x402refunds.com/docs#tracking"
      }
    ],
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Transaction hash from wallet or block explorer"
      },
      {
        "@type": "HowToTool",
        "name": "API client or web browser"
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebAPIStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    "name": "X402Refunds API",
    "description": "REST API for filing and managing x402 payment refund requests. Supports USDC payments on Base and Solana.",
    "url": "https://api.x402refunds.com",
    "documentation": "https://x402refunds.com/developers",
    "termsOfService": "https://x402refunds.com/terms",
    "provider": {
      "@type": "Organization",
      "name": "X402Refunds",
      "url": "https://x402refunds.com"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
