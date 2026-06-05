'use client'

import { useEffect, useRef } from 'react'
import { useAuth, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import CallbackScreen from '@/components/CallbackScreen'

/**
 * OAuth return point for the SIGN-UP flow.
 *
 * Clerk processes the provider redirect into the `signUp` resource. If the
 * Google account is new, the sign-up completes and we activate the session.
 * If an account already exists, Clerk marks the external-account verification
 * as `transferable` (it would otherwise log the user straight in) — we reject
 * that and bounce back to /signup with the "account already exists" message.
 */
export default function SignupSSOCallback() {
  const router = useRouter()
  const { isLoaded } = useAuth()
  const { signUp } = useSignUp()
  const handled = useRef(false)

  useEffect(() => {
    if (!isLoaded || handled.current) return

    // Account already exists for this email → reject rather than auto-login.
    if (signUp.verifications.externalAccount.status === 'transferable') {
      handled.current = true
      router.replace('/signup?error=exists')
      return
    }

    if (signUp.status === 'complete') {
      handled.current = true
      ;(async () => {
        await signUp.finalize()
        router.push('/dashboard')
      })()
      return
    }

    if (signUp.verifications.externalAccount.status === 'failed') {
      handled.current = true
      router.replace('/signup?error=oauth')
    }
  }, [isLoaded, signUp, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handled.current) {
        handled.current = true
        router.replace('/signup?error=oauth')
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [router])

  return <CallbackScreen label="Creating your account…" />
}
