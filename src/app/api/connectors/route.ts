import { auth } from "@/lib/auth";
import { getConnectors } from "@/lib/orchestration/connectors";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connectors = await getConnectors(session.user.organizationId);
  return NextResponse.json(connectors);
}
