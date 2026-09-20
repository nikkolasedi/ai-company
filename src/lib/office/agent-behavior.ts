import type { AgentStatus } from "@prisma/client";

/** Bot-crossing-style visual behaviour — first match wins for badge priority. */
export type VisualBehavior =
  | "blocked"
  | "waiting"
  | "working"
  | "celebrating"
  | "delegating"
  | "idle"
  | "sleeping";

export type BadgeKind = "none" | "waiting" | "blocked" | "working" | "done";

export type FaceExpression =
  | "neutral"
  | "happy"
  | "think"
  | "alert"
  | "sleep"
  | "sad"
  | "celebrate";

export const BADGE_FOR: Record<VisualBehavior, BadgeKind> = {
  waiting: "waiting",
  blocked: "blocked",
  working: "working",
  celebrating: "done",
  delegating: "working",
  idle: "none",
  sleeping: "none",
};

export const FACE_FOR: Record<VisualBehavior, FaceExpression> = {
  blocked: "sad",
  waiting: "alert",
  working: "think",
  celebrating: "celebrate",
  delegating: "think",
  idle: "neutral",
  sleeping: "sleep",
};

const CELEBRATE_MS = 2800;

const celebrateUntil = new Map<string, number>();

export function markCelebrating(agentId: string) {
  celebrateUntil.set(agentId, Date.now() + CELEBRATE_MS);
}

export function visualBehaviorFor(
  status: AgentStatus,
  agentId: string,
  now = Date.now()
): VisualBehavior {
  const until = celebrateUntil.get(agentId);
  if (until && now < until) return "celebrating";
  if (until && now >= until) celebrateUntil.delete(agentId);

  switch (status) {
    case "FAILED":
      return "blocked";
    case "WAITING_APPROVAL":
      return "waiting";
    case "WORKING":
    case "THINKING":
      return "working";
    case "DELEGATING":
      return "delegating";
    case "OFFLINE":
      return "sleeping";
    default:
      return "idle";
  }
}

export function shouldStand(behavior: VisualBehavior): boolean {
  return behavior === "waiting" || behavior === "blocked" || behavior === "celebrating";
}

export function walkSpeedFor(behavior: VisualBehavior): number {
  if (behavior === "celebrating") return 2.4;
  if (behavior === "delegating") return 2.1;
  return 1.9;
}

/** Office entrance — south door where agents arrive. */
export const OFFICE_ENTRANCE: [number, number, number] = [9, 0, 13.2];
