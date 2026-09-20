import type { Agent, Department } from "@prisma/client";
import { providerForModel, getAIProvider } from "@/lib/ai/provider";
import { skillNamesForAgent } from "./skills";

type AgentWithDept = Agent & { department: Department };

export interface TeamPiece {
  agentId: string;
  agentName: string;
  title: string;
  text: string;
}

const TEAM_INTENT =
  /\b(as a team|team up|with the team|split (it|this|the work)|teammates|whole department)\b/i;

export function teamIntent(text: string): boolean {
  return TEAM_INTENT.test(text);
}

export async function planTeamPieces(
  agents: AgentWithDept[],
  departmentSlug: string,
  goal: string,
  leadModel?: string
): Promise<{ pieces: TeamPiece[]; why: string; solo: boolean }> {
  const deptAgents = agents.filter((a) => a.department.slug === departmentSlug);
  const lead =
    deptAgents.find((a) => /manager|lead|head|cto/i.test(a.role)) ?? deptAgents[0];
  if (!lead) {
    return { pieces: [], why: "", solo: true };
  }

  const seats = deptAgents.slice(0, 4).map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    skills: skillNamesForAgent(a.id, a.department.slug),
  }));

  const provider = leadModel ? providerForModel(leadModel) : getAIProvider();

  try {
    const result = await provider.complete({
      systemPrompt: `You are ${lead.name}, department lead. Split the request across your team.
Return ONLY JSON: {"pieces":[{"agentId":"<id>","title":"...","text":"..."}],"why":"..."}
Use 2-${Math.min(4, seats.length)} independent pieces. agentId must be from the roster.`,
      userPrompt: `Roster: ${JSON.stringify(seats)}\n\nRequest: ${goal}`,
      maxTokens: 1200,
    });

    const parsed = JSON.parse(
      result.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}"
    ) as {
      pieces?: Array<{ agentId?: string; agent?: string; title?: string; text?: string }>;
      why?: string;
    };

    const pieces: TeamPiece[] = [];
    const taken = new Set<string>();

    for (const p of parsed.pieces ?? []) {
      const agentId = p.agentId ?? p.agent;
      const agent = deptAgents.find((a) => a.id === agentId);
      const text = String(p.text ?? "").trim();
      if (!agent || taken.has(agent.id) || !text) continue;
      taken.add(agent.id);
      pieces.push({
        agentId: agent.id,
        agentName: agent.name,
        title: String(p.title ?? text).slice(0, 90),
        text: text.slice(0, 2000),
      });
      if (pieces.length >= 4) break;
    }

    if (pieces.length <= 1) {
      return {
        pieces: [
          {
            agentId: lead.id,
            agentName: lead.name,
            title: goal.slice(0, 90),
            text: goal,
          },
        ],
        why: parsed.why ?? "",
        solo: true,
      };
    }

    return { pieces, why: parsed.why ?? "", solo: false };
  } catch {
    const others = deptAgents.filter((a) => a.id !== lead.id).slice(0, 2);
    return {
      pieces: [
        { agentId: lead.id, agentName: lead.name, title: "Lead analysis", text: goal },
        ...others.map((a, i) => ({
          agentId: a.id,
          agentName: a.name,
          title: `Research angle ${i + 1}`,
          text: `Contribute your perspective on: ${goal}`,
        })),
      ],
      why: "Fallback split across department",
      solo: false,
    };
  }
}

export async function synthesizeTeam(
  lead: AgentWithDept,
  goal: string,
  pieces: Array<{ agentName: string; title: string; body: string }>
): Promise<string> {
  const provider = providerForModel(lead.model);
  const combined = pieces
    .map((p) => `## ${p.agentName}: ${p.title}\n${p.body}`)
    .join("\n\n");

  try {
    const result = await provider.complete({
      systemPrompt: `You are ${lead.name}, synthesizing team outputs into one deliverable.`,
      userPrompt: `Original goal: ${goal}\n\nTeam pieces:\n${combined}\n\nWrite the final unified deliverable.`,
      maxTokens: 2048,
    });
    return result.content;
  } catch {
    return `# Team Deliverable\n\n${combined}`;
  }
}
