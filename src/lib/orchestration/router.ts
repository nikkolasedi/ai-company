import type { Agent, Department } from "@prisma/client";
import { getAIProvider, providerForModel } from "@/lib/ai/provider";
import { skillNamesForAgent } from "./skills";

type AgentWithDept = Agent & { department: Department };

interface RouteResult {
  agentId: string;
  title: string;
  plan: string;
  needsApproval: boolean;
}

export async function routeTask(
  agents: AgentWithDept[],
  departmentSlug: string,
  taskText: string,
  ceoModel?: string
): Promise<RouteResult> {
  const deptAgents = agents.filter((a) => a.department.slug === departmentSlug);
  const roster = deptAgents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    skills: skillNamesForAgent(a.id, a.department.slug),
  }));

  const ceo = agents.find((a) => a.isOrchestrator);
  const provider = ceoModel ? providerForModel(ceoModel) : getAIProvider(ceo?.model);

  const systemPrompt = `You are a task router. Pick the best agent for the task.
Return ONLY valid JSON: {"agentId":"<id>","title":"<short title>","plan":"<one sentence>","needsApproval":<boolean>}
Set needsApproval true if the task involves sending emails, payments, publishing, or posting externally.
Available agents: ${JSON.stringify(roster)}`;

  try {
    const result = await provider.complete({
      systemPrompt: systemPrompt + "\n\nroute",
      userPrompt: taskText,
      maxTokens: 512,
    });

    const parsed = JSON.parse(result.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as Partial<RouteResult>;
    const agent =
      deptAgents.find((a) => a.id === parsed.agentId) ??
      deptAgents.find((a) => /manager|lead|head/i.test(a.role)) ??
      deptAgents[0];

    return {
      agentId: agent?.id ?? ceo?.id ?? agents[0].id,
      title: parsed.title ?? "Execute task",
      plan: parsed.plan ?? taskText,
      needsApproval: parsed.needsApproval ?? /send|email|pay|post|publish/i.test(taskText),
    };
  } catch {
    const fallback =
      deptAgents.find((a) => /manager|lead/i.test(a.role)) ?? deptAgents[0] ?? agents[0];
    return {
      agentId: fallback.id,
      title: taskText.slice(0, 80),
      plan: taskText,
      needsApproval: /send|email|pay|post|publish/i.test(taskText),
    };
  }
}
