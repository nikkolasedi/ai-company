import type { KnowledgeSourceType } from "@prisma/client";
import { db } from "@/lib/db";

export interface IngestInput {
  title?: string;
  text?: string;
  url?: string;
  type: KnowledgeSourceType;
}

export async function ingestKnowledge(organizationId: string, input: IngestInput) {
  let content = input.text?.trim() ?? "";
  let title = input.title?.trim() ?? "Untitled";
  let sourceUrl = input.url;

  if (input.type === "URL" && input.url) {
    const res = await fetch(input.url, {
      headers: { "User-Agent": "AI-Company-Bot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
    const html = await res.text();
    content = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50_000);
    if (!title || title === "Untitled") {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = match?.[1]?.trim() ?? input.url;
    }
  }

  if (!content) throw new Error("No content to ingest");

  const doc = await db.knowledgeDocument.create({
    data: {
      title,
      content,
      organizationId,
    },
  });

  await db.knowledgeSource.create({
    data: {
      name: title,
      type: input.type,
      url: sourceUrl,
      documentId: doc.id,
      organizationId,
    },
  });

  await db.auditLog.create({
    data: {
      action: "KNOWLEDGE_INGESTED",
      resource: "KnowledgeDocument",
      resourceId: doc.id,
      organizationId,
      metadata: { type: input.type, title },
    },
  });

  return doc;
}

export function parseUploadedFile(
  filename: string,
  body: string
): { type: KnowledgeSourceType; title: string; text: string } {
  const lower = filename.toLowerCase();
  const type: KnowledgeSourceType = lower.endsWith(".csv")
    ? "CSV"
    : lower.endsWith(".txt")
      ? "TXT"
      : "TXT";

  const title = filename.replace(/\.[^.]+$/, "");
  return { type, title, text: body.slice(0, 100_000) };
}
