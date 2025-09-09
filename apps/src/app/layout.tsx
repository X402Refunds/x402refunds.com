import './globals.css'
import { Inter } from 'next/font/google'
import { ConvexProvider } from './ConvexProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Agent Court',
  description: 'Agentic Government for AI Agents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Agent Court
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a href="/" className="text-gray-600 hover:text-gray-900">
                      Dashboard
                    </a>
                    <a href="/cases" className="text-gray-600 hover:text-gray-900">
                      Cases
                    </a>
                    <a href="/rulings" className="text-gray-600 hover:text-gray-900">
                      Rulings
                    </a>
                    <a href="/precedents" className="text-gray-600 hover:text-gray-900">
                      Precedents
                    </a>
                    <a href="/constitution" className="text-gray-600 hover:text-gray-900">
                      Constitution
                    </a>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </ConvexProvider>
      </body>
    </html>
  )
}
