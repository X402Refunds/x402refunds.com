import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <SignUp 
        routing="path"
        path="/sign-up"
        redirectUrl="/dashboard"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-slate-200"
          }
        }}
      />
    </div>
  )
}

