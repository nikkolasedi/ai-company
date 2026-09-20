import { auth } from "@/lib/auth";
import { AuditLogPanel } from "@/components/audit/audit-log-panel";
import { UsagePanel } from "@/components/usage/usage-panel";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Audit & Usage</h1>
        <p className="text-zinc-400">
          Activity log and plan usage for {session.user.organizationName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AuditLogPanel />
        </div>
        <UsagePanel />
      </div>
    </div>
  );
}
