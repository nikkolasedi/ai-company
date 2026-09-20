import { auth } from "@/lib/auth";
import { searchKnowledge } from "@/lib/knowledge/search";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchKnowledge(session.user.organizationId, q);
  return NextResponse.json(results);
}
