import { auth } from "@/lib/auth";
import { ingestKnowledge, parseUploadedFile } from "@/lib/knowledge/ingest";
import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/rbac";
import { checkUsageLimit, recordUsage } from "@/lib/usage";
import type { KnowledgeSourceType } from "@prisma/client";
import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    requirePermission(session.user.role as MembershipRole, "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = checkRateLimit(
    `ingest:${session.user.organizationId}`,
    LIMITS.ingestPerHour,
    3600_000
  );
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const usage = await checkUsageLimit(session.user.organizationId, "ingestPerDay");
  if (!usage.allowed) {
    return NextResponse.json({ error: "Daily ingest limit reached" }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const url = String(form.get("url") ?? "");
      const title = String(form.get("title") ?? "");

      if (file) {
        const text = await file.text();
        const parsed = parseUploadedFile(file.name, text);
        const doc = await ingestKnowledge(session.user.organizationId, {
          ...parsed,
          title: title || parsed.title,
        });
        await recordUsage(session.user.organizationId, "ingestPerDay");
        return NextResponse.json(doc);
      }

      if (url) {
        const doc = await ingestKnowledge(session.user.organizationId, {
          type: "URL",
          url,
          title,
        });
        await recordUsage(session.user.organizationId, "ingestPerDay");
        return NextResponse.json(doc);
      }
    }

    const body = await req.json();
    const doc = await ingestKnowledge(session.user.organizationId, {
      type: (body.type as KnowledgeSourceType) ?? "TXT",
      title: body.title,
      text: body.text,
      url: body.url,
    });
    await recordUsage(session.user.organizationId, "ingestPerDay");
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 400 }
    );
  }
}
