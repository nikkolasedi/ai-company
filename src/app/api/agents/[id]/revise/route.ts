import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordLesson } from "@/lib/orchestration/lessons";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { feedback } = await req.json();

  if (!feedback || typeof feedback !== "string") {
    return NextResponse.json({ error: "feedback is required" }, { status: 400 });
  }

  const agent = await db.agent.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });

  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const memory = await recordLesson(id, session.user.organizationId, feedback);

  await db.auditLog.create({
    data: {
      action: "AGENT_LESSON_RECORDED",
      resource: "AgentMemory",
      resourceId: memory.id,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      metadata: { agentId: id },
    },
  });

  return NextResponse.json({ success: true, id: memory.id });
}
