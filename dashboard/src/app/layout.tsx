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
    default: "X402Refunds - x402 Payment Refund Requests",
    template: "%s | X402Refunds"
  },
  description: "Request, review, and process x402 payment refunds. A simple dashboard + API to manage refund requests and track status.",
  keywords: [
    "x402",
    "x402 payments",
    "refunds",
    "payment refunds",
    "refund requests",
    "payment refunds",
    "AI agent payments",
    "agent payments",
    "refund API",
    "refund dashboard"
  ],
  authors: [{ name: "Vivek Kotecha", url: "https://x402refunds.com" }],
  creator: "Vivek Kotecha",
  publisher: "X402Refunds",
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
  metadataBase: new URL('https://x402refunds.com'),
  alternates: {
    canonical: 'https://x402refunds.com/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://x402refunds.com/',
    siteName: 'X402Refunds',
    title: 'X402Refunds - x402 Payment Refund Requests',
    description: 'Request, review, and process x402 payment refunds. Track refund status in one place.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'X402Refunds - x402 Payment Refund Requests',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@x402refunds',
    creator: '@x402refunds',
    title: 'X402Refunds - x402 Payment Refund Requests',
    description: 'Request, review, and process x402 payment refunds. Simple dashboard + API.',
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
    'apple-mobile-web-app-title': 'X402Refunds',
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
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
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
