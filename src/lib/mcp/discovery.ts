import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type McpServerStatus = "connected" | "needs-auth" | "failed" | "pending";

export interface McpServer {
  id: string;
  name: string;
  provider: string;
  status: McpServerStatus;
  target: string;
  tools: string[];
  source: "claude-cli" | "chrome" | "seed";
}

const STATUS_MAP: Record<string, McpServerStatus> = {
  "✔": "connected",
  "✓": "connected",
  "!": "needs-auth",
  "✗": "failed",
  "✘": "failed",
  "⏸": "pending",
};

function normalizeId(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]+/g, "_");
}

function displayName(name: string): string {
  return name.replace(/^claude\.ai\s+/i, "").replace(/\s+MCP$/i, "");
}

function providerFromName(name: string): string {
  return displayName(name).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseMcpList(text: string): McpServer[] {
  const servers: McpServer[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, "").trim();
    const match = line.match(/^(.+?):\s+(.+?)\s+-\s+(\S)\s*(.*)$/);
    if (!match) continue;

    const [, rawName, target, symbol, rest] = match;
    const status =
      STATUS_MAP[symbol] ??
      (/connected/i.test(rest) ? "connected" : /auth/i.test(rest) ? "needs-auth" : "failed");

    const name = displayName(rawName);
    servers.push({
      id: normalizeId(rawName),
      name,
      provider: providerFromName(rawName),
      status,
      target: target.trim(),
      tools: [],
      source: "claude-cli",
    });
  }

  return servers;
}

function browserState(): { installed: boolean; device: string } {
  try {
    const j = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), ".claude.json"), "utf8")
    );
    return {
      installed: !!j.cachedChromeExtensionInstalled,
      device: j.chromeExtension?.pairedDeviceName || "",
    };
  } catch {
    return { installed: false, device: "" };
  }
}

function chromeServer(existing?: McpServer): McpServer {
  const b = browserState();
  return {
    id: "claude-in-chrome",
    name: "Chrome",
    provider: "chrome",
    status: existing?.status === "connected"
      ? "connected"
      : b.installed
        ? "connected"
        : "pending",
    target: b.device ? `Claude in Chrome · ${b.device}` : "Claude in Chrome extension",
    tools: existing?.tools ?? ["browser_navigate", "browser_read", "browser_click"],
    source: "chrome",
  };
}

let cachedServers: McpServer[] = [];
let discoveredAt = 0;

export function getCachedMcpServers(): { servers: McpServer[]; discoveredAt: number } {
  return { servers: cachedServers, discoveredAt };
}

export function discoverMcpServers(timeoutMs = 15000): Promise<McpServer[]> {
  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.CLAUDECODE;

    let output = "";
    let finished = false;

    const finish = (list: McpServer[]) => {
      if (finished) return;
      finished = true;
      const withChrome = [...list.filter((s) => s.id !== "claude-in-chrome"), chromeServer()];
      cachedServers = withChrome;
      discoveredAt = Date.now();
      resolve(withChrome);
    };

    try {
      const proc = spawn("claude", ["mcp", "list"], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const timer = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          /* ignore */
        }
        finish(parseMcpList(output));
      }, timeoutMs);

      proc.stdout.on("data", (d) => {
        output += d.toString();
      });
      proc.stderr.on("data", (d) => {
        output += d.toString();
      });
      proc.on("error", () => {
        clearTimeout(timer);
        finish([]);
      });
      proc.on("close", () => {
        clearTimeout(timer);
        finish(parseMcpList(output));
      });
    } catch {
      finish([]);
    }
  });
}

export function mcpToolId(serverId: string, toolName: string): string {
  return `mcp__${serverId}__${toolName}`;
}
