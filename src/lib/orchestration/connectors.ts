import { db } from "@/lib/db";

export interface ConnectorSummary {
  id: string;
  name: string;
  provider: string;
  status: string;
  tools: { name: string; description: string | null; permission: string }[];
}

export async function getConnectors(organizationId: string): Promise<ConnectorSummary[]> {
  const connectors = await db.connector.findMany({
    where: { organizationId },
    include: { tools: true },
  });

  return connectors.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    status: c.status,
    tools: c.tools.map((t) => ({
      name: t.name,
      description: t.description,
      permission: t.permission,
    })),
  }));
}

export async function getAllowedTools(
  organizationId: string,
  departmentSlug: string
): Promise<string[]> {
  const connectors = await db.connector.findMany({
    where: { organizationId, status: "CONNECTED" },
    include: { tools: true },
  });

  const config = await db.connector.findFirst({
    where: { organizationId, provider: "mcp-policy" },
  });

  const deptAllow =
    (config?.config as { departments?: Record<string, string[]> } | null)?.departments?.[
      departmentSlug
    ] ?? null;

  const tools: string[] = [];
  for (const c of connectors) {
    if (c.provider === "mcp-policy") continue;
    if (deptAllow && !deptAllow.includes(c.provider)) continue;
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

/** Simulate tool execution — Phase 2 stub; Phase 3 wires real MCP. */
export async function executeTool(
  organizationId: string,
  toolName: string,
  _input: Record<string, unknown>
): Promise<{ success: boolean; output: string }> {
  const tool = await db.tool.findFirst({
    where: { organizationId, name: toolName },
    include: { connector: true },
  });

  if (!tool || tool.connector?.status !== "CONNECTED") {
    return {
      success: true,
      output: `[Built-in] Executed ${toolName} with simulated results.`,
    };
  }

  return {
    success: true,
    output: `[${tool.connector.name}] Called ${toolName} successfully.`,
  };
}
