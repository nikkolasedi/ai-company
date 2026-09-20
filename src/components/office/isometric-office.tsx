"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentWithDepartment, DepartmentWithAgents, OfficeEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IsometricOfficeProps {
  departments: DepartmentWithAgents[];
  initialAgents: AgentWithDepartment[];
}

const statusAnimation: Record<string, string> = {
  THINKING: "animate-pulse",
  WORKING: "animate-bounce",
  WAITING_APPROVAL: "animate-pulse",
  DELEGATING: "animate-pulse",
};

function AgentAvatar({
  agent,
  deptColor,
  highlight,
}: {
  agent: AgentWithDepartment;
  deptColor: string;
  highlight?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Link href={`/agents/${agent.id}`}>
      <motion.div
        className="absolute cursor-pointer"
        style={{
          left: agent.deskX + 20,
          top: agent.deskY + 30,
        }}
        animate={
          highlight
            ? { scale: [1, 1.2, 1], y: [0, -4, 0] }
            : { scale: 1, y: 0 }
        }
        transition={{ duration: 0.6, repeat: highlight ? 2 : 0 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-shadow",
            statusAnimation[agent.status],
            highlight && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
          )}
          style={{
            backgroundColor: deptColor + "33",
            borderColor: deptColor,
            color: deptColor,
          }}
        >
          {agent.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
          {agent.status !== "IDLE" && (
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-zinc-900"
              style={{
                backgroundColor:
                  agent.status === "WORKING"
                    ? "#3b82f6"
                    : agent.status === "THINKING"
                      ? "#f59e0b"
                      : agent.status === "WAITING_APPROVAL"
                        ? "#f97316"
                        : "#71717a",
              }}
            />
          )}
        </div>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl"
            >
              <p className="font-semibold text-zinc-100">{agent.name}</p>
              <p className="text-zinc-400">{agent.role}</p>
              <div className="mt-1">
                <Badge status={agent.status} />
              </div>
              {agent.currentTask && (
                <p className="mt-1 truncate text-zinc-500">{agent.currentTask.title}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

function DepartmentZone({
  department,
  agents,
  highlightedAgentId,
}: {
  department: DepartmentWithAgents;
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
}) {
  return (
    <Link href={`/departments/${department.slug}`}>
      <motion.div
        className="absolute cursor-pointer"
        style={{ left: department.officeX, top: department.officeY }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <svg width="280" height="160" viewBox="0 0 280 160">
          <defs>
            <filter id={`shadow-${department.slug}`}>
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3" />
            </filter>
          </defs>
          <polygon
            points="140,10 270,80 140,150 10,80"
            fill={department.color + "15"}
            stroke={department.color}
            strokeWidth="2"
            filter={`url(#shadow-${department.slug})`}
          />
          <polygon
            points="140,30 250,85 140,140 30,85"
            fill={department.color + "08"}
            stroke={department.color + "66"}
            strokeWidth="1"
          />
        </svg>

        <div
          className="absolute left-1/2 top-8 -translate-x-1/2 text-center"
          style={{ width: 200 }}
        >
          <p className="text-sm font-semibold" style={{ color: department.color }}>
            {department.name}
          </p>
          <p className="text-xs text-zinc-500">
            {department.activeAgentCount} active · {department.agents.length} agents
          </p>
        </div>

        <div className="absolute inset-0">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={(e) => e.stopPropagation()}
            >
              <AgentAvatar
                agent={agent}
                deptColor={department.color}
                highlight={highlightedAgentId === agent.id}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}

export function IsometricOffice({ departments, initialAgents }: IsometricOfficeProps) {
  const [agents, setAgents] = useState(initialAgents);
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string>();

  useEffect(() => {
    const eventSource = new EventSource("/api/office/events");

    eventSource.onmessage = (e) => {
      const event: OfficeEvent = JSON.parse(e.data);
      setEvents((prev) => [event, ...prev].slice(0, 20));
      setHighlightedAgentId(event.agentId);
      setTimeout(() => setHighlightedAgentId(undefined), 3000);

      const statusMap: Record<string, AgentWithDepartment["status"]> = {
        AGENT_STARTED_TASK: "WORKING",
        AGENT_THINKING: "THINKING",
        AGENT_DELEGATED: "DELEGATING",
        AGENT_RECEIVED_TASK: "WORKING",
        AGENT_COMPLETED: "IDLE",
        AGENT_WAITING_APPROVAL: "WAITING_APPROVAL",
        AGENT_FAILED: "FAILED",
      };

      const newStatus = statusMap[event.type];
      if (newStatus) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agentId ? { ...a, status: newStatus } : a
          )
        );
      }
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const ceoAgent = agents.find((a) => a.isOrchestrator);

  return (
    <div className="flex h-full gap-4">
      <div className="relative flex-1 overflow-auto rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Virtual Office</h2>
            <p className="text-sm text-zinc-400">
              Click departments or agents to explore
            </p>
          </div>
          {ceoAgent && (
            <Link
              href={`/agents/${ceoAgent.id}`}
              className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm"
            >
              <span className="font-medium text-indigo-300">CEO</span>
              <span className="text-zinc-400">{ceoAgent.name}</span>
              <Badge status={ceoAgent.status} />
            </Link>
          )}
        </div>

        <div className="relative mx-auto" style={{ width: 900, height: 700 }}>
          <svg
            className="absolute inset-0 opacity-20"
            width="900"
            height="700"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 35}
                x2="900"
                y2={i * 35}
                stroke="#3f3f46"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {departments.map((dept) => (
            <DepartmentZone
              key={dept.id}
              department={dept}
              agents={agents.filter((a) => a.department.slug === dept.slug)}
              highlightedAgentId={highlightedAgentId}
            />
          ))}
        </div>
      </div>

      <div className="w-80 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Live Activity</h3>
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {events.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No live events yet. Submit a goal in Command Center to see agents work.
            </p>
          ) : (
            events.map((event, i) => (
              <motion.div
                key={`${event.timestamp}-${i}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{event.agentName}</span>
                  <span className="text-zinc-600">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-zinc-400">
                  {event.message ?? event.type.replace(/_/g, " ").toLowerCase()}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
