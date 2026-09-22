import {
  AgentStatus,
  PermissionLevel,
  TaskStatus,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { officeEventEmitter } from "@/lib/events/emitter";
import type { OfficeEvent } from "@/types";

const OPEN_TASK = [TaskStatus.RUNNING, TaskStatus.PENDING, TaskStatus.AWAITING_APPROVAL];

function emit(event: OfficeEvent) {
  officeEventEmitter.emit(event);
}

async function note(
  tx: Prisma.TransactionClient,
  organizationId: string,
  agentId: string,
  taskId: string,
  content: string
) {
  await tx.message.create({
    data: { content, role: "process", organizationId, agentId, taskId },
  });
}

export async function assignTask(
  organizationId: string,
  agentId: string,
  title: string,
  description: string
) {
  const agent = await db.agent.findFirst({
    where: { id: agentId, organizationId },
    include: { department: true },
  });
  if (!agent) throw new Error("Agent not found");

  const task = await db.$transaction(async (tx) => {
    const open = await tx.task.findMany({
      where: { organizationId, assignedAgentId: agentId, status: { in: OPEN_TASK } },
      select: { id: true, handoffAgentId: true },
    });
    const partners = [
      ...new Set(open.map((item) => item.handoffAgentId).filter((id): id is string => Boolean(id))),
    ];
    await tx.task.updateMany({
      where: { id: { in: open.map((item) => item.id) } },
      data: { status: TaskStatus.CANCELLED, handoffReply: "Replaced by a new task." },
    });
    for (const partnerId of partners) {
      const still = await tx.task.count({
        where: { handoffAgentId: partnerId, handoffReply: null, status: { in: OPEN_TASK } },
      });
      if (still > 0) continue;
      const partnerTask = await tx.task.findFirst({
        where: { assignedAgentId: partnerId, status: TaskStatus.RUNNING },
      });
      await tx.agent.update({
        where: { id: partnerId },
        data: {
          status: partnerTask ? AgentStatus.WORKING : AgentStatus.IDLE,
          currentTaskId: partnerTask?.id ?? null,
        },
      });
    }
    const created = await tx.task.create({
      data: {
        title,
        description: description || null,
        status: TaskStatus.RUNNING,
        organizationId,
        assignedAgentId: agentId,
      },
    });
    await tx.agent.update({
      where: { id: agentId },
      data: { status: AgentStatus.WORKING, currentTaskId: created.id },
    });
    await note(tx, organizationId, agentId, created.id, `Started “${title}”.`);
    return created;
  });

  emit({
    type: "AGENT_STARTED_TASK",
    agentId: agent.id,
    agentName: agent.name,
    taskId: task.id,
    taskTitle: task.title,
    departmentSlug: agent.department.slug,
    organizationId,
    timestamp: new Date().toISOString(),
  });
  return task;
}

export async function handoffTask(
  organizationId: string,
  fromAgentId: string,
  toAgentId: string,
  noteText: string
) {
  if (fromAgentId === toAgentId) throw new Error("Choose a different colleague");
  const [from, to] = await Promise.all([
    db.agent.findFirst({ where: { id: fromAgentId, organizationId }, include: { department: true } }),
    db.agent.findFirst({ where: { id: toAgentId, organizationId }, include: { department: true } }),
  ]);
  if (!from || !to) throw new Error("Agent not found");

  const task = await db.$transaction(async (tx) => {
    let current = await tx.task.findFirst({
      where: { organizationId, assignedAgentId: fromAgentId, status: { in: OPEN_TASK } },
      orderBy: { createdAt: "desc" },
    });
    if (!current) {
      current = await tx.task.create({
        data: {
          title: `Talk with ${to.name}`,
          description: noteText,
          status: TaskStatus.RUNNING,
          organizationId,
          assignedAgentId: fromAgentId,
        },
      });
    }
    const updated = await tx.task.update({
      where: { id: current.id },
      data: {
        status: TaskStatus.RUNNING,
        handoffAgentId: toAgentId,
        handoffNote: noteText,
        handoffReply: null,
      },
    });
    await tx.agent.update({
      where: { id: fromAgentId },
      data: { status: AgentStatus.DELEGATING, currentTaskId: updated.id },
    });
    await tx.agent.update({
      where: { id: toAgentId },
      data: { status: AgentStatus.DELEGATING },
    });
    await note(
      tx,
      organizationId,
      fromAgentId,
      updated.id,
      `Asked ${to.name}: ${noteText}`
    );
    return updated;
  });

  const now = new Date().toISOString();
  emit({
    type: "AGENT_DELEGATED",
    agentId: from.id,
    agentName: from.name,
    taskId: task.id,
    taskTitle: task.title,
    message: `to ${to.name}`,
    departmentSlug: from.department.slug,
    organizationId,
    timestamp: now,
  });
  return task;
}

export async function replyToHandoff(organizationId: string, taskId: string, reply: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, organizationId },
    include: { assignedAgent: true, handoffAgent: true },
  });
  if (!task?.assignedAgent || !task.handoffAgentId) throw new Error("Nothing to reply to");

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: { handoffReply: reply, status: TaskStatus.RUNNING },
    });
    await tx.agent.update({
      where: { id: task.assignedAgentId! },
      data: { status: AgentStatus.WORKING, currentTaskId: task.id },
    });
    if (task.handoffAgentId) {
      const stillNeeded = await tx.task.count({
        where: {
          organizationId,
          handoffAgentId: task.handoffAgentId,
          handoffReply: null,
          id: { not: task.id },
          status: { in: OPEN_TASK },
        },
      });
      if (stillNeeded === 0) {
        const partnerTask = await tx.task.findFirst({
          where: { organizationId, assignedAgentId: task.handoffAgentId, status: TaskStatus.RUNNING },
        });
        await tx.agent.update({
          where: { id: task.handoffAgentId },
          data: {
            status: partnerTask ? AgentStatus.WORKING : AgentStatus.IDLE,
            currentTaskId: partnerTask?.id ?? null,
          },
        });
      }
    }
    await note(
      tx,
      organizationId,
      task.handoffAgentId!,
      task.id,
      `${task.handoffAgent?.name ?? "Colleague"} replied: ${reply}`
    );
  });

  emit({
    type: "AGENT_STARTED_TASK",
    agentId: task.assignedAgent.id,
    agentName: task.assignedAgent.name,
    taskId: task.id,
    taskTitle: task.title,
    message: "Handoff answered",
    organizationId,
    timestamp: new Date().toISOString(),
  });
  return task;
}

export async function grantConnector(
  organizationId: string,
  taskId: string,
  connectorId: string,
  permission: PermissionLevel
) {
  const task = await db.task.findFirst({
    where: { id: taskId, organizationId, status: { in: OPEN_TASK } },
    include: { assignedAgent: { include: { department: true } } },
  });
  if (!task?.assignedAgent) throw new Error("Task not found");
  const connector = await db.connector.findFirst({
    where: { id: connectorId, organizationId },
  });
  if (!connector) throw new Error("Connector not found");

  const needsApproval = permission === PermissionLevel.EXECUTE_WITH_APPROVAL;
  const approval = await db.$transaction(async (tx) => {
    if (!needsApproval) {
      await tx.taskGrant.upsert({
        where: { taskId_connectorId: { taskId, connectorId } },
        create: { taskId, connectorId, permission },
        update: { permission },
      });
    }
    await note(
      tx,
      organizationId,
      task.assignedAgentId!,
      task.id,
      needsApproval
        ? `Asked to use ${connector.name} (${permission}). Waiting for approval.`
        : `Granted ${connector.name} at ${permission}.`
    );
    if (!needsApproval) {
      const stillTalking = Boolean(task.handoffAgentId && !task.handoffReply);
      await tx.agent.update({
        where: { id: task.assignedAgentId! },
        data: {
          status: stillTalking ? AgentStatus.DELEGATING : AgentStatus.WORKING,
          currentTaskId: task.id,
        },
      });
      return null;
    }
    await tx.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.AWAITING_APPROVAL },
    });
    await tx.agent.update({
      where: { id: task.assignedAgentId! },
      data: { status: AgentStatus.WAITING_APPROVAL, currentTaskId: task.id },
    });
    return tx.approval.create({
      data: {
        title: `Use ${connector.name}`,
        description: `${task.assignedAgent!.name} needs ${permission} on ${connector.name} for “${task.title}”.`,
        actionType: "connector.grant",
        payload: { taskId, connectorId, permission },
        organizationId,
        taskId: task.id,
      },
    });
  });

  emit({
    type: needsApproval ? "AGENT_WAITING_APPROVAL" : "AGENT_TOOL_USED",
    agentId: task.assignedAgent.id,
    agentName: task.assignedAgent.name,
    taskId: task.id,
    taskTitle: task.title,
    toolName: connector.name,
    departmentSlug: task.assignedAgent.department.slug,
    organizationId,
    timestamp: new Date().toISOString(),
  });
  return { approvalId: approval?.id ?? null };
}

function connectorGrant(payload: Prisma.JsonValue | null) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const connectorId = "connectorId" in payload ? payload.connectorId : null;
  const permission = "permission" in payload ? payload.permission : null;
  if (typeof connectorId !== "string" || typeof permission !== "string") return null;
  if (!Object.values(PermissionLevel).includes(permission as PermissionLevel)) return null;
  return { connectorId, permission: permission as PermissionLevel };
}

export async function resumeAfterApproval(taskId: string, approved: boolean) {
  const task = await db.task.findFirst({
    where: { id: taskId },
    include: { assignedAgent: { include: { department: true } } },
  });
  if (!task?.assignedAgentId || !task.assignedAgent) return;

  const approval = await db.approval.findFirst({
    where: { taskId: task.id, actionType: "connector.grant" },
    orderBy: { createdAt: "desc" },
  });
  const grant = connectorGrant(approval?.payload ?? null);
  const stillTalking = Boolean(task.handoffAgentId && !task.handoffReply);

  await db.$transaction(async (tx) => {
    if (grant && approved) {
      await tx.taskGrant.upsert({
        where: { taskId_connectorId: { taskId: task.id, connectorId: grant.connectorId } },
        create: { taskId: task.id, connectorId: grant.connectorId, permission: grant.permission },
        update: { permission: grant.permission },
      });
    }
    if (grant && !approved) {
      await tx.taskGrant.deleteMany({
        where: { taskId: task.id, connectorId: grant.connectorId },
      });
    }
    await tx.task.update({ where: { id: task.id }, data: { status: TaskStatus.RUNNING } });
    await tx.agent.update({
      where: { id: task.assignedAgentId! },
      data: {
        status: stillTalking ? AgentStatus.DELEGATING : AgentStatus.WORKING,
        currentTaskId: task.id,
      },
    });
    await tx.message.create({
      data: {
        content: approved
          ? "Approval granted. Continuing the task."
          : "Approval was declined. The task continues without that connector.",
        role: "process",
        organizationId: task.organizationId,
        agentId: task.assignedAgentId,
        taskId: task.id,
      },
    });
  });

  emit({
    type: stillTalking ? "AGENT_DELEGATED" : "AGENT_STARTED_TASK",
    agentId: task.assignedAgent.id,
    agentName: task.assignedAgent.name,
    taskId: task.id,
    taskTitle: task.title,
    message: approved ? "Approval granted" : "Approval declined",
    departmentSlug: task.assignedAgent.department.slug,
    organizationId: task.organizationId,
    timestamp: new Date().toISOString(),
  });
}

export async function completeTask(organizationId: string, taskId: string) {
  const task = await db.task.findFirst({
    where: { id: taskId, organizationId },
    include: { assignedAgent: { include: { department: true } }, handoffAgent: true },
  });
  if (!task?.assignedAgent) throw new Error("Task not found");

  await db.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        handoffReply: task.handoffReply ?? "Done.",
      },
    });
    await tx.agent.update({
      where: { id: task.assignedAgentId! },
      data: { status: AgentStatus.IDLE, currentTaskId: null },
    });
    if (task.handoffAgentId) {
      const still = await tx.task.count({
        where: {
          handoffAgentId: task.handoffAgentId,
          handoffReply: null,
          status: { in: OPEN_TASK },
          id: { not: task.id },
        },
      });
      if (still === 0) {
        const partnerTask = await tx.task.findFirst({
          where: {
            assignedAgentId: task.handoffAgentId,
            status: TaskStatus.RUNNING,
          },
        });
        await tx.agent.update({
          where: { id: task.handoffAgentId },
          data: {
            status: partnerTask ? AgentStatus.WORKING : AgentStatus.IDLE,
            currentTaskId: partnerTask?.id ?? null,
          },
        });
      }
    }
    await note(tx, organizationId, task.assignedAgentId!, task.id, `Finished “${task.title}”.`);
  });

  emit({
    type: "AGENT_COMPLETED",
    agentId: task.assignedAgent.id,
    agentName: task.assignedAgent.name,
    taskId: task.id,
    taskTitle: task.title,
    departmentSlug: task.assignedAgent.department.slug,
    organizationId,
    timestamp: new Date().toISOString(),
  });
}
