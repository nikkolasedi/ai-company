import { db } from "@/lib/db";

const gates = new Map<string, { resolve: (approved: boolean) => void }>();

export function waitForApproval(taskId: string, timeoutMs = 300_000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (approved: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      gates.delete(taskId);
      resolve(approved);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    gates.set(taskId, { resolve: finish });

    const poll = setInterval(async () => {
      try {
        const approval = await db.approval.findFirst({
          where: {
            taskId,
            status: { in: ["APPROVED", "REJECTED"] },
          },
        });
        if (approval) {
          finish(approval.status === "APPROVED");
        }
      } catch {
        // keep polling until timeout
      }
    }, 2000);
  });
}

export function resolveApproval(taskId: string, approved: boolean): boolean {
  const gate = gates.get(taskId);
  if (!gate) return false;
  gate.resolve(approved);
  return true;
}

export function hasPendingApproval(taskId: string): boolean {
  return gates.has(taskId);
}
