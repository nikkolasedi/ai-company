import { auth } from "@/lib/auth";
import { getAgentById } from "@/lib/data/queries";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const agent = await getAgentById(session.user.organizationId, id);
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { db } = await import("@/lib/db");
  const { TaskStatus } = await import("@prisma/client");
  const incomingHandoff = await db.task.findFirst({
    where: {
      organizationId: session.user.organizationId,
      handoffAgentId: id,
      handoffReply: null,
      status: { in: [TaskStatus.RUNNING, TaskStatus.AWAITING_APPROVAL] },
      NOT: { assignedAgentId: id },
    },
    include: {
      assignedAgent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ...agent, incomingHandoff });
}
