import { Metadata } from "next"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { Section } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Search, 
  Zap, 
  ArrowRight,
  FileText,
  Shield,
  Clock,
  HelpCircle
} from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "How X402 Refunds Work - Process Explained | X402Refunds",
  description: "Understand the complete x402 payment refund process. From filing a request to receiving your USDC refund. Step-by-step guide with visual diagrams for Base and Solana payments.",
  keywords: [
    "how x402 refunds work",
    "x402 refund process explained",
    "x402 payment refund steps",
    "USDC refund process",
    "x402 refund flow",
    "AI payment refund process",
    "Base USDC refund process",
    "Solana USDC refund process"
  ],
  openGraph: {
    title: "How X402 Refunds Work",
    description: "Step-by-step guide to the x402 payment refund process. From request to resolution.",
    url: "https://x402refunds.com/how-it-works",
    type: "website",
  },
  alternates: {
    canonical: "https://x402refunds.com/how-it-works",
  }
}

const steps = [
  {
    number: 1,
    title: "Payment Fails or Service Issue",
    description: "After making an x402 USDC payment, you experience an issue - the API returns an error, times out, or delivers incorrect output.",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    number: 2,
    title: "File Refund Request",
    description: "Submit a refund request with your transaction hash, the seller endpoint URL, and a description of what went wrong. Use our web form or API.",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    number: 3,
    title: "On-Chain Verification",
    description: "We verify your USDC payment on-chain (Base or Solana). The payer, recipient, and amount are extracted directly from the blockchain.",
    icon: Shield,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    number: 4,
    title: "Merchant Notification",
    description: "The merchant receives an email notification with the refund request details. They can review the claim and your description.",
    icon: Mail,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    number: 5,
    title: "Merchant Decision",
    description: "The merchant approves, denies, or offers a partial refund via one-click email actions. Most merchants respond within 24 hours.",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    number: 6,
    title: "Refund Execution",
    description: "If approved, the refund is executed automatically to your wallet. The transaction is recorded and a shareable proof page is created.",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
]

const faqs = [
  {
    question: "How do I request an x402 payment refund?",
    answer: "To request a refund, you need your transaction hash (from your wallet or block explorer), the seller's API endpoint URL, and a description of what went wrong. You can file via our web form at /request-refund or via the API at POST /v1/refunds."
  },
  {
    question: "What information do I need to file a refund?",
    answer: "Required: blockchain (\"base\" or \"solana\"), transactionHash (the USDC payment tx hash), sellerEndpointUrl (the paid API endpoint), and description (what went wrong). Optional: evidenceUrls for supporting documentation."
  },
  {
    question: "How long does the refund process take?",
    answer: "Refund requests are processed in real-time - the merchant is notified immediately via email. Resolution time depends on the merchant's response. Most merchants respond within 24 hours. Once approved, refunds are executed within minutes."
  },
  {
    question: "What blockchains are supported?",
    answer: "We support USDC payments on Base (Ethereum L2) and Solana mainnet. Both native USDC and bridged USDC (USDbC) are supported on Base."
  },
  {
    question: "Can AI agents file refund requests?",
    answer: "Yes! AI agents can file refund requests via the API at POST /v1/refunds. The API returns self-healing error responses with schema and recovery hints, enabling agents to correct mistakes and retry automatically."
  },
  {
    question: "Where can I find the API schema?",
    answer: "The complete JSON Schema for refund requests is available at https://api.x402refunds.com/v1/refunds/schema. This machine-readable schema describes all required and optional fields, formats, and constraints."
  },
  {
    question: "Is there a fee for filing refund requests?",
    answer: "Filing a refund request is free. Merchants who want to enable one-click automated refunds can top up refund credits, but this is optional."
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <Section
        spacing="none"
        className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200"
        containerClassName="max-w-5xl pt-8 pb-12"
      >
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
            Process Guide
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            How X402 Refunds Work
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            A simple, transparent process for requesting and processing 
            refunds on x402 USDC payments.
          </p>
        </div>
      </Section>

      {/* Process Steps */}
      <Section spacing="tight" containerClassName="max-w-5xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
          The Refund Process
        </h2>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex gap-6 items-start">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-slate-400">Step {step.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-14 w-px h-full bg-slate-200" />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-12">
          <Link href="/request-refund">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              File a Refund Request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/developers">
            <Button size="lg" variant="outline">
              View API Docs
            </Button>
          </Link>
        </div>
      </Section>

      {/* Key Features */}
      <Section spacing="tight" containerClassName="max-w-5xl" className="bg-slate-50 border-y border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
          Why Use X402Refunds?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Fast Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Most refund requests are resolved within 24 hours. Merchants receive instant email notifications.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                On-Chain Verified
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Every payment is verified directly on the blockchain. No disputes about whether payment was made.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Transparent
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Every refund request gets a public status page. Both parties can track progress in real-time.
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section spacing="tight" containerClassName="max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600">
            Common questions about the x402 refund process
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 pl-11">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section spacing="tight" containerClassName="max-w-3xl" className="bg-slate-50 border-t border-slate-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Ready to File a Refund?
          </h2>
          <p className="text-slate-600 mb-6">
            Get started in under a minute. No account required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/request-refund">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                File Refund Request
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  )
}
