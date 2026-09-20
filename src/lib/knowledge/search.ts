import { db } from "@/lib/db";

export interface KnowledgeHit {
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export async function searchKnowledge(
  organizationId: string,
  query: string,
  limit = 8
): Promise<KnowledgeHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const docs = await db.knowledgeDocument.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = docs
    .map((doc) => {
      const hay = `${doc.title} ${doc.content ?? ""}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (doc.title.toLowerCase().includes(term)) score += 3;
        if (hay.includes(term)) score += 1;
      }
      return { doc, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ doc, score }) => ({
    id: doc.id,
    title: doc.title,
    snippet: (doc.content ?? "").slice(0, 240),
    score,
  }));
}
