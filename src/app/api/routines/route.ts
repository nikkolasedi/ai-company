import { auth } from "@/lib/auth";
import { createRoutine, listRoutines } from "@/lib/orchestration/routines";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const routines = await listRoutines(session.user.organizationId);
  return NextResponse.json(routines);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const input = body.input ?? body.text;
  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "Schedule input is required" }, { status: 400 });
  }

  try {
    const routine = await createRoutine(session.user.organizationId, input, {
      departmentSlug: body.departmentSlug,
      agentId: body.agentId,
      team: body.team,
    });
    return NextResponse.json(routine);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create routine" },
      { status: 400 }
    );
  }
}
