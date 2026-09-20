import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requirePermission(session.user.role as MembershipRole, "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const action = searchParams.get("action");

  const logs = await db.auditLog.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(action ? { action: { contains: action } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(logs);
}
