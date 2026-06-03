import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/assets(.*)', '/expenses(.*)', '/analytics(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Already signed in → redirect away from auth pages to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Not signed in → redirect away from protected pages to login
  if (!userId && isProtectedRoute(req)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
