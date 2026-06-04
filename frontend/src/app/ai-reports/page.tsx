import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import AIReportsClient from "./AIReportsClient";

export default async function AIReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[160px]" />
      <AppSidebar active="ai-reports" />
      <main className="flex-1 flex flex-col min-h-screen relative z-10 pt-14 lg:pt-0">
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-4 border-b border-border">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
              AI Reports
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent align-middle">
                Beta
              </span>
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Let Penny analyze your money and tell you what to do next
            </p>
          </div>
        </header>
        <AIReportsClient />
      </main>
    </div>
  );
}
