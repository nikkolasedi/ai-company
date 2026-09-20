import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      organizationName={session.user.organizationName}
      userName={session.user.name}
    >
      <div className="p-3 sm:p-4 lg:p-6">{children}</div>
    </AppShell>
  );
}
