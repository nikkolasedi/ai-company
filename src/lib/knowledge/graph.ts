import { db } from "@/lib/db";

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  group: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

const LINK_RE = /\[\[([^\]|#]+)/g;

function extractLinks(content: string | null): string[] {
  if (!content) return [];
  const links: string[] = [];
  for (const m of content.matchAll(LINK_RE)) {
    links.push(m[1].trim().split("/").pop()!);
  }
  return links;
}

/** Simple force-free circular layout with link-aware positioning. */
function layoutNodes(ids: string[], links: Array<[string, string]>): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const n = ids.length;
  if (!n) return positions;

  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const r = 80 + (i % 3) * 12;
    positions.set(ids[i], { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }

  // Light relaxation
  for (let iter = 0; iter < 60; iter++) {
    for (const [a, b] of links) {
      const pa = positions.get(a);
      const pb = positions.get(b);
      if (!pa || !pb) continue;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const dist = Math.hypot(dx, dy) || 1;
      const force = (dist - 50) * 0.02;
      pa.x += (dx / dist) * force;
      pa.y += (dy / dist) * force;
      pb.x -= (dx / dist) * force;
      pb.y -= (dy / dist) * force;
    }
  }

  return positions;
}

export async function buildKnowledgeGraph(organizationId: string): Promise<KnowledgeGraph> {
  const docs = await db.knowledgeDocument.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const notes = new Map<string, { title: string; group: string; content: string | null }>();
  for (const doc of docs) {
    notes.set(doc.title, {
      title: doc.title,
      group: doc.title.includes("—") ? "Deliverables" : "Knowledge",
      content: doc.content,
    });
  }

  const rawLinks: Array<[string, string]> = [];
  for (const [title, note] of notes) {
    for (const target of extractLinks(note.content)) {
      if (notes.has(target) && target !== title) {
        rawLinks.push([title, target]);
      }
    }
    // Auto-link deliverables to company overview if present
    if (note.group === "Deliverables" && notes.has("Nova Coffee — Company Overview")) {
      rawLinks.push([title, "Nova Coffee — Company Overview"]);
    }
  }

  const connected = new Set<string>();
  for (const [a, b] of rawLinks) {
    connected.add(a);
    connected.add(b);
  }

  const ids = [...notes.keys()].filter((id) => connected.has(id) || notes.size <= 12);
  if (!ids.length) {
    return {
      nodes: docs.slice(0, 6).map((d, i) => ({
        id: d.id,
        title: d.title,
        x: Math.cos((i / 6) * Math.PI * 2) * 60,
        y: Math.sin((i / 6) * Math.PI * 2) * 60,
        group: "Knowledge",
      })),
      links: [],
    };
  }

  const positions = layoutNodes(ids, rawLinks);
  const titleToId = new Map(docs.map((d) => [d.title, d.id]));

  const nodes: GraphNode[] = ids.map((title) => {
    const pos = positions.get(title) ?? { x: 0, y: 0 };
    return {
      id: titleToId.get(title) ?? title,
      title,
      x: pos.x,
      y: pos.y,
      group: notes.get(title)?.group ?? "Knowledge",
    };
  });

  const links: GraphLink[] = rawLinks
    .filter(([a, b]) => ids.includes(a) && ids.includes(b))
    .map(([a, b]) => ({
      source: titleToId.get(a) ?? a,
      target: titleToId.get(b) ?? b,
    }));

  return { nodes, links };
}
