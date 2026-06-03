'use client'

import { useEffect, useRef } from 'react'
import { useAuth, useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import CallbackScreen from '@/components/CallbackScreen'

/**
 * OAuth return point for the LOGIN flow.
 *
 * Clerk processes the provider redirect into the `signIn` resource. If the
 * Google account already maps to a user, the sign-in completes and we activate
 * the session. If it does not, Clerk marks the sign-in as `isTransferable`
 * (it would otherwise create a brand-new account) — we reject that and bounce
 * back to /login with the "account does not exist" message instead.
 */
export default function LoginSSOCallback() {
  const router = useRouter()
  const { isLoaded } = useAuth()
  const { signIn } = useSignIn()
  const handled = useRef(false)

  useEffect(() => {
    if (!isLoaded || handled.current) return

    // No account for this email → reject rather than auto-register.
    if (signIn.isTransferable) {
      handled.current = true
      router.replace('/login?error=no_account')
      return
    }

    if (signIn.status === 'complete') {
      handled.current = true;
      (async () => {
        await signIn.finalize()
        router.push('/dashboard')
      })()
      return
    }

    // Any other terminal state (e.g. failed verification, unsupported MFA path)
    // is treated as a failed Google sign-in.
    if (signIn.status === 'needs_second_factor' || signIn.firstFactorVerification.status === 'failed') {
      handled.current = true
      router.replace('/login?error=oauth')
    }
  }, [isLoaded, signIn, router])

  // Fallback so the user is never stranded on the spinner if the resource
  // never reaches a state we recognise.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handled.current) {
        handled.current = true
        router.replace('/login?error=oauth')
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [router])

  return <CallbackScreen label="Signing you in…" />
}
