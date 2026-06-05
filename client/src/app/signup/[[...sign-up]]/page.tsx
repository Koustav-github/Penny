import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'
import AuthShell from '@/components/AuthShell'

const Signup = () => {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start mastering your wealth with Penny"
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref="/login"
    >
      <Suspense fallback={null}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </AuthShell>
  )
}

export default Signup
