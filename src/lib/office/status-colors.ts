import type { AgentStatus } from "@/types";

export const STATUS_COLORS: Record<AgentStatus, string> = {
  IDLE: "#71717a",
  WORKING: "#3b82f6",
  THINKING: "#f59e0b",
  WAITING_APPROVAL: "#f97316",
  DELEGATING: "#06b6d4",
  FAILED: "#ef4444",
  OFFLINE: "#52525b",
};
