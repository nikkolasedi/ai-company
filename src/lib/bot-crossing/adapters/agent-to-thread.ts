import type { AgentWithDepartment, OfficeEvent } from "@/types";

export interface BotCrossingThread {
  id: string;
  title?: string;
  preview?: string;
  project?: string;
  projectPath?: string;
  createdAt?: number;
  lastActivityAt?: number;
  running?: boolean;
  unread?: boolean;
  hasError?: boolean;
  prState?: string | null;
  archived?: boolean;
  sizeBytes?: number;
}

const celebratingUntil = new Map<string, number>();

export function markAgentCelebrating(agentId: string) {
  celebratingUntil.set(agentId, Date.now() + 5000);
}

export function agentToThread(agent: AgentWithDepartment): BotCrossingThread {
  const now = Date.now();
  const celebrating = (celebratingUntil.get(agent.id) ?? 0) > now;

  return {
    id: agent.id,
    title: agent.currentTask?.title ?? agent.name,
    preview: `${agent.role} · ${agent.department.name}`,
    project: agent.department.slug,
    projectPath: agent.department.slug,
    createdAt: now,
    lastActivityAt: now,
    running: ["WORKING", "THINKING", "DELEGATING"].includes(agent.status),
    unread: agent.status === "WAITING_APPROVAL",
    hasError: agent.status === "FAILED",
    prState: celebrating ? "MERGED" : null,
    archived: false,
    sizeBytes: agent.currentTask ? 50_000 : 8_000,
  };
}

export function agentsToThreads(agents: AgentWithDepartment[]): BotCrossingThread[] {
  const now = Date.now();
  return agents
    .filter((a) => !a.isOrchestrator)
    .map((agent) => {
      const thread = agentToThread(agent);
      if ((celebratingUntil.get(agent.id) ?? 0) <= now) return thread;
      return { ...thread, prState: "MERGED", running: false };
    });
}

export function patchThreadFromEvent(
  thread: BotCrossingThread,
  event: OfficeEvent
): BotCrossingThread {
  const updated: BotCrossingThread = {
    ...thread,
    lastActivityAt: Date.now(),
  };

  switch (event.type) {
    case "AGENT_STARTED_TASK":
    case "AGENT_RECEIVED_TASK":
    case "AGENT_THINKING":
    case "AGENT_TOOL_USED":
      return { ...updated, running: true, unread: false, hasError: false, prState: null };
    case "AGENT_WAITING_APPROVAL":
      return { ...updated, running: false, unread: true, hasError: false };
    case "AGENT_FAILED":
      return { ...updated, running: false, hasError: true, unread: false };
    case "AGENT_COMPLETED":
      markAgentCelebrating(event.agentId);
      return { ...updated, running: false, prState: "MERGED", unread: false };
    case "AGENT_DELEGATED":
      return { ...updated, running: true };
    default:
      return updated;
  }
}
