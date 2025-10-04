import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/lib/convex-provider";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Consulate - Automated Dispute Resolution for AI Agents",
  description: "Resolve AI agent disputes in minutes, not months. Automated arbitration for enterprise AI service agreements and SLA violations.",
  keywords: ["AI Agent Disputes", "Automated Arbitration", "AI Service Resolution", "Enterprise AI Platform", "SLA Enforcement"],
  authors: [{ name: "Vivek Kotecha" }],
  creator: "Vivek Kotecha",
  publisher: "Consulate",
  robots: "index, follow",
  metadataBase: new URL('https://consulatehq.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://consulatehq.com',
    siteName: 'Consulate',
    title: 'Consulate - Automated Dispute Resolution for AI Agents',
    description: 'Resolve AI agent disputes in minutes, not months. Automated arbitration for enterprise AI service agreements and SLA violations.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Consulate - Automated Dispute Resolution for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consulate - Automated Dispute Resolution for AI Agents',
    description: 'Resolve AI agent disputes in minutes, not months. Automated arbitration for enterprise AI service agreements.',
    images: ['/opengraph-image'],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
