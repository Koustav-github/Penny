import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'
import Link from 'next/link'

const Signin = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-black -z-10" />
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xl group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-shadow">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-white/90">Penny</span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-white/3 backdrop-blur-xl border border-white/10 shadow-[0_0_80px_rgba(16,185,129,0.04)] overflow-hidden">
          <div className="px-8 pt-8 pb-2 text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-white/50 mt-1">Sign in to your Penny account</p>
          </div>
          <div className="p-8 pt-4">
            <Suspense fallback={null}>
              <AuthForm mode="sign-in" />
            </Suspense>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-white/40">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signin
