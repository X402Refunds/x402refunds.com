import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/lib/convex-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { 
  OrganizationStructuredData, 
  WebSiteStructuredData, 
  ServiceStructuredData,
  SoftwareApplicationStructuredData,
  FAQStructuredData 
} from "@/components/StructuredData";
import { WagmiProviderWrapper } from '@/lib/wagmi-provider';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: {
    default: "x402Disputes - Automated Dispute Resolution for AI Agents",
    template: "%s | x402Disputes"
  },
  description: "Resolve AI agent disputes in minutes with automated arbitration. 95% cost reduction, 50x faster than traditional legal processes.",
  keywords: [
    "AI Agent Disputes",
    "Automated Arbitration",
    "AI Service Resolution",
    "Enterprise AI Platform",
    "SLA Enforcement",
    "AI Vendor Disputes",
    "Agent Identity Management",
    "Dispute Resolution Automation",
    "AI Service Agreements",
    "API SLA Monitoring",
    "AI Agent Reputation",
    "Enterprise AI Trust",
    "Automated Legal Resolution",
    "AI Contract Enforcement",
    "Machine-to-Machine Arbitration"
  ],
  authors: [{ name: "Vivek Kotecha", url: "https://www.x402disputes.com" }],
  creator: "Vivek Kotecha",
  publisher: "x402Disputes",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://www.x402disputes.com'),
  alternates: {
    canonical: 'https://www.x402disputes.com/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.x402disputes.com/',
    siteName: 'x402Disputes',
    title: 'x402Disputes - Agentic Dispute Arbitration',
    description: 'Resolve AI agent disputes in minutes with automated arbitration. 95% cost reduction, 50x faster than traditional legal processes.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'x402Disputes - Automated Dispute Resolution for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@x402disputes',
    creator: '@x402disputes',
    title: 'x402Disputes - Automated Dispute Resolution for AI Agents',
    description: 'Resolve AI agent disputes in minutes with automated arbitration. 95% cost reduction, 50x faster.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'your-google-verification-code-here',
    yandex: 'your-yandex-verification-code-here',
    yahoo: 'your-yahoo-verification-code-here',
  },
  category: 'Technology',
  classification: 'Business Software',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'x402Disputes',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        cssLayerName: 'clerk' // Required for Tailwind 4 compatibility
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Favicon and Icons */}
          <link rel="icon" href="/favicon.ico" sizes="32x32" />
          <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
          <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://perceptive-lyrebird-89.convex.cloud" />
          
          {/* DNS Prefetch for additional domains */}
          <link rel="dns-prefetch" href="https://vercel.com" />
          
          {/* Structured Data */}
          <OrganizationStructuredData />
          <WebSiteStructuredData />
          <ServiceStructuredData />
          <SoftwareApplicationStructuredData />
          <FAQStructuredData />
          
          {/* Ahrefs Analytics */}
          <script src="https://analytics.ahrefs.com/analytics.js" data-key="t8J3APG0cO6rucq4JUwaWw" async></script>
          
          {/* Clerk Custom Domain Detection Script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Detect if Clerk is trying to use custom domain and warn
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('clerk.x402disputes.com')) {
                    console.error(
                      '%c⚠️ Clerk Custom Domain Issue Detected',
                      'color: red; font-weight: bold; font-size: 14px;'
                    );
                    console.error(
                      'Clerk is configured to use clerk.x402disputes.com but this domain has SSL issues.\\n' +
                      'SOLUTION: Go to Clerk Dashboard → Domains → Delete clerk.x402disputes.com\\n' +
                      'Clerk will automatically fall back to *.clerk.accounts.dev'
                    );
                  }
                }, true);
              `,
            }}
          />
        </head>
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <WagmiProviderWrapper>
            <ConvexClientProvider>
              {children}
            </ConvexClientProvider>
          </WagmiProviderWrapper>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
