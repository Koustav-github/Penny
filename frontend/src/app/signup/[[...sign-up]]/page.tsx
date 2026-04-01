import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

const Signup = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-black -z-10" />
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

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
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-white/50 mt-1">Start mastering your wealth with Penny</p>
          </div>
          <div className="p-8 pt-4">
            <SignUp
              forceRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorBackground: 'transparent',
                  colorInputBackground: 'rgba(255,255,255,0.06)',
                  colorInputText: '#ededed',
                  colorText: '#ededed',
                  colorTextSecondary: 'rgba(237,237,237,0.5)',
                  colorTextOnPrimaryBackground: '#000000',
                  colorPrimary: '#10b981',
                  colorDanger: '#f87171',
                  colorSuccess: '#10b981',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                },
                elements: {
                  rootBox: { width: '100%' },
                  card: { background: 'transparent', boxShadow: 'none', border: 'none', padding: 0, margin: 0 },
                  header: { display: 'none' },
                  socialButtonsBlockButton: {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    borderRadius: '0.75rem',
                  },
                  socialButtonsBlockButtonText: { fontWeight: '500' },
                  dividerLine: { background: 'rgba(255,255,255,0.08)' },
                  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: '12px' },
                  formFieldLabel: { color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '500' },
                  formFieldInput: {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ededed',
                    borderRadius: '0.75rem',
                  },
                  formButtonPrimary: {
                    background: '#10b981',
                    color: '#000000',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    boxShadow: '0 0 20px rgba(16,185,129,0.25)',
                  },
                  footer: { display: 'none' },
                  identityPreviewText: { color: 'rgba(237,237,237,0.7)' },
                  identityPreviewEditButton: { color: '#10b981' },
                  alert: {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                  },
                  alertText: { color: 'rgba(237,237,237,0.7)' },
                  formFieldSuccessText: { color: '#10b981' },
                  formFieldErrorText: { color: '#f87171' },
                  otpCodeFieldInput: {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ededed',
                    borderRadius: '0.5rem',
                  },
                },
              }}
            />
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-white/40">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
