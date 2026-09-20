"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { ApprovalStatus } from "@prisma/client";
import { Check, X, Loader2 } from "lucide-react";

interface ApprovalItem {
  id: string;
  title: string;
  description: string | null;
  status: ApprovalStatus;
  actionType: string;
  createdAt: Date;
  task: { title: string } | null;
}

export function ApprovalList({ approvals }: { approvals: ApprovalItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setLoadingId(id);
    try {
      await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  const pending = approvals.filter((a) => a.status === "PENDING");
  const resolved = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approval Center</h1>
        <p className="text-zinc-400">
          Review and approve sensitive agent actions
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-500">
            No pending approvals
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">
            Pending ({pending.length})
          </h2>
          {pending.map((approval) => (
            <Card key={approval.id} className="border-orange-500/20">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{approval.title}</p>
                    <Badge status={approval.status} />
                  </div>
                  {approval.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {approval.description}
                    </p>
                  )}
                  {approval.task && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Task: {approval.task.title}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-600">
                    {formatRelativeTime(approval.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loadingId === approval.id}
                    onClick={() => handleAction(approval.id, "APPROVED")}
                  >
                    {loadingId === approval.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={loadingId === approval.id}
                    onClick={() => handleAction(approval.id, "REJECTED")}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">History</h2>
          {resolved.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{approval.title}</p>
                  <p className="text-xs text-zinc-500">
                    {formatRelativeTime(approval.createdAt)}
                  </p>
                </div>
                <Badge status={approval.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
