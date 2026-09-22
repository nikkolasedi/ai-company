import { AgentStatus, TaskStatus, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AgentWithDepartment, DashboardStats, OfficeTask } from "@/types";

export async function getDepartmentsWithAgents(organizationId: string) {
  const departments = await db.department.findMany({
    where: { organizationId },
    include: {
      agents: {
        include: {
          department: { select: { id: true, name: true, slug: true, color: true } },
        },
      },
      _count: { select: { agents: true } },
    },
    orderBy: { name: "asc" },
  });

  const tasks = await db.task.groupBy({
    by: ["assignedAgentId"],
    where: { organizationId, status: { in: [TaskStatus.RUNNING, TaskStatus.PENDING] } },
    _count: true,
  });

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    color: dept.color,
    description: dept.description,
    officeX: dept.officeX,
    officeY: dept.officeY,
    agents: dept.agents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      title: a.title,
      status: a.status,
      avatar: a.avatar,
      deskX: a.deskX,
      deskY: a.deskY,
      isOrchestrator: a.isOrchestrator,
      department: a.department,
    })),
    taskCount: dept.agents.reduce((sum, a) => {
      const t = tasks.find((tk) => tk.assignedAgentId === a.id);
      return sum + (t?._count ?? 0);
    }, 0),
    activeAgentCount: dept.agents.filter(
      (a) => a.status !== AgentStatus.IDLE && a.status !== AgentStatus.OFFLINE
    ).length,
  }));
}

const openTaskInclude = {
  grants: { include: { connector: { select: { id: true, name: true } } } },
} satisfies Prisma.TaskInclude;

function toOfficeTask(
  task: Prisma.TaskGetPayload<{ include: typeof openTaskInclude }>
): OfficeTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    description: task.description,
    handoffAgentId: task.handoffAgentId,
    handoffNote: task.handoffNote,
    handoffReply: task.handoffReply,
    grants: task.grants.map((grant) => ({
      connectorId: grant.connectorId,
      connectorName: grant.connector.name,
      permission: grant.permission,
    })),
  };
}

export async function getAgents(organizationId: string): Promise<AgentWithDepartment[]> {
  const [agents, tasks] = await Promise.all([
    db.agent.findMany({
      where: { organizationId },
      include: {
        department: { select: { id: true, name: true, slug: true, color: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.task.findMany({
      where: {
        organizationId,
        status: { in: [TaskStatus.RUNNING, TaskStatus.AWAITING_APPROVAL] },
      },
      include: openTaskInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return agents.map((agent) => {
    const own = tasks.find((task) => task.assignedAgentId === agent.id);
    const incoming = tasks.find(
      (task) => task.handoffAgentId === agent.id && !task.handoffReply && task.assignedAgentId !== agent.id
    );
    const outgoing = own?.handoffAgentId && !own.handoffReply ? own.handoffAgentId : null;
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      title: agent.title,
      status: agent.status,
      avatar: agent.avatar,
      deskX: agent.deskX,
      deskY: agent.deskY,
      isOrchestrator: agent.isOrchestrator,
      department: agent.department,
      currentTask: own ? toOfficeTask(own) : null,
      meetAgentId: outgoing || incoming?.assignedAgentId || null,
      meetWalk: Boolean(outgoing),
    };
  });
}

export async function getAgentById(organizationId: string, agentId: string) {
  const agent = await db.agent.findFirst({
    where: { id: agentId, organizationId },
    include: {
      department: true,
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          grants: { include: { connector: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: "asc" }, take: 20 },
          handoffAgent: { select: { id: true, name: true } },
          approvals: { where: { status: "PENDING" }, take: 3 },
        },
      },
      memories: { orderBy: { createdAt: "desc" }, take: 5 },
      metrics: { orderBy: { recordedAt: "desc" }, take: 5 },
    },
  });
  return agent;
}

export async function getDepartmentBySlug(organizationId: string, slug: string) {
  const department = await db.department.findFirst({
    where: { organizationId, slug },
    include: {
      agents: {
        include: {
          department: { select: { id: true, name: true, slug: true, color: true } },
        },
      },
    },
  });

  if (!department) return null;

  const tasks = await db.task.findMany({
    where: {
      organizationId,
      assignedAgentId: { in: department.agents.map((a) => a.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { assignedAgent: { select: { name: true } } },
  });

  return { ...department, tasks };
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const [
    agents,
    runningTasks,
    pendingApprovals,
    completedTasks,
    failedTasks,
    departments,
    recentDecisions,
    costAgg,
  ] = await Promise.all([
    db.agent.findMany({ where: { organizationId }, select: { status: true } }),
    db.task.count({ where: { organizationId, status: TaskStatus.RUNNING } }),
    db.approval.count({ where: { organizationId, status: "PENDING" } }),
    db.task.count({ where: { organizationId, status: TaskStatus.COMPLETED } }),
    db.task.count({ where: { organizationId, status: TaskStatus.FAILED } }),
    db.department.findMany({
      where: { organizationId },
      include: { agents: { select: { status: true } } },
    }),
    db.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.task.aggregate({
      where: { organizationId },
      _sum: { estimatedCost: true },
    }),
  ]);

  const activeAgents = agents.filter(
    (a) => a.status !== AgentStatus.IDLE && a.status !== AgentStatus.OFFLINE
  ).length;

  return {
    activeAgents,
    totalAgents: agents.length,
    runningTasks,
    pendingApprovals,
    completedTasks,
    failedTasks,
    estimatedAiCost: costAgg._sum.estimatedCost ?? 0,
    departmentActivity: departments.map((d) => ({
      name: d.name,
      slug: d.slug,
      color: d.color,
      activeAgents: d.agents.filter(
        (a) => a.status !== AgentStatus.IDLE && a.status !== AgentStatus.OFFLINE
      ).length,
    })),
    recentDecisions: recentDecisions.map((l) => ({
      id: l.id,
      action: l.action,
      resource: l.resource,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export async function getApprovals(organizationId: string) {
  return db.approval.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { task: { select: { title: true } } },
  });
}
