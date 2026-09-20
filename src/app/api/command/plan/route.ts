import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitGoal } from "@/lib/mock/execution-engine";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/rbac";
import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requirePermission(session.user.role as MembershipRole, "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = checkRateLimit(
    `plan:${session.user.organizationId}`,
    LIMITS.commandPerHour,
    3600_000
  );
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { goal, team } = await req.json();
  if (!goal || typeof goal !== "string") {
    return NextResponse.json({ error: "Goal is required" }, { status: 400 });
  }

  const plan = await submitGoal(session.user.organizationId, goal, {
    team: team === true,
  });

  await db.auditLog.create({
    data: {
      action: "GOAL_PLANNED",
      resource: "Execution",
      resourceId: plan.id,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      metadata: { goal: goal.slice(0, 200), team: team === true },
    },
  });

  return NextResponse.json(plan);
}
