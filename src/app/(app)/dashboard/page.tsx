import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/queries";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { BrainGraph } from "@/components/knowledge/brain-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const stats = await getDashboardStats(session.user.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Dashboard</h1>
        <p className="text-zinc-400">{session.user.organizationName} — health overview</p>
      </div>

      <StatsGrid stats={stats} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Brain</CardTitle>
          <Link href="/brain" className="text-xs text-indigo-400 hover:underline">
            View full brain →
          </Link>
        </CardHeader>
        <CardContent>
          <BrainGraph height={260} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.departmentActivity.map((dept) => (
              <Link
                key={dept.slug}
                href={`/departments/${dept.slug}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <span className="text-sm font-medium">{dept.name}</span>
                </div>
                <span className="text-sm text-zinc-400">
                  {dept.activeAgents} active
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentDecisions.length === 0 ? (
              <p className="text-sm text-zinc-500">No recent activity</p>
            ) : (
              stats.recentDecisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{d.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-zinc-500">{d.resource}</p>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {formatRelativeTime(d.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
