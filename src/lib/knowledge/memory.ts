import { db } from "@/lib/db";

const MAX_TASK_MEMORIES = 50;
const MAX_LESSON_MEMORIES = 30;

export async function pruneAgentMemories(agentId: string, organizationId: string) {
  for (const [type, limit] of [
    ["task", MAX_TASK_MEMORIES],
    ["lesson", MAX_LESSON_MEMORIES],
  ] as const) {
    const excess = await db.agentMemory.findMany({
      where: { agentId, organizationId, type },
      orderBy: { createdAt: "desc" },
      skip: limit,
      select: { id: true },
    });
    if (excess.length) {
      await db.agentMemory.deleteMany({
        where: { id: { in: excess.map((m) => m.id) } },
      });
    }
  }
}

export async function listAgentMemories(agentId: string, organizationId: string) {
  return db.agentMemory.findMany({
    where: { agentId, organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function deleteAgentMemory(
  memoryId: string,
  agentId: string,
  organizationId: string
) {
  return db.agentMemory.deleteMany({
    where: { id: memoryId, agentId, organizationId },
  });
}
