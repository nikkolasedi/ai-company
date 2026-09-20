"use client";

import { useEffect, useState } from "react";
import type { AgentWithDepartment, OfficeEvent } from "@/types";

const STATUS_MAP: Record<string, AgentWithDepartment["status"]> = {
  AGENT_STARTED_TASK: "WORKING",
  AGENT_THINKING: "THINKING",
  AGENT_DELEGATED: "DELEGATING",
  AGENT_RECEIVED_TASK: "WORKING",
  AGENT_COMPLETED: "IDLE",
  AGENT_WAITING_APPROVAL: "WAITING_APPROVAL",
  AGENT_FAILED: "FAILED",
};

export interface DelegationLink {
  fromAgentId: string;
  toAgentId: string;
  timestamp: number;
}

export function useOfficeLiveData(initialAgents: AgentWithDepartment[]) {
  const [agents, setAgents] = useState(initialAgents);
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [highlightedAgentId, setHighlightedAgentId] = useState<string>();
  const [delegationLinks, setDelegationLinks] = useState<DelegationLink[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/office/events");

    eventSource.onmessage = (e) => {
      const event: OfficeEvent = JSON.parse(e.data);
      setEvents((prev) => [event, ...prev].slice(0, 20));
      setHighlightedAgentId(event.agentId);
      setTimeout(() => setHighlightedAgentId(undefined), 3000);

      const newStatus = STATUS_MAP[event.type];
      if (newStatus) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agentId ? { ...a, status: newStatus } : a
          )
        );
      }

      if (event.type === "AGENT_DELEGATED" && event.message) {
        const targetMatch = event.message.match(/to\s+(.+)$/i);
        if (targetMatch) {
          const targetName = targetMatch[1].trim();
          setAgents((current) => {
            const target = current.find(
              (a) => a.name.toLowerCase() === targetName.toLowerCase()
            );
            if (target) {
              setDelegationLinks((links) =>
                [
                  {
                    fromAgentId: event.agentId,
                    toAgentId: target.id,
                    timestamp: Date.now(),
                  },
                  ...links,
                ].slice(0, 8)
              );
            }
            return current;
          });
        }
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

  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 8000;
      setDelegationLinks((links) => links.filter((l) => l.timestamp > cutoff));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    agents,
    events,
    highlightedAgentId,
    delegationLinks,
  };
}
