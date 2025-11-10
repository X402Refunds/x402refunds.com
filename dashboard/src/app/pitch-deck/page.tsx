import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch Deck | Consulate",
  description: "Consulate - Dispute Resolution for AI Agents",
  openGraph: {
    title: "Pitch Deck | Consulate",
    description: "Consulate - Dispute Resolution for AI Agents",
    url: "https://x402disputes.com/pitch-deck",
  },
};

export default function PitchDeckPage() {
  return (
    <div className="h-screen w-full">
      <iframe
        src="https://consulate-dispute-resolu-bkibmf4.gamma.site/"
        className="h-full w-full border-0"
        title="Consulate Pitch Deck"
        allow="fullscreen"
        loading="eager"
      />
    </div>
  );
}
