'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>
          
          {error.digest && (
            <p className="text-sm text-slate-500 mb-8 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={reset}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
            size="lg"
            variant="outline"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            If this problem persists, please{' '}
            <a 
              href="mailto:support@x402refunds.com" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
