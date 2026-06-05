/**
 * Minimal full-screen loading state shown while an OAuth redirect is being
 * processed by the sso-callback routes.
 */
export default function CallbackScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg">
      <div className="w-8 h-8 rounded-full border-2 border-border-strong border-t-accent animate-spin" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
