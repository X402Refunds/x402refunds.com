import { Metadata } from "next";

export const metadata: Metadata = {
  title: "File a Refund Request | X402Refunds",
  description: "Submit an x402 payment refund request. Enter your transaction hash and we'll verify the USDC payment on Base or Solana. Free, permissionless refund filing for AI payments.",
  keywords: [
    "file x402 refund",
    "x402 refund request form",
    "submit refund request",
    "USDC refund form",
    "x402 payment refund",
    "Base USDC refund request",
    "Solana USDC refund request",
    "AI payment refund"
  ],
  openGraph: {
    title: "File a Refund Request | X402Refunds",
    description: "Submit an x402 payment refund request. Enter your transaction hash for on-chain verification.",
    url: "https://x402refunds.com/request-refund",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "File an X402 Refund Request",
    description: "Submit a refund request for x402 USDC payments on Base or Solana.",
  },
  alternates: {
    canonical: "https://x402refunds.com/request-refund",
  },
};

export default function RequestRefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
