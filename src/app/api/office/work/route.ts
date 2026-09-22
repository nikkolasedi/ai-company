import { auth } from "@/lib/auth";
import {
  assignTask,
  completeTask,
  grantConnector,
  handoffTask,
  replyToHandoff,
} from "@/lib/office/work";
import { requirePermission } from "@/lib/rbac";
import { MembershipRole, PermissionLevel } from "@prisma/client";
import { NextResponse } from "next/server";

const PERMISSIONS = new Set<string>(Object.values(PermissionLevel));

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    requirePermission(session.user.role as MembershipRole, "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const orgId = session.user.organizationId;
  try {
    switch (body.action) {
      case "assign": {
        const agentId = String(body.agentId ?? "");
        const title = String(body.title ?? "").trim();
        const description = String(body.description ?? "").trim();
        if (!agentId || title.length < 2) {
          return NextResponse.json({ error: "A person and a task title are required" }, { status: 400 });
        }
        const task = await assignTask(orgId, agentId, title.slice(0, 180), description.slice(0, 2000));
        return NextResponse.json({ taskId: task.id });
      }
      case "handoff": {
        const agentId = String(body.agentId ?? "");
        const toAgentId = String(body.toAgentId ?? "");
        const note = String(body.note ?? "").trim();
        if (!agentId || !toAgentId || note.length < 2) {
          return NextResponse.json({ error: "Choose a colleague and say what you need" }, { status: 400 });
        }
        const task = await handoffTask(orgId, agentId, toAgentId, note.slice(0, 2000));
        return NextResponse.json({ taskId: task.id });
      }
      case "reply": {
        const taskId = String(body.taskId ?? "");
        const reply = String(body.reply ?? "").trim();
        if (!taskId || reply.length < 2) {
          return NextResponse.json({ error: "Write a reply" }, { status: 400 });
        }
        await replyToHandoff(orgId, taskId, reply.slice(0, 2000));
        return NextResponse.json({ ok: true });
      }
      case "grant": {
        const taskId = String(body.taskId ?? "");
        const connectorId = String(body.connectorId ?? "");
        const permission = String(body.permission ?? "");
        if (!taskId || !connectorId || !PERMISSIONS.has(permission)) {
          return NextResponse.json({ error: "Choose a connector and a permission" }, { status: 400 });
        }
        const result = await grantConnector(orgId, taskId, connectorId, permission as PermissionLevel);
        return NextResponse.json(result);
      }
      case "complete": {
        const taskId = String(body.taskId ?? "");
        if (!taskId) return NextResponse.json({ error: "Missing task" }, { status: 400 });
        await completeTask(orgId, taskId);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the office";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
