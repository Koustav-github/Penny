"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface DashboardClientProps {
  firstName: string;
  email: string;
}

export default function DashboardClient({ firstName, email }: DashboardClientProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      try {
        const res = await fetch("http://localhost:8000/users/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_id: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
          }),
        });
        console.log(res);
      } catch (error) {
        console.error("Failed to sync user:", error);
      }
    };

    if (isLoaded && isSignedIn) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  // Placeholder financial data — will be replaced with real backend data
  const netWorth = 24850.0;
  const assets = [
    { name: "HDFC Bank", type: "Bank", balance: 12400.0 },
    { name: "Zerodha Portfolio", type: "Stock", balance: 8200.0 },
    { name: "Bitcoin", type: "Crypto", balance: 2100.0 },
    { name: "Cash", type: "Cash", balance: 2150.0 },
  ];
  const monthlyChange = +3.2;

  const assetTypeColors: Record<string, string> = {
    Bank: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    Stock: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    Crypto: "bg-orange-500/20 text-orange-400 border-orange-500/20",
    Cash: "bg-purple-500/20 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[180px] rounded-full pointer-events-none -z-0" />

      {/* Sidebar */}
      <aside className="w-60 min-h-screen border-r border-white/5 bg-white/[0.02] flex flex-col px-4 py-6 shrink-0 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xl">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-white/90">
            Penny
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          <NavItem href="/dashboard" label="Dashboard" active icon={<IconGrid />} />
          <NavItem href="/assets" label="Assets" icon={<IconWallet />} />
          <NavItem href="/expenses" label="Expenses" icon={<IconReceipt />} />
          <NavItem href="/analytics" label="Analytics" icon={<IconChart />} />
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white/90 truncate">
                {firstName}
              </span>
              <span className="text-xs text-white/40 truncate">{email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Good morning, {firstName}
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Here&apos;s your financial overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live
            </div>
            <Link
              href="/api/auth/signout"
              className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              Sign out
            </Link>
          </div>
        </header>

        {/* Dashboard body */}
        <div className="flex-1 px-8 py-8 space-y-8">
          {/* Net worth card */}
          <div className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-2">
              Net Worth
            </p>
            <div className="flex items-end gap-4 flex-wrap">
              <span className="text-6xl font-bold text-white tracking-tight">
                ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`mb-2 inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                  monthlyChange >= 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {monthlyChange >= 0 ? "▲" : "▼"} {Math.abs(monthlyChange)}% this month
              </span>
            </div>
            <p className="text-sm text-white/30 mt-3">
              Across {assets.length} assets
            </p>
          </div>

          {/* Assets section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white/80">Assets</h2>
              <Link
                href="/assets"
                className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
              >
                Manage →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.name}
                  className="rounded-xl bg-white/[0.03] border border-white/8 p-5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-white/80 truncate">
                      {asset.name}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        assetTypeColors[asset.type] ??
                        "bg-white/10 text-white/50 border-white/10"
                      }`}
                    >
                      {asset.type}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    ${asset.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {((asset.balance / netWorth) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <h2 className="text-base font-semibold text-white/80 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <QuickAction label="Add Asset" />
              <QuickAction label="Log Expense" />
              <QuickAction label="View Reports" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-white/50 hover:text-white/80 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all">
      {label}
    </button>
  );
}

function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
