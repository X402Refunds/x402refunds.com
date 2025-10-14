"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to sign-in page
    router.replace("/sign-in")
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-600">Redirecting to sign in...</div>
    </div>
  )
}

