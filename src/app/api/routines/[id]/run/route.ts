import { auth } from "@/lib/auth";
import { runRoutineNow } from "@/lib/orchestration/routines";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const plan = await runRoutineNow(session.user.organizationId, id);
    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to run routine" },
      { status: 400 }
    );
  }
}
