import type { AgentWithDepartment, OfficeEvent } from "@/types";
import { isCelebrating, markCelebrating } from "@/lib/celebration";
import {
  ensureAgentMeta,
  getAgentCreatedAt,
  getAgentLastActivity,
  touchAgentActivity,
} from "./agent-meta";

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

export function markAgentCelebrating(agentId: string) {
  markCelebrating(agentId);
  touchAgentActivity(agentId);
}

function statusFlags(agent: AgentWithDepartment) {
  const celebrating = isCelebrating(agent.id);
  return {
    running: ["WORKING", "THINKING", "DELEGATING"].includes(agent.status),
    unread: agent.status === "WAITING_APPROVAL",
    hasError: agent.status === "FAILED",
    prState: celebrating ? "MERGED" : null,
  };
}

export function agentToThread(agent: AgentWithDepartment): BotCrossingThread {
  ensureAgentMeta(agent.id);
  const flags = statusFlags(agent);

  return {
    id: agent.id,
    title: agent.currentTask?.title ?? agent.name,
    preview: `${agent.role} · ${agent.department.name}`,
    project: agent.department.slug,
    projectPath: agent.department.slug,
    createdAt: getAgentCreatedAt(agent.id),
    lastActivityAt: getAgentLastActivity(agent.id),
    ...flags,
    archived: false,
    sizeBytes: agent.currentTask ? 50_000 : 8_000,
  };
}

export function agentsToThreads(agents: AgentWithDepartment[]): BotCrossingThread[] {
  return agents
    .filter((a) => !a.isOrchestrator)
    .map(agentToThread);
}

export function mergeAgentIntoThread(
  existing: BotCrossingThread | undefined,
  agent: AgentWithDepartment
): BotCrossingThread {
  const base = agentToThread(agent);
  if (!existing) return base;

  return {
    ...base,
    createdAt: existing.createdAt ?? base.createdAt,
    // Preserve celebration from SSE until agent poll catches up
    prState: existing.prState === "MERGED" || base.prState === "MERGED" ? "MERGED" : null,
    running: base.running || existing.running,
    unread: base.unread || existing.unread,
    hasError: base.hasError || existing.hasError,
    lastActivityAt: Math.max(existing.lastActivityAt ?? 0, base.lastActivityAt ?? 0),
  };
}

export function patchThreadFromEvent(
  thread: BotCrossingThread,
  event: OfficeEvent
): BotCrossingThread {
  if (!event.agentId) return thread;
  touchAgentActivity(event.agentId);

  const updated: BotCrossingThread = {
    ...thread,
    lastActivityAt: getAgentLastActivity(event.agentId),
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
