"use client"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 sm:py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10">
          <div>
            <h3 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Consulate</h3>
            <p className="text-sm sm:text-base leading-relaxed">
              When AI services break their promises, get your money back in minutes instead of months of legal battles.
            </p>
          </div>
          <div>
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Platform</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/dashboard', '_self')} className="hover:text-white transition-colors">Dashboard</button></li>
              <li><button onClick={() => window.open('https://youthful-orca-358.convex.site/health', '_blank')} className="hover:text-white transition-colors">API Status</button></li>
              <li><button onClick={() => window.open('/docs', '_self')} className="hover:text-white transition-colors">Documentation</button></li>
            </ul>
          </div>
          <div className="md:col-span-1">
            <h4 className="text-white text-base font-medium mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <li><button onClick={() => window.open('/about', '_self')} className="hover:text-white transition-colors">About</button></li>
              <li><button onClick={() => window.open('/pricing', '_self')} className="hover:text-white transition-colors">Pricing</button></li>
              <li><button onClick={() => window.open('/docs', '_self')} className="hover:text-white transition-colors">Docs</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 sm:mt-12 pt-8 sm:pt-10">
          <div className="text-center mb-6">
            <div className="text-white font-semibold mb-2">Consulate, Inc.</div>
            <div className="text-xs sm:text-sm space-y-1">
              <p>101a Clay St PMB 201, San Francisco CA 94111</p>
              <p>
                Email: <a href="mailto:vivek@consulatehq.com" className="hover:text-white transition-colors">vivek@consulatehq.com</a>
              </p>
              <p>Founder: Vivek Kotecha</p>
            </div>
          </div>
          <div className="text-center text-xs sm:text-sm border-t border-slate-800 pt-6">
            <p>&copy; 2025 Consulate. Fast, automatic dispute resolution when AI services break their promises.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

