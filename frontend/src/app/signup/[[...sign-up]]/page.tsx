import { SignUp } from '@clerk/nextjs'

const Signup = () => {
  return (
    <div className='h-full w-full flex items-center justify-center'>
      <div className='h-auto w-auto'>
        <SignUp forceRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}

export default Signup
