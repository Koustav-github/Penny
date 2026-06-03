'use client'

import { useClerk } from '@clerk/nextjs'

/**
 * Client-side sign-out control for the (server-rendered) sidebar.
 *
 * Uses the imperative `signOut()` rather than Clerk's <SignOutButton>, which
 * runs React.Children.only() on its child — that throws across the server→client
 * boundary when AppSidebar (a Server Component) passes a button subtree into it.
 */
export default function SidebarSignOut() {
  const { signOut } = useClerk()
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: '/' })}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-left"
    >
      <IconSignOut />
      Sign out
    </button>
  )
}

function IconSignOut() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}
