import { ConnectorStatus, PermissionLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { discoverMcpServers, type McpServer, type McpServerStatus } from "./discovery";
import { departmentsForServer, getMcpPolicy } from "./policy";

function toConnectorStatus(status: McpServerStatus): ConnectorStatus {
  switch (status) {
    case "connected":
      return "CONNECTED";
    case "needs-auth":
      return "DISCONNECTED";
    case "failed":
      return "ERROR";
    default:
      return "DISCONNECTED";
  }
}

export async function syncMcpToDatabase(organizationId: string) {
  const discovered = await discoverMcpServers();
  const policy = await getMcpPolicy(organizationId);

  const results: Array<{ name: string; status: string; tools: number }> = [];

  if (!discovered.length) {
    return { synced: 0, source: "none", results, message: "Claude CLI not available — using seeded connectors" };
  }

  for (const server of discovered) {
    const depts = departmentsForServer(server, policy);
    const status = toConnectorStatus(server.status);

    const existing = await db.connector.findFirst({
      where: { organizationId, provider: server.provider },
    });

    const connector = existing
      ? await db.connector.update({
          where: { id: existing.id },
          data: {
            name: server.name,
            status,
            config: {
              mcpId: server.id,
              target: server.target,
              source: server.source,
              departments: depts,
              liveStatus: server.status,
            },
          },
        })
      : await db.connector.create({
          data: {
            name: server.name,
            provider: server.provider,
            status,
            organizationId,
            config: {
              mcpId: server.id,
              target: server.target,
              source: server.source,
              departments: depts,
              liveStatus: server.status,
            },
          },
        });

    const toolNames =
      server.tools.length > 0
        ? server.tools
        : [`${server.provider}_search`, `${server.provider}_execute`];

    for (const toolName of toolNames) {
      const fullName = server.tools.length
        ? `mcp__${server.id}__${toolName}`
        : toolName;

      const existingTool = await db.tool.findFirst({
        where: { organizationId, connectorId: connector.id, name: fullName },
      });

      const toolData = {
        name: fullName,
        description: `${server.name} — ${toolName}`,
        permission: (/send|pay|post|create_contact/i.test(toolName)
          ? PermissionLevel.EXECUTE_WITH_APPROVAL
          : PermissionLevel.EXECUTE),
      };

      if (existingTool) {
        await db.tool.update({ where: { id: existingTool.id }, data: toolData });
      } else {
        await db.tool.create({
          data: { ...toolData, connectorId: connector.id, organizationId },
        });
      }
    }

    results.push({ name: server.name, status: server.status, tools: toolNames.length });
  }

  return { synced: results.length, source: "claude-mcp-list", results };
}

/** Ensure mcp-policy row exists with default department wiring. */
export async function ensureMcpPolicy(organizationId: string) {
  const existing = await db.connector.findFirst({
    where: { organizationId, provider: "mcp-policy" },
  });
  if (existing) return existing;

  return db.connector.create({
    data: {
      name: "MCP Policy",
      provider: "mcp-policy",
      status: "CONNECTED",
      organizationId,
      config: {
        allow: [],
        deny: [],
        departments: {
          gmail: ["sales", "customer-communication", "operations", "finance"],
          slack: ["operations", "customer-communication", "technology"],
          notion: ["marketing", "operations", "technology", "sales"],
          hubspot: ["sales", "marketing"],
        },
      },
    },
  });
}
