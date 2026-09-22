"use client";

import { useEffect, useState } from "react";
import type { AgentWithDepartment } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ConnectorOption {
  id: string;
  name: string;
  status: string;
}

interface ProcessMessage {
  id: string;
  content: string;
  createdAt: string;
}

interface DetailTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  handoffNote: string | null;
  handoffReply: string | null;
  handoffAgent: { id: string; name: string } | null;
  grants: { permission: string; connector: { id: string; name: string } }[];
  messages: ProcessMessage[];
  approvals: { id: string; title: string; status: string }[];
}

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  title: string | null;
  status: string;
  model: string;
  permissions: string;
  tools: string[];
  systemInstructions: string | null;
  department: { name: string };
  tasks: DetailTask[];
  incomingHandoff: (DetailTask & { assignedAgent: { id: string; name: string } | null }) | null;
}

const OPEN = new Set(["RUNNING", "AWAITING_APPROVAL", "PENDING"]);

async function postWork(body: Record<string, string>) {
  const res = await fetch("/api/office/work", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not update the office");
  return data as { approvalId?: string | null };
}

export function OfficeAgentPanel({
  agent,
  colleagues,
  onClose,
  onChanged,
  onSelect,
}: {
  agent: AgentWithDepartment;
  colleagues: AgentWithDepartment[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onSelect: (id: string) => void;
}) {
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [connectors, setConnectors] = useState<ConnectorOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [colleagueId, setColleagueId] = useState("");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [connectorId, setConnectorId] = useState("");
  const [permission, setPermission] = useState("DRAFT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setError("");
    Promise.all([
      fetch(`/api/agents/${agent.id}`).then((res) => res.json()),
      fetch("/api/connectors").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([agentDetail, connectorList]) => {
        if (cancelled) return;
        setDetail(agentDetail);
        const list = Array.isArray(connectorList) ? connectorList : [];
        setConnectors(list);
        setConnectorId(list[0]?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this person");
      });
    return () => {
      cancelled = true;
    };
  }, [agent.id, agent.status, agent.currentTask?.id, agent.currentTask?.handoffReply]);

  const task = detail?.tasks.find((item) => OPEN.has(item.status)) ?? null;
  const incoming = detail?.incomingHandoff ?? null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await onChanged();
      const res = await fetch(`/api/agents/${agent.id}`);
      if (res.ok) setDetail(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="absolute inset-y-2 right-2 z-20 flex w-[min(100%-1rem,22rem)] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/95 text-sm text-zinc-200 shadow-none">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{agent.name}</p>
          <p className="truncate text-xs text-zinc-400">
            {agent.title ?? agent.role} · {agent.department.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={agent.status} />
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {error && <p className="rounded-md bg-red-500/10 px-2 py-2 text-red-300">{error}</p>}

        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Configuration</h3>
          <p>Model {detail?.model ?? "…"}</p>
          <p>Permission {detail?.permissions ?? agent.status}</p>
          <p className="text-zinc-400">{detail?.tools?.length ? detail.tools.join(", ") : "No tools listed"}</p>
          {detail?.systemInstructions && (
            <p className="mt-1 line-clamp-3 text-zinc-400">{detail.systemInstructions}</p>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Current task</h3>
          {task ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white">{task.title}</p>
                <Badge status={task.status} />
              </div>
              {task.description && <p className="text-zinc-400">{task.description}</p>}
              {task.handoffAgent && (
                <p>
                  Talking with{" "}
                  <button type="button" className="text-indigo-300" onClick={() => onSelect(task.handoffAgent!.id)}>
                    {task.handoffAgent.name}
                  </button>
                  {task.handoffNote ? `: ${task.handoffNote}` : ""}
                </p>
              )}
              {task.handoffReply && <p className="text-zinc-300">Reply: {task.handoffReply}</p>}
              {task.grants.length > 0 && (
                <ul className="text-zinc-300">
                  {task.grants.map((grant) => (
                    <li key={grant.connector.id}>
                      {grant.connector.name} · {grant.permission}
                    </li>
                  ))}
                </ul>
              )}
              {task.approvals[0] && (
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-md bg-orange-500/20 px-2 py-1 text-orange-200"
                  onClick={() =>
                    run(async () => {
                      const res = await fetch(`/api/approvals/${task.approvals[0].id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "APPROVED" }),
                      });
                      if (!res.ok) throw new Error("Could not approve");
                    })
                  }
                >
                  Approve {task.approvals[0].title}
                </button>
              )}
            </div>
          ) : (
            <p className="text-zinc-500">No task in progress.</p>
          )}
        </section>

        {incoming && (
          <section>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Asked of you</h3>
            <p>
              {incoming.assignedAgent?.name ?? "A colleague"} needs help
              {incoming.handoffNote ? `: ${incoming.handoffNote}` : ""}
            </p>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Your reply"
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
              rows={2}
            />
            <button
              type="button"
              disabled={busy}
              className="mt-2 rounded-md bg-indigo-500 px-3 py-1 text-white disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  await postWork({ action: "reply", taskId: incoming.id, reply });
                  setReply("");
                })
              }
            >
              Send reply
            </button>
          </section>
        )}

        <section>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Process</h3>
          <ol className="space-y-1 text-zinc-300">
            {(task?.messages ?? []).map((message) => (
              <li key={message.id}>{message.content}</li>
            ))}
            {(task?.messages.length ?? 0) === 0 && <li className="text-zinc-500">Nothing has happened yet.</li>}
          </ol>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Assign a task</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What done looks like"
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          />
          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-indigo-500 px-3 py-1 text-white disabled:opacity-50"
            onClick={() =>
              run(async () => {
                await postWork({ action: "assign", agentId: agent.id, title, description });
                setTitle("");
                setDescription("");
              })
            }
          >
            Assign
          </button>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ask a colleague</h3>
          <select
            value={colleagueId}
            onChange={(e) => setColleagueId(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          >
            <option value="">Choose someone</option>
            {colleagues
              .filter((person) => person.id !== agent.id)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} · {person.department.name}
                </option>
              ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What do you need from them?"
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          />
          <button
            type="button"
            disabled={busy}
            className="rounded-md bg-zinc-800 px-3 py-1 disabled:opacity-50"
            onClick={() =>
              run(async () => {
                await postWork({ action: "handoff", agentId: agent.id, toAgentId: colleagueId, note });
                setNote("");
              })
            }
          >
            Send them over
          </button>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Grant a connector</h3>
          {connectors.length === 0 ? (
            <p className="text-zinc-500">No connectors are connected yet.</p>
          ) : (
            <>
              <select
                value={connectorId}
                onChange={(e) => setConnectorId(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
              >
                {connectors.map((connector) => (
                  <option key={connector.id} value={connector.id}>
                    {connector.name}
                  </option>
                ))}
              </select>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
              >
                <option value="READ">Read</option>
                <option value="DRAFT">Draft</option>
                <option value="EXECUTE">Execute</option>
                <option value="EXECUTE_WITH_APPROVAL">Execute with approval</option>
              </select>
              <button
                type="button"
                disabled={busy || !task}
                className="rounded-md bg-zinc-800 px-3 py-1 disabled:opacity-50"
                onClick={() =>
                  run(async () => {
                    if (!task) return;
                    await postWork({
                      action: "grant",
                      taskId: task.id,
                      connectorId,
                      permission,
                    });
                  })
                }
              >
                Grant for this task
              </button>
            </>
          )}
        </section>

        {task && (
          <button
            type="button"
            disabled={busy}
            className="rounded-md border border-zinc-700 px-3 py-1 text-zinc-300 disabled:opacity-50"
            onClick={() =>
              run(async () => {
                await postWork({ action: "complete", taskId: task.id });
              })
            }
          >
            Mark task complete
          </button>
        )}
      </div>
    </aside>
  );
}
