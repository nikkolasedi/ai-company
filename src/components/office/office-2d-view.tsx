"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
                        : agent.status === "DELEGATING"
                          ? "#06b6d4"
                          : "#71717a",
              }}
            />
          )}
        </div>
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
            <div key={agent.id} onClick={(e) => e.stopPropagation()}>
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

interface Office2DViewProps {
  departments: DepartmentWithAgents[];
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
}

export function Office2DView({
  departments,
  agents,
  highlightedAgentId,
}: Office2DViewProps) {
  return (
    <div className="flex h-full min-h-[320px] items-start justify-center overflow-auto">
      <div
        className="origin-top scale-[0.42] sm:scale-[0.55] md:scale-[0.72] lg:scale-100"
        style={{ width: 900, height: 700 }}
      >
        <div className="relative" style={{ width: 900, height: 700 }}>
          <svg className="absolute inset-0 opacity-20" width="900" height="700">
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
    </div>
  );
}
