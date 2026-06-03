import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background elements */}
      <div className="absolute inset-0 bg-black -z-10" />
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Navbar placeholder */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xl">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90">
            Penny
          </span>
        </div>
        <nav className="flex gap-4 items-center">
          <Link
            href="/login"
            className="text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Content */}
      <main className="flex flex-col items-center text-center px-4 max-w-4xl pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-medium text-white/70 tracking-wide uppercase">
            The Future of Finance
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 mb-6 drop-shadow-sm">
          Master your wealth,
          <br />
          one cent at a time.
        </h1>
        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl text-balance">
          Penny helps you track expenses, optimize savings, and grow your net
          worth with intelligent insights and beautiful analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="flex items-center justify-center px-8 py-4 rounded-full bg-primary hover:bg-primary-hover text-black font-semibold text-lg transition-all shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transform hover:-translate-y-1"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-lg transition-all backdrop-blur-md"
          >
            Sign In
          </Link>
        </div>

        {/* Feature stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-24 pt-12 border-t border-white/10 w-full opacity-80">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-2">$0</span>
            <span className="text-sm text-white/50 font-medium tracking-wide">
              HIDDEN FEES
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-white mb-2">100%</span>
            <span className="text-sm text-white/50 font-medium tracking-wide">
              DATA CONTROL
            </span>
          </div>
          <div className="flex flex-col justify-center items-center col-span-2 md:col-span-1 md:flex hidden">
            <span className="text-3xl font-bold text-white mb-2">24/7</span>
            <span className="text-sm text-white/50 font-medium tracking-wide">
              ACCESS
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
