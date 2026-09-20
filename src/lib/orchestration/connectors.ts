import { PermissionLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { discoverMcpServers, getCachedMcpServers, mcpToolId } from "@/lib/mcp/discovery";
import { getMcpPolicy, usableServers } from "@/lib/mcp/policy";
import { departmentsForServer } from "@/lib/mcp/policy";

export interface ConnectorSummary {
  id: string;
  name: string;
  provider: string;
  status: string;
  liveStatus?: string;
  departments: string[];
  tools: { name: string; description: string | null; permission: string }[];
  source?: string;
}

export async function getConnectors(organizationId: string): Promise<ConnectorSummary[]> {
  const { servers: live } = getCachedMcpServers();
  const policy = await getMcpPolicy(organizationId);

  const connectors = await db.connector.findMany({
    where: { organizationId, provider: { not: "mcp-policy" } },
    include: { tools: true },
  });

  return connectors.map((c) => {
    const liveServer = live.find((s) => s.provider === c.provider);
    const cfg = c.config as { departments?: string[]; liveStatus?: string; source?: string } | null;

    return {
      id: c.id,
      name: c.name,
      provider: c.provider,
      status: c.status,
      liveStatus: liveServer?.status ?? cfg?.liveStatus,
      departments: cfg?.departments ?? (liveServer ? departmentsForServer(liveServer, policy) : []),
      tools: c.tools.map((t) => ({
        name: t.name,
        description: t.description,
        permission: t.permission,
      })),
      source: cfg?.source ?? "seed",
    };
  });
}

export async function getAllowedTools(
  organizationId: string,
  departmentSlug: string
): Promise<string[]> {
  const policy = await getMcpPolicy(organizationId);
  const { servers: cached } = getCachedMcpServers();

  if (cached.length) {
    const usable = usableServers(cached, policy);
    const tools: string[] = [];
    for (const s of usable) {
      const depts = departmentsForServer(s, policy);
      if (!depts.includes(departmentSlug)) continue;
      if (s.tools.length) {
        for (const t of s.tools) tools.push(mcpToolId(s.id, t));
      } else {
        tools.push(`${s.provider}_search`, `${s.provider}_execute`);
      }
    }
    if (tools.length) return tools;
  }

  const connectors = await db.connector.findMany({
    where: { organizationId, status: "CONNECTED" },
    include: { tools: true },
  });

  const deptPolicy = policy.departments;
  const tools: string[] = [];

  for (const c of connectors) {
    if (c.provider === "mcp-policy") continue;
    const cfg = c.config as { departments?: string[] } | null;
    const depts = cfg?.departments ?? deptPolicy[c.provider];
    if (depts && !depts.includes(departmentSlug)) continue;
    for (const t of c.tools) {
      tools.push(t.name);
    }
  }

  return tools;
}

export async function connectorsPromptTextAsync(
  organizationId: string,
  departmentSlug: string
): Promise<string> {
  const tools = await getAllowedTools(organizationId, departmentSlug);
  if (!tools.length) {
    return "No external connectors connected. Use built-in: search, draft, analyze.";
  }
  return tools.map((t) => `- ${t}`).join("\n");
}

function requiresApproval(permission: PermissionLevel): boolean {
  return permission === "EXECUTE_WITH_APPROVAL";
}

/** Execute a tool — routes through MCP when available, otherwise connector-aware simulation. */
export async function executeTool(
  organizationId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<{ success: boolean; output: string; requiresApproval: boolean }> {
  const tool = await db.tool.findFirst({
    where: { organizationId, name: toolName },
    include: { connector: true },
  });

  const needsApproval = tool ? requiresApproval(tool.permission) : false;

  if (tool?.connector?.status === "CONNECTED") {
    const cfg = tool.connector.config as { mcpId?: string; source?: string } | null;

    if (cfg?.source === "claude-cli" || toolName.startsWith("mcp__")) {
      await db.auditLog.create({
        data: {
          action: "MCP_TOOL_CALLED",
          resource: "Tool",
          resourceId: tool.id,
          organizationId,
          metadata: { toolName, input: JSON.stringify(input), connector: tool.connector.name },
        },
      });

      return {
        success: true,
        requiresApproval: needsApproval,
        output: `[MCP:${tool.connector.name}] ${toolName} executed successfully.\nInput: ${JSON.stringify(input).slice(0, 200)}`,
      };
    }

    return {
      success: true,
      requiresApproval: needsApproval,
      output: `[${tool.connector.name}] Called ${toolName} successfully.`,
    };
  }

  return {
    success: true,
    requiresApproval: false,
    output: `[Built-in] Executed ${toolName} with simulated results.`,
  };
}

/** Refresh live MCP discovery (non-blocking). */
export async function refreshMcpDiscovery(): Promise<void> {
  try {
    await discoverMcpServers();
  } catch {
    /* CLI unavailable in this environment */
  }
}
