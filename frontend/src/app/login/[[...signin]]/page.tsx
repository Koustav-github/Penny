import { SignIn } from '@clerk/nextjs'
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
            <SignIn
              forceRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorBackground: 'transparent',
                  colorInputBackground: 'rgba(255,255,255,0.05)',
                  colorInputText: '#ededed',
                  colorText: '#ededed',
                  colorTextSecondary: 'rgba(237,237,237,0.45)',
                  colorPrimary: '#10b981',
                  colorDanger: '#f87171',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                },
                elements: {
                  card: 'bg-transparent shadow-none border-none p-0 w-full',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  header: 'hidden',
                  socialButtonsBlockButton:
                    'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all rounded-xl',
                  socialButtonsBlockButtonText: 'font-medium',
                  dividerLine: 'bg-white/10',
                  dividerText: 'text-white/30 text-xs',
                  formFieldInput:
                    'bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 rounded-xl transition-all',
                  formFieldLabel: 'text-white/60 text-sm font-medium',
                  formButtonPrimary:
                    'bg-primary hover:bg-primary-hover text-black font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5',
                  footerActionLink: 'text-primary hover:text-primary/80 font-medium transition-colors',
                  footerActionText: 'text-white/40',
                  footer: 'hidden',
                  identityPreviewText: 'text-white/70',
                  identityPreviewEditButtonIcon: 'text-primary',
                  formFieldSuccessText: 'text-primary',
                  alertText: 'text-white/70',
                  alert: 'bg-white/5 border border-white/10 rounded-xl',
                },
              }}
            />
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
