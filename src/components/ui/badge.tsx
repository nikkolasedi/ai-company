import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const statusColors: Record<string, string> = {
  IDLE: "bg-zinc-700 text-zinc-300",
  THINKING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  WORKING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  WAITING_APPROVAL: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  DELEGATING: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  FAILED: "bg-red-500/20 text-red-300 border-red-500/30",
  OFFLINE: "bg-zinc-800 text-zinc-500",
  PENDING: "bg-yellow-500/20 text-yellow-300",
  RUNNING: "bg-blue-500/20 text-blue-300",
  COMPLETED: "bg-green-500/20 text-green-300",
  APPROVED: "bg-green-500/20 text-green-300",
  REJECTED: "bg-red-500/20 text-red-300",
};

export function Badge({
  className,
  status,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium",
        status ? statusColors[status] ?? "bg-zinc-700 text-zinc-300" : "bg-zinc-700 text-zinc-300",
        className
      )}
      {...props}
    >
      {children ?? status?.replace(/_/g, " ")}
    </span>
  );
}
