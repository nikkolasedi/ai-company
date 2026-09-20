import { auth } from "@/lib/auth";
import { getApprovals } from "@/lib/data/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const approvals = await getApprovals(session.user.organizationId);
  return NextResponse.json(approvals);
}
