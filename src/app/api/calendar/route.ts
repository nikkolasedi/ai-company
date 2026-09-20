import { auth } from "@/lib/auth";
import { getCalendarEvents } from "@/lib/orchestration/routines";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 30);

  const events = await getCalendarEvents(session.user.organizationId, days);
  return NextResponse.json(events);
}
