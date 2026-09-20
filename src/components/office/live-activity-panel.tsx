"use client";

import { motion } from "framer-motion";
import type { OfficeEvent } from "@/types";

interface LiveActivityPanelProps {
  events: OfficeEvent[];
}

export function LiveActivityPanel({ events }: LiveActivityPanelProps) {
  return (
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
  );
}
