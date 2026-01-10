import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch Deck | x402Disputes",
  description: "x402Disputes - Dispute Resolution for AI Agents",
  openGraph: {
    title: "Pitch Deck | x402Disputes",
    description: "x402Disputes - Dispute Resolution for AI Agents",
    url: "https://x402refunds.com/pitch-deck",
  },
};

export default function PitchDeckPage() {
  return (
    <div className="h-screen w-full">
      <iframe
        src="https://consulate-dispute-resolu-bkibmf4.gamma.site/"
        className="h-full w-full border-0"
        title="x402Disputes Pitch Deck"
        allow="fullscreen"
        loading="eager"
      />
    </div>
  );
}
