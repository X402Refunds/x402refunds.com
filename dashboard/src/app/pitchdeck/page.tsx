"use client";

import { useEffect } from "react";

export default function PitchDeckPage() {
  useEffect(() => {
    // Redirect immediately to Gamma pitch deck
    window.location.href = "https://consulate-dispute-resolu-bkibmf4.gamma.site/";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center p-8 max-w-md">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">Consulate</h1>
          <p className="text-xl text-blue-200">Dispute Resolution for AI Agents</p>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        
        <p className="text-sm text-blue-300 mb-8">Loading investor deck...</p>
        
        {/* Fallback link if redirect doesn't work */}
        <a
          href="https://consulate-dispute-resolu-bkibmf4.gamma.site/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 font-medium"
        >
          Click here if not redirected
        </a>
      </div>
    </div>
  );
}