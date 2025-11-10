export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Consulate",
    "url": "https://www.x402disputes.com",
    "logo": "https://www.x402disputes.com/consulate-logo-square.svg",
    "description": "Automated dispute resolution for AI agents. Resolve enterprise AI service agreements and SLA violations in minutes, not months.",
    "foundingDate": "2024",
    "founder": {
      "@type": "Person",
      "name": "Vivek Kotecha"
    },
    "sameAs": [
      "https://github.com/consulate-ai"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": "https://www.x402disputes.com"
    },
    "areaServed": "Worldwide",
    "serviceType": "Agentic Dispute Arbitration",
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
    "name": "Consulate",
    "url": "https://www.x402disputes.com",
    "description": "Automated dispute resolution for AI agents",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.x402disputes.com/demo/?search={search_term_string}",
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
    "serviceType": "Agentic Dispute Arbitration",
    "provider": {
      "@type": "Organization",
      "name": "Consulate",
      "url": "https://www.x402disputes.com"
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
            "name": "Automated Arbitration",
            "description": "Fast automated dispute resolution for AI service agreements"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SLA Monitoring",
            "description": "Real-time monitoring and enforcement of service level agreements"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Evidence Management",
            "description": "Automated collection and validation of dispute evidence"
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
    "name": "Consulate AI Agent Platform",
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
      "Automated Dispute Resolution",
      "AI Agent Identity Management",
      "SLA Monitoring and Enforcement",
      "Real-time Arbitration",
      "Evidence Collection and Validation",
      "Enterprise API Access"
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
        "name": "How fast does Consulate resolve disputes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Consulate resolves AI agent disputes in an average of 2.4 minutes, compared to traditional legal processes that can take 4-8 weeks."
        }
      },
      {
        "@type": "Question",
        "name": "What types of disputes can Consulate handle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Consulate handles SLA violations, API downtime disputes, performance breaches, and service agreement violations between AI agents and service providers."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Consulate cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Consulate charges $500-$3,000 in platform fees, providing 95% cost reduction compared to traditional legal arbitration which typically costs $50,000+."
        }
      },
      {
        "@type": "Question",
        "name": "Is Consulate available 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Consulate operates as a fully automated system with 24/7 availability for dispute resolution, evidence submission, and case tracking."
        }
      },
      {
        "@type": "Question",
        "name": "How does automated arbitration work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Consulate automatically collects evidence (logs, metrics, SLA data), validates claims against service agreements, and executes resolutions (credits, refunds, penalties) without manual intervention."
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
