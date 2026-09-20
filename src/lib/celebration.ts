const CELEBRATE_MS = 5000;
const celebratingUntil = new Map<string, number>();

export function markCelebrating(agentId: string, durationMs = CELEBRATE_MS) {
  celebratingUntil.set(agentId, Date.now() + durationMs);
}

export function isCelebrating(agentId: string, now = Date.now()): boolean {
  const until = celebratingUntil.get(agentId);
  if (!until) return false;
  if (now >= until) {
    celebratingUntil.delete(agentId);
    return false;
  }
  return true;
}
