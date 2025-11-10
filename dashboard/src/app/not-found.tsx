export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Home } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            asChild
            size="lg"
            variant="outline"
          >
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            If you believe this is an error, please{' '}
            <a 
              href="mailto:support@x402disputes.com" 
              className="text-emerald-600 hover:text-emerald-700 underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
