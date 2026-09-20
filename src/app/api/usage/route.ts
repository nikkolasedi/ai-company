import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_LIMITS, getDailyUsage } from "@/lib/usage";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { planTier: true },
  });

  const tier = (org?.planTier ?? "starter") as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[tier] ?? PLAN_LIMITS.starter;

  const [executions, aiCalls, ingest] = await Promise.all([
    getDailyUsage(session.user.organizationId, "executionsPerDay"),
    getDailyUsage(session.user.organizationId, "aiCallsPerDay"),
    getDailyUsage(session.user.organizationId, "ingestPerDay"),
  ]);

  return NextResponse.json({
    planTier: tier,
    usage: {
      executionsPerDay: { used: executions, limit: limits.executionsPerDay },
      aiCallsPerDay: { used: aiCalls, limit: limits.aiCallsPerDay },
      ingestPerDay: { used: ingest, limit: limits.ingestPerDay },
    },
  });
}
