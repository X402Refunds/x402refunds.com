import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <SignIn 
        routing="path"
        path="/sign-in"
        forceRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
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

