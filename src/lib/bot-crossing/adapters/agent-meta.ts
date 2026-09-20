/** Stable per-agent timestamps for bot-crossing thread mapping. */
const agentCreatedAt = new Map<string, number>();
const agentLastActivity = new Map<string, number>();

export function ensureAgentMeta(agentId: string, createdAt?: number) {
  if (!agentCreatedAt.has(agentId)) {
    agentCreatedAt.set(agentId, createdAt ?? Date.now());
  }
  if (!agentLastActivity.has(agentId)) {
    agentLastActivity.set(agentId, Date.now());
  }
}

export function touchAgentActivity(agentId: string) {
  ensureAgentMeta(agentId);
  agentLastActivity.set(agentId, Date.now());
}

export function getAgentCreatedAt(agentId: string): number {
  return agentCreatedAt.get(agentId) ?? Date.now();
}

export function getAgentLastActivity(agentId: string): number {
  return agentLastActivity.get(agentId) ?? Date.now();
}
