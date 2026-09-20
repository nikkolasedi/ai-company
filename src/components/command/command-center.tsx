"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ExecutionPlan } from "@/types";
import { Sparkles, Play, Loader2, Users, Clock } from "lucide-react";

const EXAMPLE_GOALS = [
  "Find 50 potential B2B customers in Germany and prepare an outreach campaign",
  "Launch a Q4 social media campaign for our new espresso blend",
  "Review monthly budget and optimize supplier costs",
];

export function CommandCenter() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [teamMode, setTeamMode] = useState(false);
  const [routineInput, setRoutineInput] = useState("");
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch("/api/command/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, team: teamMode }),
      });
      if (res.ok) {
        setPlan(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!plan) return;
    setExecuting(true);
    try {
      await fetch("/api/command/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId: plan.id }),
      });
      router.push("/office");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          Command Center
        </h1>
        <p className="mt-1 text-zinc-400">
          Give your AI company a high-level business objective
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Goal</CardTitle>
          <CardDescription>
            The CEO orchestrator will create an execution plan and delegate to specialized agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe what you want your company to achieve..."
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setTeamMode(!teamMode)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  teamMode
                    ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                    : "border-zinc-700 text-zinc-400 hover:border-indigo-500"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Team mode
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_GOALS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setGoal(example)}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-indigo-500 hover:text-indigo-300"
                >
                  {example.slice(0, 50)}...
                </button>
              ))}
            </div>
            <Button type="submit" disabled={loading || !goal.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating plan...
                </>
              ) : (
                "Generate Execution Plan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {plan && (
        <Card className="border-indigo-500/30">
          <CardHeader>
            <CardTitle>Execution Plan</CardTitle>
            <CardDescription>{plan.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Est. cost: </span>
                <span className="font-medium">{formatCurrency(plan.estimatedCost)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Est. time: </span>
                <span className="font-medium">{plan.estimatedMinutes} min</span>
              </div>
              <div>
                <span className="text-zinc-500">Agents: </span>
                <span className="font-medium">{plan.participatingAgents.length}</span>
              </div>
              {plan.requiresApproval && (
                <Badge status="WAITING_APPROVAL">Requires approval</Badge>
              )}
              {plan.isTeam && (
                <Badge status="RUNNING">Team execution</Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">Participating agents</p>
              <div className="flex flex-wrap gap-2">
                {plan.participatingAgents.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs"
                  >
                    {a.name} · {a.role}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">Steps</p>
              {plan.steps.map((step, i) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-300">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-zinc-500">
                      {step.agentName} · {step.department}
                      {step.team && " · Team step"}
                      {step.requiresApproval && " · Needs approval"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleStart} disabled={executing} size="lg" className="w-full">
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting execution...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Execution
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Schedule a Routine
          </CardTitle>
          <CardDescription>
            Automate recurring work — e.g. &quot;every weekday at 8am, review pipeline&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!routineInput.trim()) return;
              setCreatingRoutine(true);
              try {
                const res = await fetch("/api/routines", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ input: routineInput, team: teamMode }),
                });
                if (res.ok) {
                  setRoutineInput("");
                  router.push("/calendar");
                }
              } finally {
                setCreatingRoutine(false);
              }
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={routineInput}
              onChange={(e) => setRoutineInput(e.target.value)}
              placeholder="every weekday at 8am, triage inbox"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <Button type="submit" disabled={creatingRoutine || !routineInput.trim()}>
              {creatingRoutine ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Routine"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
