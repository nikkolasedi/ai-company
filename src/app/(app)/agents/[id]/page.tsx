import { auth } from "@/lib/auth";
import { getAgentById } from "@/lib/data/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AgentMemoryPanel } from "@/components/agents/agent-memory-panel";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const { id } = await params;
  const agent = await getAgentById(session.user.organizationId, id);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/departments/${agent.department.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {agent.department.name}
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold"
              style={{
                backgroundColor: agent.department.color + "33",
                color: agent.department.color,
              }}
            >
              {agent.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <p className="text-zinc-400">
                {agent.title ?? agent.role} · {agent.department.name}
              </p>
              {agent.isOrchestrator && (
                <span className="mt-1 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
                  CEO / Orchestrator
                </span>
              )}
            </div>
          </div>
          <Badge status={agent.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-zinc-500">Model</p>
              <p>{agent.model}</p>
            </div>
            <div>
              <p className="text-zinc-500">Permissions</p>
              <Badge status={agent.permissions} />
            </div>
            <div>
              <p className="text-zinc-500">Tools</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {agent.tools.map((t) => (
                  <span key={t} className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500">System Instructions</p>
              <p className="mt-1 rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
                {agent.systemInstructions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agent.tasks.length === 0 ? (
              <p className="text-sm text-zinc-500">No tasks yet</p>
            ) : (
              agent.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.result && (
                      <p className="mt-1 text-xs text-zinc-500">{task.result}</p>
                    )}
                  </div>
                  <Badge status={task.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AgentMemoryPanel
        agentId={agent.id}
        initialMemories={agent.memories.map((m) => ({
          id: m.id,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
