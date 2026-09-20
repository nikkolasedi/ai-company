import { auth } from "@/lib/auth";
import { startExecution } from "@/lib/mock/execution-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { executionId } = await req.json();
  if (!executionId) {
    return NextResponse.json({ error: "executionId is required" }, { status: 400 });
  }

  startExecution(executionId).catch(console.error);
  return NextResponse.json({ started: true, executionId });
}
