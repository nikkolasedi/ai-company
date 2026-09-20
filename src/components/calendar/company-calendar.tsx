"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  type: "routine" | "task" | "done";
  at: string;
  agentName: string;
  departmentSlug: string;
}

interface Routine {
  id: string;
  title: string;
  text: string;
  schedule: string;
  agentName: string;
  departmentSlug: string;
  paused: boolean;
  team: boolean;
  nextAt: string | null;
  lastAt: string | null;
  runs: number;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today ${time}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ${time}`;
}

export function CompanyCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [routineInput, setRoutineInput] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, routRes] = await Promise.all([
        fetch("/api/calendar?days=30"),
        fetch("/api/routines"),
      ]);
      if (calRes.ok) setEvents(await calRes.json());
      if (routRes.ok) setRoutines(await routRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateRoutine(e: React.FormEvent) {
    e.preventDefault();
    if (!routineInput.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: routineInput }),
      });
      if (res.ok) {
        setRoutineInput("");
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function togglePaused(id: string, paused: boolean) {
    await fetch(`/api/routines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    });
    await load();
  }

  async function runNow(id: string) {
    await fetch(`/api/routines/${id}/run`, { method: "POST" });
    await load();
  }

  async function removeRoutine(id: string) {
    await fetch(`/api/routines/${id}`, { method: "DELETE" });
    await load();
  }

  const upcoming = events.filter((e) => new Date(e.at) >= new Date()).slice(0, 15);
  const recent = events.filter((e) => new Date(e.at) < new Date()).slice(-10).reverse();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Create Routine
          </CardTitle>
          <CardDescription>
            Natural language schedules — e.g. &quot;every weekday at 8am, triage inbox&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRoutine} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={routineInput}
              onChange={(e) => setRoutineInput(e.target.value)}
              placeholder="every weekday at 8am, review sales pipeline"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <Button type="submit" disabled={creating || !routineInput.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Routine"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                Upcoming
              </CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">No upcoming events</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ev.title}</p>
                      <p className="text-xs text-zinc-500">
                        {ev.agentName}
                        {ev.departmentSlug ? ` · ${ev.departmentSlug}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-zinc-400">{formatWhen(ev.at)}</p>
                      <Badge status={ev.type === "routine" ? "RUNNING" : "IDLE"}>
                        {ev.type}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Routines</CardTitle>
            <CardDescription>{routines.length} scheduled automations</CardDescription>
          </CardHeader>
          <CardContent>
            {routines.length === 0 ? (
              <p className="text-sm text-zinc-500">No routines yet</p>
            ) : (
              <ul className="space-y-3">
                {routines.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{r.schedule}</p>
                        <p className="text-xs text-zinc-600">
                          {r.agentName} · {r.runs} runs
                          {r.team && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-indigo-400">
                              <Users className="h-3 w-3" /> team
                            </span>
                          )}
                        </p>
                        {r.nextAt && (
                          <p className="mt-1 text-xs text-indigo-300/80">
                            Next: {formatWhen(r.nextAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runNow(r.id)}
                          title="Run now"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePaused(r.id, !r.paused)}
                          title={r.paused ? "Resume" : "Pause"}
                        >
                          {r.paused ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoutine(r.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    {r.paused && (
                      <Badge status="WAITING_APPROVAL" className="mt-2">Paused</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recent.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-2 text-sm"
                >
                  <span className="truncate">{ev.title}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{formatWhen(ev.at)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
