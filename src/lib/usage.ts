import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const PLAN_LIMITS = {
  starter: { executionsPerDay: 50, aiCallsPerDay: 200, ingestPerDay: 20 },
  pro: { executionsPerDay: 500, aiCallsPerDay: 2000, ingestPerDay: 200 },
} as const;

export async function recordUsage(
  organizationId: string,
  metric: string,
  amount = 1,
  metadata?: Record<string, unknown>
) {
  return db.usageRecord.create({
    data: {
      organizationId,
      metric,
      amount,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getDailyUsage(organizationId: string, metric: string) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const result = await db.usageRecord.aggregate({
    where: { organizationId, metric, createdAt: { gte: since } },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

export async function checkUsageLimit(
  organizationId: string,
  metric: keyof typeof PLAN_LIMITS.starter,
  planTier: keyof typeof PLAN_LIMITS = "starter"
) {
  const used = await getDailyUsage(organizationId, metric);
  const limit = PLAN_LIMITS[planTier][metric];
  return { allowed: used < limit, used, limit };
}
