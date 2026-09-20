import { auth } from "@/lib/auth";
import { submitGoal } from "@/lib/mock/execution-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goal, team } = await req.json();
  if (!goal || typeof goal !== "string") {
    return NextResponse.json({ error: "Goal is required" }, { status: 400 });
  }

  const plan = await submitGoal(session.user.organizationId, goal, {
    team: team === true,
  });
  return NextResponse.json(plan);
}
