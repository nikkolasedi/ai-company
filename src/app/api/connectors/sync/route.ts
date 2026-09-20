import { auth } from "@/lib/auth";
import { getConnectors } from "@/lib/orchestration/connectors";
import { ensureMcpPolicy, syncMcpToDatabase } from "@/lib/mcp/sync";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  await ensureMcpPolicy(orgId);
  const syncResult = await syncMcpToDatabase(orgId);
  const connectors = await getConnectors(orgId);

  return NextResponse.json({ ...syncResult, connectors });
}
