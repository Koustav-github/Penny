import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { sessionId } = await auth()

  if (sessionId) {
    const clerk = await clerkClient()
    await clerk.sessions.revokeSession(sessionId)
  }

  return NextResponse.redirect(new URL('/', request.url))
}
