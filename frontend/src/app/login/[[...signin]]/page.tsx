import React from 'react'
import { SignIn } from '@clerk/nextjs'

const Signin = () => {
  return (
    <div className='h-full w-full flex items-center justify-center'>
      <div>
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}

export default Signin
