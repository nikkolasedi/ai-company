import { AgentStatus, ExecutionStatus, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { officeEventEmitter } from "@/lib/events/emitter";
import type { ExecutionPlan, ExecutionPlanStep, OfficeEvent } from "@/types";

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

function analyzeGoal(goal: string): {
  keywords: string[];
  involvesMarketing: boolean;
  involvesSales: boolean;
  involvesFinance: boolean;
  involvesTech: boolean;
} {
  const lower = goal.toLowerCase();
  return {
    keywords: lower.split(/\s+/).filter((w) => w.length > 3),
    involvesMarketing:
      /market|campaign|content|seo|brand|social|outreach|customer/.test(lower),
    involvesSales: /sales|lead|customer|b2b|outreach|crm|proposal/.test(lower),
    involvesFinance: /budget|cost|invoice|finance|cashflow|revenue/.test(lower),
    involvesTech: /develop|code|api|tech|deploy|bug|feature/.test(lower),
  };
}

export async function submitGoal(
  organizationId: string,
  goal: string
): Promise<ExecutionPlan> {
  const agents = await db.agent.findMany({
    where: { organizationId },
    include: { department: true },
  });

  const ceo = agents.find((a) => a.isOrchestrator);
  const analysis = analyzeGoal(goal);

  const pickAgent = (deptSlug: string, roleMatch: RegExp) =>
    agents.find(
      (a) => a.department.slug === deptSlug && roleMatch.test(a.role.toLowerCase())
    ) ?? agents.find((a) => a.department.slug === deptSlug);

  const steps: ExecutionPlanStep[] = [];
  let stepNum = 0;

  if (ceo) {
    steps.push({
      id: `step-${++stepNum}`,
      title: "Analyze goal and create execution plan",
      description: "CEO orchestrator breaks down the business objective",
      agentId: ceo.id,
      agentName: ceo.name,
      department: ceo.department.name,
      requiresApproval: false,
      estimatedMinutes: 2,
      estimatedCost: 0.05,
    });
  }

  if (analysis.involvesMarketing || analysis.involvesSales) {
    const marketing = pickAgent("marketing", /manager|campaign|content/);
    if (marketing) {
      steps.push({
        id: `step-${++stepNum}`,
        title: "Market research and campaign strategy",
        description: "Research target audience and draft campaign approach",
        agentId: marketing.id,
        agentName: marketing.name,
        department: marketing.department.name,
        requiresApproval: false,
        parallelGroup: 1,
        estimatedMinutes: 5,
        estimatedCost: 0.15,
      });
    }
  }

  if (analysis.involvesSales || /customer|lead|b2b/.test(goal.toLowerCase())) {
    const sales = pickAgent("sales", /manager|outreach|lead/);
    if (sales) {
      steps.push({
        id: `step-${++stepNum}`,
        title: "Lead research and outreach preparation",
        description: "Identify prospects and prepare outreach sequences",
        agentId: sales.id,
        agentName: sales.name,
        department: sales.department.name,
        requiresApproval: true,
        parallelGroup: 1,
        estimatedMinutes: 8,
        estimatedCost: 0.25,
      });
    }
  }

  if (analysis.involvesFinance) {
    const finance = pickAgent("finance", /manager|cashflow/);
    if (finance) {
      steps.push({
        id: `step-${++stepNum}`,
        title: "Budget review and cost analysis",
        description: "Validate financial feasibility of the proposed plan",
        agentId: finance.id,
        agentName: finance.name,
        department: finance.department.name,
        requiresApproval: false,
        estimatedMinutes: 3,
        estimatedCost: 0.08,
      });
    }
  }

  if (steps.length <= 1) {
    const ops = pickAgent("operations", /manager/);
    if (ops) {
      steps.push({
        id: `step-${++stepNum}`,
        title: "Operational planning",
        description: "Create actionable plan for the stated objective",
        agentId: ops.id,
        agentName: ops.name,
        department: ops.department.name,
        requiresApproval: false,
        estimatedMinutes: 4,
        estimatedCost: 0.12,
      });
    }
  }

  if (ceo) {
    steps.push({
      id: `step-${++stepNum}`,
      title: "Synthesize results and executive summary",
      description: "Compile outputs from all agents into final deliverable",
      agentId: ceo.id,
      agentName: ceo.name,
      department: ceo.department.name,
      requiresApproval: false,
      estimatedMinutes: 2,
      estimatedCost: 0.06,
    });
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
    summary: `Plan with ${steps.length} steps involving ${participatingAgents.length} agents`,
    steps,
    participatingAgents,
    estimatedCost,
    estimatedMinutes,
    requiresApproval: steps.some((s) => s.requiresApproval),
  };
}

export async function startExecution(executionId: string): Promise<void> {
  if (runningExecutions.has(executionId)) return;
  runningExecutions.add(executionId);

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

  const processedGroups = new Set<number>();

  for (const step of plan.steps) {
    if (step.parallelGroup !== undefined) {
      if (processedGroups.has(step.parallelGroup)) continue;
      processedGroups.add(step.parallelGroup);
    }

    await runStep(execution.organizationId, executionId, step);
  }

  await db.execution.update({
    where: { id: executionId },
    data: {
      status: ExecutionStatus.COMPLETED,
      completedAt: new Date(),
      actualCost: plan.steps.reduce((s, st) => s + st.estimatedCost, 0),
    },
  });

  if (execution.goalId) {
    await db.goal.update({
      where: { id: execution.goalId },
      data: { status: "COMPLETED" },
    });
  }

  runningExecutions.delete(executionId);
}

async function runStep(
  organizationId: string,
  executionId: string,
  step: ExecutionPlanStep
) {
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

  await delay(1500);

  emit("AGENT_THINKING", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    message: "Analyzing and planning...",
  });

  await db.agent.update({
    where: { id: step.agentId },
    data: { status: AgentStatus.WORKING },
  });

  const mockTools = (agent.tools?.length ? agent.tools : ["search", "draft", "analyze"]) as string[];
  const toolName = mockTools[Math.floor(Math.random() * mockTools.length)];
  emit("AGENT_TOOL_USED", agent, organizationId, {
    taskId: task.id,
    taskTitle: step.title,
    toolName,
    departmentSlug: agent.department.slug,
    message: `Used tool: ${toolName}`,
  });

  await delay(2000 + Math.random() * 2000);

  if (step.requiresApproval) {
    await db.agent.update({
      where: { id: step.agentId },
      data: { status: AgentStatus.WAITING_APPROVAL },
    });

    await db.task.update({
      where: { id: task.id },
      data: { status: TaskStatus.AWAITING_APPROVAL },
    });

    await db.approval.create({
      data: {
        title: `Approve: ${step.title}`,
        description: step.description,
        actionType: "EXECUTE_WITH_APPROVAL",
        status: "PENDING",
        organizationId,
        taskId: task.id,
        payload: { stepId: step.id, agentId: step.agentId },
      },
    });

    emit("AGENT_WAITING_APPROVAL", agent, organizationId, {
      taskId: task.id,
      taskTitle: step.title,
      message: "Waiting for CEO approval",
    });

    await delay(3000);
  }

  await db.task.update({
    where: { id: task.id },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      result: `[Mock] Completed: ${step.title}`,
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
      metadata: { agentName: agent.name, stepTitle: step.title },
    },
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAgentStatus(agentId: string): Promise<AgentStatus> {
  const agent = await db.agent.findUniqueOrThrow({ where: { id: agentId } });
  return agent.status;
}
