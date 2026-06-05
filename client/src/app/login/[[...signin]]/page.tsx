import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'
import AuthShell from '@/components/AuthShell'

const Signin = () => {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Penny account"
      footerPrompt="Don't have an account?"
      footerLinkLabel="Sign up for free"
      footerHref="/signup"
    >
      <Suspense fallback={null}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </AuthShell>
  )
}

export default Signin
