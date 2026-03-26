import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-black py-12">
      {/* Background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors z-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Home
      </Link>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl relative z-10 shadow-2xl my-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black font-bold text-2xl mb-4 text-center">
            P
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Create an account</h2>
          <p className="text-white/60 text-sm text-center">Start managing your wealth today</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80" htmlFor="name">Full Name</label>
            <input 
              id="name"
              type="text" 
              placeholder="John Doe" 
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              placeholder="you@example.com" 
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-primary hover:bg-primary-hover text-black font-semibold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
