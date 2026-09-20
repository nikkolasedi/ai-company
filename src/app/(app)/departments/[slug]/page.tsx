import { auth } from "@/lib/auth";
import { getDepartmentBySlug } from "@/lib/data/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const { slug } = await params;
  const department = await getDepartmentBySlug(session.user.organizationId, slug);
  if (!department) notFound();

  const activeCount = department.agents.filter(
    (a) => a.status !== "IDLE" && a.status !== "OFFLINE"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/office"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to office
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: department.color }}
          />
          <h1 className="text-2xl font-bold">{department.name}</h1>
        </div>
        <p className="mt-1 text-zinc-400">{department.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{department.agents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{department.tasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {department.agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: department.color + "33",
                    color: department.color,
                  }}
                >
                  {agent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-xs text-zinc-500">{agent.role}</p>
                </div>
                <Badge status={agent.status} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {department.tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No tasks yet</p>
          ) : (
            department.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-zinc-500">
                    {task.assignedAgent?.name ?? "Unassigned"}
                  </p>
                </div>
                <Badge status={task.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
