"use client"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-slate-400 py-12 sm:py-16 border-t-4 border-emerald-600/30 relative">
      {/* Emerald accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <h3 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Consulate</h3>
            <p className="text-sm sm:text-base leading-relaxed">
              Automated arbitration infrastructure for AI service disputes. 95% AI-powered, 100% customer-controlled.
            </p>
          </div>
          <div>
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Platform</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/uptime', '_self')} className="hover:text-emerald-400 transition-colors">Uptime</button></li>
              <li><button onClick={() => window.open('https://docs.x402disputes.com', '_blank')} className="hover:text-emerald-400 transition-colors">Documentation</button></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/about', '_self')} className="hover:text-emerald-400 transition-colors">About</button></li>
              <li><button onClick={() => window.open('/pricing', '_self')} className="hover:text-emerald-400 transition-colors">Pricing</button></li>
              <li><button onClick={() => window.open('https://docs.x402disputes.com', '_blank')} className="hover:text-emerald-400 transition-colors">Docs</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 sm:mt-12 pt-8 sm:pt-10">
          <div className="text-center text-xs sm:text-sm space-y-2">
            <div>
              <span className="text-white font-semibold">Consulate, Inc.</span>
              <span className="mx-2">•</span>
              <span>101a Clay St PMB 201, San Francisco CA 94111</span>
            </div>
            <div>
              Email: <a href="mailto:vivek@x402disputes.com" className="hover:text-emerald-400 transition-colors">vivek@x402disputes.com</a>
              <span className="mx-2">•</span>
              Founder: Vivek Kotecha
            </div>
            <div className="pt-4">
              &copy; 2025 Consulate. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

