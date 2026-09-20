import { db } from "@/lib/db";

/** Record a standing lesson from CEO feedback (agents-office `revise:` pattern). */
export async function recordLesson(
  agentId: string,
  organizationId: string,
  feedback: string
): Promise<void> {
  const trimmed = feedback.trim();
  if (!trimmed) return;

  const content = trimmed.startsWith("revise:")
    ? trimmed.slice(7).trim()
    : trimmed;

  await db.agentMemory.create({
    data: {
      agentId,
      organizationId,
      type: "lesson",
      content,
    },
  });
}

export async function getLessons(agentId: string, organizationId: string) {
  return db.agentMemory.findMany({
    where: { agentId, organizationId, type: "lesson" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
