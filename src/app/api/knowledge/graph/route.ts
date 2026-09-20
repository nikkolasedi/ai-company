import { auth } from "@/lib/auth";
import { buildKnowledgeGraph } from "@/lib/knowledge/graph";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const graph = await buildKnowledgeGraph(session.user.organizationId);
  return NextResponse.json(graph);
}
