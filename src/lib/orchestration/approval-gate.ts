const gates = new Map<string, { resolve: (approved: boolean) => void }>();

export function waitForApproval(taskId: string, timeoutMs = 300_000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      gates.delete(taskId);
      resolve(false);
    }, timeoutMs);

    gates.set(taskId, {
      resolve: (approved) => {
        clearTimeout(timer);
        gates.delete(taskId);
        resolve(approved);
      },
    });
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
