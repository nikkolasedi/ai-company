import { AgentStatus, ExecutionStatus, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { providerForModel, getAIProvider } from "@/lib/ai/provider";
import { officeEventEmitter } from "@/lib/events/emitter";
import type { ExecutionPlan, ExecutionPlanStep, OfficeEvent } from "@/types";
import { buildAgentSystemPrompt } from "./prompt-builder";
import { routeTask } from "./router";
import { executeTool, getAllowedTools, refreshMcpDiscovery } from "./connectors";
import { waitForApproval, resolveApproval } from "./approval-gate";
import { skillNamesForAgent } from "./skills";
import { planTeamPieces, synthesizeTeam, teamIntent } from "./teams";

const runningExecutions = new Set<string>();

function emit(
  type: OfficeEvent["type"],
  agent: { id: string; name: string },
  organizationId: string,
  extra?: Partial<OfficeEvent>
) {
  officeEventEmitter.emit({
    type,
    agentId: agent.id,
    agentName: agent.name,
    organizationId,
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

interface PlanStepDraft {
  title: string;
  description: string;
  departmentSlug: string;
  requiresApproval?: boolean;
}

export async function submitGoal(
  organizationId: string,
  goal: string,
  options?: { team?: boolean }
): Promise<ExecutionPlan> {
  const useTeam = options?.team ?? teamIntent(goal);
  const agents = await db.agent.findMany({
    where: { organizationId },
    include: { department: true },
  });

  const ceo = agents.find((a) => a.isOrchestrator);
  const provider = ceo ? providerForModel(ceo.model) : getAIProvider();

  const roster = agents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    department: a.department.slug,
    skills: skillNamesForAgent(a.id, a.department.slug),
  }));

  let steps: ExecutionPlanStep[] = [];

  try {
    const systemPrompt = `You are the CEO orchestrator. Create an execution JSON plan for the company goal.
Return ONLY valid JSON with this shape:
{"steps":[{"title":"...","description":"...","departmentSlug":"marketing|sales|finance|operations|technology|customer-communication","requiresApproval":false}]}
Include 2-5 steps. Last step should be executive synthesis assigned to operations department.
JSON plan`;

    const result = await provider.complete({
      systemPrompt,
      userPrompt: `Goal: ${goal}\n\nAgents: ${JSON.stringify(roster)}`,
      maxTokens: 1500,
    });

    const parsed = JSON.parse(
      result.content.match(/\{[\s\S]*\}/)?.[0] ?? '{"steps":[]}'
    ) as { steps: PlanStepDraft[] };

    let stepNum = 0;
    for (const draft of parsed.steps ?? []) {
      const routed = await routeTask(agents, draft.departmentSlug, draft.description, ceo?.model);
      const agent = agents.find((a) => a.id === routed.agentId);
      if (!agent) continue;

      steps.push({
        id: `step-${++stepNum}`,
        title: draft.title || routed.title,
        description: draft.description,
        agentId: agent.id,
        agentName: agent.name,
        department: agent.department.name,
        requiresApproval: draft.requiresApproval ?? routed.needsApproval,
        estimatedMinutes: 3 + Math.floor(Math.random() * 5),
        estimatedCost: 0.08 + Math.random() * 0.15,
      });
    }
  } catch (e) {
    console.warn("[Orchestrator] AI planning failed, using fallback:", e);
    steps = buildFallbackPlan(agents, goal);
  }

  if (!steps.length) {
    steps = buildFallbackPlan(agents, goal);
  }

  if (useTeam) {
    const teamDept =
      steps.find((s) => /marketing|sales/i.test(s.department))?.department ??
      steps[1]?.department;
    const deptSlug = agents.find((a) => a.department.name === teamDept)?.department.slug ?? "marketing";
    const { pieces, why, solo } = await planTeamPieces(agents, deptSlug, goal, ceo?.model);

    if (!solo && pieces.length > 1) {
      const lead = agents.find((a) => a.id === pieces[0].agentId) ?? agents[0];
      steps = steps.filter((s) => s.department !== teamDept);
      steps.splice(1, 0, {
        id: "step-team",
        title: `Team execution: ${deptSlug}`,
        description: why || goal,
        agentId: lead.id,
        agentName: lead.name,
        department: lead.department.name,
        requiresApproval: /send|email|outreach/i.test(goal),
        team: true,
        teamPieces: pieces.map((p) => ({
          agentId: p.agentId,
          agentName: p.agentName,
          title: p.title,
          description: p.text,
        })),
        estimatedMinutes: 8,
        estimatedCost: 0.25,
      });
    }
  }

  const participatingAgents = [
    ...new Map(
      steps.map((s) => [s.agentId, { id: s.agentId, name: s.agentName, role: s.department }])
    ).values(),
  ];

  const estimatedCost = steps.reduce((sum, s) => sum + s.estimatedCost, 0);
  const estimatedMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  const goalRecord = await db.goal.create({
    data: {
      title: goal.slice(0, 200),
      description: goal,
      status: "PLANNED",
      organizationId,
    },
  });

  const execution = await db.execution.create({
    data: {
      status: ExecutionStatus.PLANNED,
      estimatedCost,
      estimatedMinutes,
      organizationId,
      goalId: goalRecord.id,
      planJson: JSON.parse(JSON.stringify({ goal, steps, participatingAgents })),
    },
  });

  return {
    id: execution.id,
    goal,
    summary: `AI plan with ${steps.length} steps involving ${participatingAgents.length} agents${useTeam ? " (team mode)" : ""}`,
    steps,
    participatingAgents,
    estimatedCost,
    estimatedMinutes,
    requiresApproval: steps.some((s) => s.requiresApproval),
    isTeam: useTeam,
  };
}

type AgentWithDept = Awaited<
  ReturnType<
    typeof db.agent.findMany<{ include: { department: true } }>
  >
>[number];

function buildFallbackPlan(agents: AgentWithDept[], goal: string): ExecutionPlanStep[] {
  const ceo = agents.find((a) => a.isOrchestrator);
  const marketing = agents.find((a) => a.department.slug === "marketing");
  const ops = agents.find((a) => a.department.slug === "operations" && !a.isOrchestrator);
  const steps: ExecutionPlanStep[] = [];
  let n = 0;

  if (ceo) {
    steps.push({
      id: `step-${++n}`,
      title: "Analyze goal and plan",
      description: goal,
      agentId: ceo.id,
      agentName: ceo.name,
      department: ceo.department.name,
      requiresApproval: false,
      estimatedMinutes: 2,
      estimatedCost: 0.05,
    });
  }
  if (marketing) {
    steps.push({
      id: `step-${++n}`,
      title: "Research and draft",
      description: `Research and draft deliverable for: ${goal}`,
      agentId: marketing.id,
      agentName: marketing.name,
      department: marketing.department.name,
      requiresApproval: false,
      estimatedMinutes: 5,
      estimatedCost: 0.12,
    });
  }
  if (ops) {
    steps.push({
      id: `step-${++n}`,
      title: "Operational execution",
      description: `Execute plan for: ${goal}`,
      agentId: ops.id,
      agentName: ops.name,
      department: ops.department.name,
      requiresApproval: /send|email|outreach/i.test(goal),
      estimatedMinutes: 4,
      estimatedCost: 0.1,
    });
  }
  return steps;
}

export async function startExecution(executionId: string): Promise<void> {
  if (runningExecutions.has(executionId)) return;
  runningExecutions.add(executionId);

  let failed = false;

  try {
    await refreshMcpDiscovery();

    const execution = await db.execution.findUniqueOrThrow({
      where: { id: executionId },
    });

    const plan = execution.planJson as unknown as {
      goal: string;
      steps: ExecutionPlanStep[];
    };

    await db.execution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.RUNNING },
    });

    if (execution.goalId) {
      await db.goal.update({
        where: { id: execution.goalId },
        data: { status: "RUNNING" },
      });
    }

    const ceo = await db.agent.findFirst({
      where: { organizationId: execution.organizationId, isOrchestrator: true },
    });

    const processedGroups = new Set<number>();
    let previousAgentId: string | null = null;

    for (const step of plan.steps) {
      if (step.parallelGroup !== undefined) {
        if (processedGroups.has(step.parallelGroup)) continue;
        processedGroups.add(step.parallelGroup);
      }

      const agent = await db.agent.findUnique({
        where: { id: step.agentId },
        include: { department: true },
      });

      if (ceo && previousAgentId === ceo.id && agent && agent.id !== ceo.id) {
        emit("AGENT_DELEGATED", ceo, execution.organizationId, {
          taskTitle: step.title,
          message: `Delegated to ${agent.name}`,
        });
        emit("AGENT_RECEIVED_TASK", agent, execution.organizationId, {
          taskTitle: step.title,
          message: `Received: ${step.title}`,
        });
      }

      const ok =
        step.team && step.teamPieces?.length
          ? await runTeamStep(execution.organizationId, executionId, step, plan.goal)
          : await runStep(execution.organizationId, executionId, step, plan.goal);

      if (!ok) {
        failed = true;
        break;
      }
      previousAgentId = step.agentId;
    }

    await db.execution.update({
      where: { id: executionId },
      data: {
        status: failed ? ExecutionStatus.FAILED : ExecutionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    if (execution.goalId) {
      await db.goal.update({
        where: { id: execution.goalId },
        data: { status: failed ? "FAILED" : "COMPLETED" },
      });
    }

    await db.auditLog.create({
      data: {
        action: failed ? "EXECUTION_FAILED" : "EXECUTION_COMPLETED",
        resource: "Execution",
        resourceId: executionId,
        organizationId: execution.organizationId,
        metadata: { goal: plan.goal, steps: plan.steps.length },
      },
    });
  } catch (e) {
    console.error("[Execution] fatal error:", e);
    await db.execution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.FAILED, completedAt: new Date() },
    }).catch(() => {});
  } finally {
    runningExecutions.delete(executionId);
  }
}

async function runStep(
  organizationId: string,
  executionId: string,
  step: ExecutionPlanStep,
  goal: string
): Promise<boolean> {
  const agent = await db.agent.findUniqueOrThrow({
    where: { id: step.agentId },
    include: { department: true },
  });

  const task = await db.task.create({
    data: {
      title: step.title,
      description: step.description,
      status: TaskStatus.RUNNING,
      organizationId,
      executionId,
      assignedAgentId: step.agentId,
      estimatedCost: step.estimatedCost,
      estimatedMinutes: step.estimatedMinutes,
    },
  });

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.THINKING, currentTaskId: task.id },
  });

  emit("AGENT_STARTED_TASK", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    message: `Started: ${step.title}`,
  });

  emit("AGENT_THINKING", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    message: "Building context and planning...",
  });

  const systemPrompt = await buildAgentSystemPrompt(agent, organizationId);
  const provider = providerForModel(agent.model);

  let result: string;
  let cost = 0;

  try {
    const completion = await provider.complete({
      systemPrompt,
      userPrompt: `Company goal: ${goal}\n\nYour task: ${step.title}\n${step.description}\n\nProduce a complete deliverable.`,
      maxTokens: 2048,
    });
    result = completion.content;
    cost = completion.cost;
  } catch (e) {
    emit("AGENT_FAILED", agent, organizationId, {
      taskId: task.id,
      taskTitle: step.title,
      message: `Failed: ${e instanceof Error ? e.message : "Unknown error"}`,
    });
    await db.agent.update({
      where: { id: step.agentId },
      data: { status: AgentStatus.FAILED, currentTaskId: null },
    });
    await db.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.FAILED },
    });
    return false;
  }

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.WORKING },
  });

  const allowedTools = await getAllowedTools(organizationId, agent.department.slug);
  const toolPool = allowedTools.length ? allowedTools : agent.tools;
  const toolName = toolPool[Math.floor(Math.random() * toolPool.length)] ?? "search";

  await executeTool(organizationId, toolName, { task: step.title });
  emit("AGENT_TOOL_USED", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    toolName,
    departmentSlug: agent.department.slug,
    message: `Used tool: ${toolName}`,
  });

  if (step.requiresApproval) {
    await db.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.AWAITING_APPROVAL, result },
    });

    await db.agent.update({
      where: { id: step.agentId },
      data: { status: AgentStatus.WAITING_APPROVAL },
    });

    const approval = await db.approval.create({
      data: {
        title: `Approve: ${step.title}`,
        description: result.slice(0, 500),
        actionType: "EXECUTE_WITH_APPROVAL",
        status: "PENDING",
        organizationId,
        taskId: task.id,
        payload: { stepId: step.id, agentId: step.agentId, draft: result },
      },
    });

    emit("AGENT_WAITING_APPROVAL", agent, organizationId, {
      taskId: task.id,
      taskTitle: step.title,
      message: "Draft ready — waiting for CEO approval",
    });

    const approved = await waitForApproval(task.id);

    if (!approved) {
      await db.approval.update({
        where: { id: approval.id },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
      emit("AGENT_FAILED", agent, organizationId, {
        taskId: task.id,
        message: "CEO rejected the draft",
      });
      await db.agent.update({
        where: { id: step.agentId },
        data: { status: AgentStatus.IDLE, currentTaskId: null },
      });
      await db.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.CANCELLED },
      });
      return false;
    }

    await db.approval.update({
      where: { id: approval.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
  }

  const overview = await db.knowledgeDocument.findFirst({
    where: { organizationId, title: { contains: "Company Overview" } },
  });

  const linkedResult = overview
    ? `${result}\n\n---\nRelated: [[${overview.title}]]`
    : result;

  await db.knowledgeDocument.create({
    data: {
      title: `${step.title} — ${new Date().toISOString().slice(0, 10)}`,
      content: linkedResult,
      organizationId,
    },
  });

  const { pruneAgentMemories } = await import("@/lib/knowledge/memory");
  await db.agentMemory.create({
    data: {
      agentId: agent.id,
      organizationId,
      type: "task",
      content: `Completed: ${step.title}`,
    },
  });
  await pruneAgentMemories(agent.id, organizationId);

  await db.task.update({
    where: { id: task.id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result,
      estimatedCost: cost,
    },
  });

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.IDLE, currentTaskId: null },
  });

  emit("AGENT_COMPLETED", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    message: `Completed: ${step.title}`,
  });

  await db.auditLog.create({
    data: {
      action: "TASK_COMPLETED",
      resource: "Task",
      resourceId: task.id,
      organizationId,
      metadata: { agentName: agent.name, stepTitle: step.title, cost },
    },
  });

  return true;
}

async function runTeamStep(
  organizationId: string,
  executionId: string,
  step: ExecutionPlanStep,
  goal: string
): Promise<boolean> {
  const pieces = step.teamPieces ?? [];
  if (!pieces.length) {
    return runStep(organizationId, executionId, step, goal);
  }

  const lead = await db.agent.findUniqueOrThrow({
    where: { id: step.agentId },
    include: { department: true },
  });

  const parentTask = await db.task.create({
    data: {
      title: step.title,
      description: step.description,
      status: TaskStatus.RUNNING,
      organizationId,
      executionId,
      assignedAgentId: step.agentId,
      estimatedCost: step.estimatedCost,
      estimatedMinutes: step.estimatedMinutes,
    },
  });

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.THINKING, currentTaskId: parentTask.id },
  });

  emit("AGENT_STARTED_TASK", lead, organizationId, {
    taskId: parentTask.id,
    taskTitle: step.title,
    message: `Team lead started: ${step.title}`,
  });

  const pieceResults = await Promise.all(
    pieces.map(async (piece) => {
      const agent = await db.agent.findUniqueOrThrow({
        where: { id: piece.agentId },
        include: { department: true },
      });

      const task = await db.task.create({
        data: {
          title: piece.title,
          description: piece.description,
          status: TaskStatus.RUNNING,
          organizationId,
          executionId,
          assignedAgentId: piece.agentId,
          estimatedCost: 0.05,
          estimatedMinutes: 3,
        },
      });

      await db.agent.update({
        where: { id: piece.agentId },
        data: { status: AgentStatus.THINKING, currentTaskId: task.id },
      });

      emit("AGENT_RECEIVED_TASK", agent, organizationId, {
        taskId: task.id,
        taskTitle: piece.title,
        message: `Team piece: ${piece.title}`,
      });

      const systemPrompt = await buildAgentSystemPrompt(agent, organizationId);
      const provider = providerForModel(agent.model);

      let body = "";
      let cost = 0;

      try {
        const completion = await provider.complete({
          systemPrompt,
          userPrompt: `Company goal: ${goal}\n\nYour team piece: ${piece.title}\n${piece.description}\n\nProduce your contribution.`,
          maxTokens: 1500,
        });
        body = completion.content;
        cost = completion.cost;
      } catch (e) {
        emit("AGENT_FAILED", agent, organizationId, {
          taskId: task.id,
          taskTitle: piece.title,
          message: `Failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        });
        await db.agent.update({
          where: { id: piece.agentId },
          data: { status: AgentStatus.FAILED, currentTaskId: null },
        });
        await db.task.update({
          where: { id: task.id },
          data: { status: TaskStatus.FAILED },
        });
        return { agentName: piece.agentName, title: piece.title, body: "", cost: 0 };
      }

      await db.task.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: new Date(),
          result: body,
          estimatedCost: cost,
        },
      });

      await db.agent.update({
        where: { id: piece.agentId },
        data: { status: AgentStatus.IDLE, currentTaskId: null },
      });

      emit("AGENT_COMPLETED", agent, organizationId, {
        taskId: task.id,
        taskTitle: piece.title,
        message: `Completed team piece: ${piece.title}`,
      });

      return { agentName: piece.agentName, title: piece.title, body, cost };
    })
  );

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.WORKING },
  });

  emit("AGENT_THINKING", lead, organizationId, {
    taskId: parentTask.id,
    taskTitle: step.title,
    message: "Synthesizing team outputs...",
  });

  const validPieces = pieceResults.filter((p) => p.body);
  const result = await synthesizeTeam(lead, goal, validPieces);
  const cost = pieceResults.reduce((sum, p) => sum + p.cost, 0);

  if (step.requiresApproval) {
    await db.task.update({
      where: { id: parentTask.id },
      data: { status: TaskStatus.AWAITING_APPROVAL, result },
    });

    await db.agent.update({
      where: { id: step.agentId },
      data: { status: AgentStatus.WAITING_APPROVAL },
    });

    const approval = await db.approval.create({
      data: {
        title: `Approve team deliverable: ${step.title}`,
        description: result.slice(0, 500),
        actionType: "EXECUTE_WITH_APPROVAL",
        status: "PENDING",
        organizationId,
        taskId: parentTask.id,
        payload: { stepId: step.id, agentId: step.agentId, draft: result, team: true },
      },
    });

    emit("AGENT_WAITING_APPROVAL", lead, organizationId, {
      taskId: parentTask.id,
      taskTitle: step.title,
      message: "Team deliverable ready — waiting for CEO approval",
    });

    const approved = await waitForApproval(parentTask.id);

    if (!approved) {
      await db.approval.update({
        where: { id: approval.id },
        data: { status: "REJECTED", reviewedAt: new Date() },
      });
      await db.agent.update({
        where: { id: step.agentId },
        data: { status: AgentStatus.IDLE, currentTaskId: null },
      });
      await db.task.update({
        where: { id: parentTask.id },
        data: { status: TaskStatus.CANCELLED },
      });
      return false;
    }

    await db.approval.update({
      where: { id: approval.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
  }

  const overview = await db.knowledgeDocument.findFirst({
    where: { organizationId, title: { contains: "Company Overview" } },
  });

  const linkedResult = overview
    ? `${result}\n\n---\nRelated: [[${overview.title}]]`
    : result;

  await db.knowledgeDocument.create({
    data: {
      title: `${step.title} — ${new Date().toISOString().slice(0, 10)}`,
      content: linkedResult,
      organizationId,
    },
  });

  const { pruneAgentMemories } = await import("@/lib/knowledge/memory");
  await db.agentMemory.create({
    data: {
      agentId: lead.id,
      organizationId,
      type: "task",
      content: `Team completed: ${step.title}`,
    },
  });
  await pruneAgentMemories(lead.id, organizationId);

  await db.task.update({
    where: { id: parentTask.id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result,
      estimatedCost: cost,
    },
  });

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.IDLE, currentTaskId: null },
  });

  emit("AGENT_COMPLETED", lead, organizationId, {
    taskId: parentTask.id,
    taskTitle: step.title,
    message: `Team completed: ${step.title}`,
  });

  return true;
}

export { resolveApproval, waitForApproval };

export async function getAgentStatus(agentId: string): Promise<AgentStatus> {
  const agent = await db.agent.findUniqueOrThrow({ where: { id: agentId } });
  return agent.status;
}
