import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getDashboardStats(session.user.organizationId);
  return NextResponse.json(stats);
}
