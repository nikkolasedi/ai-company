import type { AgentStatus, ApprovalStatus, TaskStatus } from "@prisma/client";

export type OfficeEventType =
  | "AGENT_STARTED_TASK"
  | "AGENT_THINKING"
  | "AGENT_DELEGATED"
  | "AGENT_RECEIVED_TASK"
  | "AGENT_COMPLETED"
  | "AGENT_WAITING_APPROVAL"
  | "AGENT_FAILED"
  | "AGENT_TOOL_USED";

export interface OfficeEvent {
  type: OfficeEventType;
  agentId: string;
  agentName: string;
  taskId?: string;
  taskTitle?: string;
  message?: string;
  toolName?: string;
  departmentSlug?: string;
  timestamp: string;
  organizationId: string;
}

export interface ExecutionPlanStep {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  department: string;
  requiresApproval: boolean;
  parallelGroup?: number;
  estimatedMinutes: number;
  estimatedCost: number;
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  summary: string;
  steps: ExecutionPlanStep[];
  participatingAgents: { id: string; name: string; role: string }[];
  estimatedCost: number;
  estimatedMinutes: number;
  requiresApproval: boolean;
}

export interface DashboardStats {
  activeAgents: number;
  totalAgents: number;
  runningTasks: number;
  pendingApprovals: number;
  completedTasks: number;
  failedTasks: number;
  estimatedAiCost: number;
  departmentActivity: { name: string; slug: string; activeAgents: number; color: string }[];
  recentDecisions: { id: string; action: string; resource: string; createdAt: string }[];
}

export interface AgentWithDepartment {
  id: string;
  name: string;
  role: string;
  title: string | null;
  status: AgentStatus;
  avatar: string | null;
  deskX: number;
  deskY: number;
  isOrchestrator: boolean;
  department: { id: string; name: string; slug: string; color: string };
  currentTask?: { id: string; title: string; status: TaskStatus } | null;
}

export interface DepartmentWithAgents {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  officeX: number;
  officeY: number;
  agents: AgentWithDepartment[];
  taskCount: number;
  activeAgentCount: number;
}

export type { AgentStatus, ApprovalStatus, TaskStatus };
