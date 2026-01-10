"use client"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-slate-400 py-12 sm:py-16 border-t-4 border-blue-600/30 relative">
      {/* Blue accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <h3 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">X402Refunds</h3>
            <p className="text-sm sm:text-base leading-relaxed">
              Permissionless refund requests for X-402 payments. Request refunds, review them, and track status.
            </p>
          </div>
          <div>
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Platform</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/uptime', '_self')} className="hover:text-blue-400 transition-colors">Uptime</button></li>
              <li><button onClick={() => window.open('/docs', '_self')} className="hover:text-blue-400 transition-colors">Documentation</button></li>
              <li><button onClick={() => window.open('/sign-in', '_self')} className="hover:text-blue-400 transition-colors">Merchant dashboard (optional)</button></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/about', '_self')} className="hover:text-blue-400 transition-colors">About</button></li>
              <li><button onClick={() => window.open('/pricing', '_self')} className="hover:text-blue-400 transition-colors">Pricing</button></li>
              <li><button onClick={() => window.open('/docs', '_self')} className="hover:text-blue-400 transition-colors">Docs</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 sm:mt-12 pt-8 sm:pt-10">
          <div className="text-center text-xs sm:text-sm space-y-2">
            <div>
              <span className="text-white font-semibold">X402Refunds, Inc.</span>
              <span className="mx-2">•</span>
              <span>101a Clay St PMB 201, San Francisco CA 94111</span>
            </div>
            <div>
              Email: <a href="mailto:vivek@x402refunds.com" className="hover:text-blue-400 transition-colors">vivek@x402refunds.com</a>
              <span className="mx-2">•</span>
              Founder: Vivek Kotecha
            </div>
            <div className="pt-4">
              &copy; 2026 X402Refunds. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

