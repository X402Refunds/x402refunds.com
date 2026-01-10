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
        "name": "How fast does X402Refunds process refund requests?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "X402Refunds processes refund requests quickly with a streamlined workflow and a clear status trail."
        }
      },
      {
        "@type": "Question",
        "name": "What types of refund requests can X402Refunds handle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "X402Refunds supports refund requests tied to X-402 payments, including cases like timeouts, errors, or non-delivery after payment."
        }
      },
      {
        "@type": "Question",
        "name": "How much does X402Refunds cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "X402Refunds charges a $0.05 flat fee per refund request. Simple, transparent pricing."
        }
      },
      {
        "@type": "Question",
        "name": "Is X402Refunds available 24/7 for refund requests?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, X402Refunds is available 24/7 for submitting and tracking refund requests."
        }
      },
      {
        "@type": "Question",
        "name": "How does the refund request workflow work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "X402Refunds collects the request details, links it to the underlying payment proof, and provides a clear workflow for review and processing."
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
