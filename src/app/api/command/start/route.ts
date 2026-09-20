import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startExecution } from "@/lib/mock/execution-engine";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/rbac";
import { checkUsageLimit, recordUsage } from "@/lib/usage";
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
    `cmd:${session.user.organizationId}`,
    LIMITS.commandPerHour,
    3600_000
  );
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const usage = await checkUsageLimit(session.user.organizationId, "executionsPerDay");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Daily execution limit reached (${usage.limit})` },
      { status: 429 }
    );
  }

  const { executionId } = await req.json();
  if (!executionId) {
    return NextResponse.json({ error: "executionId is required" }, { status: 400 });
  }

  const execution = await db.execution.findFirst({
    where: { id: executionId, organizationId: session.user.organizationId },
  });

  if (!execution) {
    return NextResponse.json({ error: "Execution not found" }, { status: 404 });
  }

  await recordUsage(session.user.organizationId, "executionsPerDay");
  await db.auditLog.create({
    data: {
      action: "EXECUTION_STARTED",
      resource: "Execution",
      resourceId: executionId,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
  });

  startExecution(executionId).catch(console.error);
  return NextResponse.json({ started: true, executionId });
}
