import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { resolveApproval } from "@/lib/orchestration/execution-engine";
import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requirePermission(session.user.role as MembershipRole, "approve");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await db.approval.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.approval.update({
    where: { id },
    data: {
      status,
      reviewerId: session.user.id,
      reviewedAt: new Date(),
    },
  });

  if (existing.taskId) {
    resolveApproval(existing.taskId, status === "APPROVED");
  }

  await db.auditLog.create({
    data: {
      action: `APPROVAL_${status}`,
      resource: "Approval",
      resourceId: id,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
