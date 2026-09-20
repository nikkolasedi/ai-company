import type { MembershipRole } from "@prisma/client";

type Action = "read" | "write" | "approve" | "manage" | "delete";

const ROLE_PERMISSIONS: Record<MembershipRole, Action[]> = {
  OWNER: ["read", "write", "approve", "manage", "delete"],
  ADMIN: ["read", "write", "approve", "manage"],
  MEMBER: ["read", "write"],
  VIEWER: ["read"],
};

export function can(role: MembershipRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function requirePermission(role: MembershipRole, action: Action) {
  if (!can(role, action)) {
    throw new Error(`Permission denied: ${action} requires higher role than ${role}`);
  }
}
