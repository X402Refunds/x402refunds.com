import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Pitch Deck | Consulate",
  description: "Dispute Resolution Infrastructure for AI Agents - Investor Presentation",
  openGraph: {
    title: "Investor Pitch Deck | Consulate",
    description: "Dispute Resolution Infrastructure for AI Agents - Investor Presentation",
    url: "https://consulatehq.com/pitchdeck",
    images: [
      {
        url: "https://consulatehq.com/consulate-logo-square.svg",
        width: 1200,
        height: 630,
        alt: "Consulate - Dispute Resolution for AI Agents",
      },
    ],
  },
};

export default function PitchDeckPage() {
  return (
    <>
      {/* Full-screen seamless iframe */}
      <div className="fixed inset-0 w-full h-full bg-white">
        <iframe
          src="https://consulate-dispute-resolu-bkibmf4.gamma.site/"
          className="w-full h-full border-0"
          title="Consulate Investor Pitch Deck"
          allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="eager"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
        />
      </div>

      {/* Fallback for browsers that block iframes */}
      <noscript>
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Consulate Investor Pitch Deck</h1>
            <p className="text-gray-600 mb-6">
              Please enable JavaScript or visit the deck directly:
            </p>
            <a
              href="https://consulate-dispute-resolu-bkibmf4.gamma.site/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Pitch Deck
            </a>
          </div>
        </div>
      </noscript>
    </>
  );
}