import { auth } from "@/lib/auth";
import { deleteRoutine, toggleRoutine } from "@/lib/orchestration/routines";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (typeof body.paused === "boolean") {
    await toggleRoutine(session.user.organizationId, id, body.paused);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid update" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteRoutine(session.user.organizationId, id);
  return NextResponse.json({ ok: true });
}
