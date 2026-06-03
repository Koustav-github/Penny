'use client'

import { useEffect, useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'

type Mode = 'sign-in' | 'sign-up'
type Method = 'password' | 'code'
type Step = 'collect' | 'verify'

// Minimal shape of the error object returned by the Future-API methods.
type ReturnedError = { code: string; message: string; longMessage?: string } | null

// Exact messages requested: login to a missing account and signup to an
// existing one must be rejected, never silently transferred.
const MSG_NO_ACCOUNT = 'This account does not exist. Please create an account.'
const MSG_ACCOUNT_EXISTS = 'An account already exists. Please sign in.'
const MSG_OAUTH_FAILED = 'Google sign-in could not be completed. Please try again.'

/** Maps the `?error=` param set by the OAuth callback routes back to a message. */
function messageForErrorParam(mode: Mode, error: string | null): string | null {
  if (!error) return null
  if (error === 'no_account') return MSG_NO_ACCOUNT
  if (error === 'exists') return MSG_ACCOUNT_EXISTS
  if (error === 'oauth') return MSG_OAUTH_FAILED
  return mode === 'sign-in' ? MSG_NO_ACCOUNT : MSG_ACCOUNT_EXISTS
}

/**
 * Translates a Clerk error into a user-facing message, mapping the two cases
 * this flow exists to enforce to the exact requested wording.
 */
function describeClerkError(mode: Mode, err: ReturnedError): string {
  if (!err) return 'Something went wrong. Please try again.'
  if (mode === 'sign-in' && err.code === 'form_identifier_not_found') return MSG_NO_ACCOUNT
  if (mode === 'sign-up' && err.code === 'form_identifier_exists') return MSG_ACCOUNT_EXISTS
  return err.longMessage ?? err.message ?? 'Something went wrong.'
}

interface AuthFormProps {
  mode: Mode
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // `isLoaded` from useAuth is reactive — it re-renders the component when
  // Clerk finishes loading. (useClerk().loaded does not, which left the button
  // stuck disabled so clicks did nothing.)
  const { isLoaded } = useAuth()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()

  const [method, setMethod] = useState<Method>('password')
  const [step, setStep] = useState<Step>('collect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignIn = mode === 'sign-in'
  const ready = isLoaded

  // Surface OAuth rejection messages handed back by the sso-callback routes.
  useEffect(() => {
    const param = messageForErrorParam(mode, searchParams.get('error'))
    if (param) setError(param)
  }, [mode, searchParams])

  const goToDashboard = () => router.push('/dashboard')

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      if (isSignIn) {
        if (method === 'password') {
          // A missing identifier returns form_identifier_not_found here — we
          // never reach a sign-up transfer, so no silent account creation.
          const { error: err } = await signIn.password({ identifier: email, password })
          if (err) return setError(describeClerkError(mode, err))
          await signIn.finalize()
          goToDashboard()
        } else {
          // create() surfaces the missing-account error before any code is sent.
          const created = await signIn.create({ identifier: email })
          if (created.error) return setError(describeClerkError(mode, created.error))
          const sent = await signIn.emailCode.sendCode({ emailAddress: email })
          if (sent.error) return setError(describeClerkError(mode, sent.error))
          setStep('verify')
        }
      } else {
        // Sign-up: an existing identifier returns form_identifier_exists here,
        // so an existing account is rejected rather than logged in.
        const created =
          method === 'password'
            ? await signUp.password({ emailAddress: email, password })
            : await signUp.create({ emailAddress: email })
        if (created.error) return setError(describeClerkError(mode, created.error))
        const sent = await signUp.verifications.sendEmailCode()
        if (sent.error) return setError(describeClerkError(mode, sent.error))
        setStep('verify')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      if (isSignIn) {
        const { error: err } = await signIn.emailCode.verifyCode({ code })
        if (err) return setError(describeClerkError(mode, err))
        await signIn.finalize()
      } else {
        const { error: err } = await signUp.verifications.verifyEmailCode({ code })
        if (err) return setError(describeClerkError(mode, err))
        await signUp.finalize()
      }
      goToDashboard()
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    if (!ready || submitting) return
    setError(null)
    try {
      // On success sso() performs a full-page redirect to Google and never
      // resolves here. If it resolves, it returned an error (the Future API
      // returns errors, it does not throw) — surface it instead of no-op'ing.
      const { error: err } = isSignIn
        ? await signIn.sso({
            strategy: 'oauth_google',
            redirectUrl: '/dashboard',
            redirectCallbackUrl: '/login/sso-callback',
          })
        : await signUp.sso({
            strategy: 'oauth_google',
            redirectUrl: '/dashboard',
            redirectCallbackUrl: '/signup/sso-callback',
          })
      if (err) {
        console.error(`[AuthForm] ${mode} google sso returned error:`, JSON.stringify(err, null, 2))
        setError(describeClerkError(mode, err))
      }
    } catch (caught) {
      console.error(`[AuthForm] ${mode} google sso threw:`, caught)
      setError(MSG_OAUTH_FAILED)
    }
  }

  const submitLabel = isSignIn ? 'Sign in' : 'Create account'

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <p className="text-sm text-white/60 text-center">
          We sent a verification code to <span className="text-white/90">{email}</span>.
        </p>
        {error && <ErrorBanner message={error} />}
        <Field
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={setCode}
          placeholder="123456"
          required
        />
        <PrimaryButton disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify'}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => {
            setStep('collect')
            setCode('')
            setError(null)
          }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Use a different email
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={!ready}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-xs text-white/30">or</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      <form onSubmit={handleCollect} className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
        />
        {method === 'password' && (
          <Field
            label="Password"
            type="password"
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />
        )}

        {/* Clerk bot-protection target; required for the sign-up create call. */}
        {!isSignIn && <div id="clerk-captcha" />}

        <PrimaryButton disabled={submitting}>
          {submitting ? 'Please wait…' : submitLabel}
        </PrimaryButton>
      </form>

      <button
        type="button"
        onClick={() => {
          setMethod((m) => (m === 'password' ? 'code' : 'password'))
          setError(null)
        }}
        className="text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        {method === 'password' ? 'Use a one-time email code instead' : 'Use a password instead'}
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string
  value: string
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-white/55">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-[#ededed] placeholder:text-white/25 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
      />
    </label>
  )
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">
      {message}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
