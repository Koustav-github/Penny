import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[150px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-[150px]" />
      <AppSidebar active="dashboard" />
      <DashboardClient firstName={firstName} email={email} />
    </div>
  );
}
