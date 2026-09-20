import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseWhen, describe, nextRun, valid, type ScheduleWhen } from "@/lib/scheduling/when";
import { startExecution, submitGoal } from "./execution-engine";

function asScheduleWhen(value: unknown): ScheduleWhen {
  return value as ScheduleWhen;
}

const LATE_AFTER_MS = 90_000;

export interface RoutineView {
  id: string;
  title: string;
  text: string;
  departmentSlug: string;
  agentId: string;
  agentName: string;
  schedule: string;
  when: ScheduleWhen;
  needsApproval: boolean;
  paused: boolean;
  team: boolean;
  nextAt: string | null;
  lastAt: string | null;
  runs: number;
}

export async function listRoutines(organizationId: string): Promise<RoutineView[]> {
  await tickRoutines(organizationId);

  const routines = await db.routine.findMany({
    where: { organizationId },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
  });

  return routines.map((r) => ({
    id: r.id,
    title: r.title,
    text: r.text,
    departmentSlug: r.departmentSlug,
    agentId: r.agentId,
    agentName: r.agent.name,
    schedule: describe(asScheduleWhen(r.whenJson)),
    when: asScheduleWhen(r.whenJson),
    needsApproval: r.needsApproval,
    paused: r.paused,
    team: r.team,
    nextAt: r.nextAt?.toISOString() ?? null,
    lastAt: r.lastAt?.toISOString() ?? null,
    runs: r.runs,
  }));
}

export async function createRoutine(
  organizationId: string,
  input: string,
  options?: { departmentSlug?: string; agentId?: string; team?: boolean }
) {
  const parsed = parseWhen(input);
  if (!parsed || !valid(parsed.when)) {
    throw new Error(
      'Could not parse schedule. Try: "every weekday at 8am, triage inbox"'
    );
  }

  const agents = await db.agent.findMany({
    where: { organizationId },
    include: { department: true },
  });

  let agent = options?.agentId
    ? agents.find((a) => a.id === options.agentId)
    : undefined;

  let deptSlug = options?.departmentSlug ?? agent?.department.slug;

  if (!agent) {
    const dept = deptSlug ?? "sales";
    agent =
      agents.find((a) => a.department.slug === dept && /manager|lead/i.test(a.role)) ??
      agents.find((a) => a.department.slug === dept);
    deptSlug = agent?.department.slug ?? dept;
  }

  if (!agent) throw new Error("No agent found for routine");

  const title = parsed.text.slice(0, 90) || "Scheduled task";
  const next = nextRun(parsed.when);

  const routine = await db.routine.create({
    data: {
      title,
      text: parsed.text || input,
      departmentSlug: deptSlug!,
      agentId: agent.id,
      organizationId,
      whenJson: parsed.when as unknown as Prisma.InputJsonValue,
      needsApproval: /send|email|pay|post|publish/i.test(parsed.text),
      team: options?.team ?? /\bteam\b/i.test(input),
      nextAt: next ? new Date(next) : null,
    },
  });

  return routine;
}

export async function toggleRoutine(
  organizationId: string,
  id: string,
  paused: boolean
) {
  return db.routine.updateMany({
    where: { id, organizationId },
    data: { paused },
  });
}

export async function deleteRoutine(organizationId: string, id: string) {
  return db.routine.deleteMany({ where: { id, organizationId } });
}

export async function runRoutineNow(organizationId: string, id: string) {
  const routine = await db.routine.findFirst({
    where: { id, organizationId },
  });
  if (!routine) throw new Error("Routine not found");

  const plan = await submitGoal(
    organizationId,
    routine.team ? `As a team: ${routine.text}` : routine.text
  );

  await startExecution(plan.id);

  const when = asScheduleWhen(routine.whenJson);
  await db.routine.update({
    where: { id },
    data: {
      lastAt: new Date(),
      runs: routine.runs + 1,
      nextAt: nextRun(when) ? new Date(nextRun(when)!) : null,
    },
  });

  return plan;
}

export async function tickRoutines(organizationId: string) {
  const now = Date.now();
  const routines = await db.routine.findMany({
    where: { organizationId, paused: false, nextAt: { lte: new Date(now) } },
  });

  for (const routine of routines) {
    const late = routine.nextAt
      ? now - routine.nextAt.getTime() > LATE_AFTER_MS
      : false;

    try {
      const plan = await submitGoal(
        organizationId,
        routine.team ? `As a team: ${routine.text}` : routine.text
      );
      startExecution(plan.id).catch(console.error);

      const when = asScheduleWhen(routine.whenJson);
      await db.routine.update({
        where: { id: routine.id },
        data: {
          lastAt: new Date(),
          runs: routine.runs + 1,
          nextAt: nextRun(when, now) ? new Date(nextRun(when, now)!) : null,
        },
      });

      await db.auditLog.create({
        data: {
          action: late ? "ROUTINE_LATE" : "ROUTINE_FIRED",
          resource: "Routine",
          resourceId: routine.id,
          organizationId,
          metadata: { title: routine.title },
        },
      });
    } catch (e) {
      console.error("[Routines] tick failed:", e);
    }
  }
}

export async function getCalendarEvents(organizationId: string, days = 30) {
  await tickRoutines(organizationId);

  const from = Date.now();
  const to = from + days * 86400000;

  const routines = await db.routine.findMany({
    where: { organizationId, paused: false },
    include: { agent: true },
  });

  const projected: Array<{
    id: string;
    title: string;
    type: "routine";
    at: string;
    agentName: string;
    departmentSlug: string;
  }> = [];

  for (const r of routines) {
    const when = asScheduleWhen(r.whenJson);
    const { occurrences } = await import("@/lib/scheduling/when");
    for (const ts of occurrences(when, from, to, 20)) {
      projected.push({
        id: `routine-${r.id}-${ts}`,
        title: r.title,
        type: "routine",
        at: new Date(ts).toISOString(),
        agentName: r.agent.name,
        departmentSlug: r.departmentSlug,
      });
    }
  }

  const tasks = await db.task.findMany({
    where: {
      organizationId,
      OR: [
        { completedAt: { gte: new Date(from - days * 86400000) } },
        { status: { in: ["RUNNING", "PENDING", "AWAITING_APPROVAL"] } },
      ],
    },
    include: { assignedAgent: true },
    take: 50,
  });

  const taskEvents = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.status === "COMPLETED" ? "done" as const : "task" as const,
    at: (t.completedAt ?? t.createdAt).toISOString(),
    agentName: t.assignedAgent?.name ?? "Unassigned",
    departmentSlug: "",
  }));

  return [...projected, ...taskEvents].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
}
