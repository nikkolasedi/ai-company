import { auth } from "@/lib/auth";
import { getDepartmentsWithAgents } from "@/lib/data/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const departments = await getDepartmentsWithAgents(session.user.organizationId);
  return NextResponse.json(departments);
}
