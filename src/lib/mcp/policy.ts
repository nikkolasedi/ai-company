import { db } from "@/lib/db";
import type { McpServer } from "./discovery";
import { departmentsForProvider } from "./departments";

export interface McpPolicy {
  allow: string[];
  deny: string[];
  departments: Record<string, string[]>;
}

const DEFAULT_POLICY: McpPolicy = {
  allow: [],
  deny: [],
  departments: {},
};

export async function getMcpPolicy(organizationId: string): Promise<McpPolicy> {
  const row = await db.connector.findFirst({
    where: { organizationId, provider: "mcp-policy" },
  });

  if (!row?.config) return DEFAULT_POLICY;
  const cfg = row.config as Partial<McpPolicy>;
  return {
    allow: cfg.allow ?? [],
    deny: cfg.deny ?? [],
    departments: cfg.departments ?? {},
  };
}

function matches(server: McpServer, pattern: string): boolean {
  const n = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    server.provider === n ||
    server.id === pattern ||
    server.name.toLowerCase().replace(/[^a-z0-9]/g, "") === n
  );
}

export function isDenied(server: McpServer, policy: McpPolicy): boolean {
  return policy.deny.some((d) => matches(server, d));
}

export function isAllowed(server: McpServer, policy: McpPolicy): boolean {
  if (isDenied(server, policy)) return false;
  if (!policy.allow.length) return true;
  return policy.allow.some((a) => matches(server, a));
}

export function departmentsForServer(
  server: McpServer,
  policy: McpPolicy
): string[] {
  for (const [key, depts] of Object.entries(policy.departments)) {
    if (matches(server, key)) return depts;
  }
  return departmentsForProvider(server.provider);
}

export function usableServers(servers: McpServer[], policy: McpPolicy): McpServer[] {
  return servers.filter(
    (s) => s.status === "connected" && isAllowed(s, policy) && !isDenied(s, policy)
  );
}
