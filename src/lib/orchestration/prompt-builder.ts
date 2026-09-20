import type { Agent, Department } from "@prisma/client";
import { db } from "@/lib/db";
import { searchKnowledge } from "@/lib/knowledge/search";
import { skillsPromptText } from "./skills";
import { connectorsPromptTextAsync } from "./connectors";

type AgentWithDept = Agent & { department: Department };

export async function buildAgentSystemPrompt(
  agent: AgentWithDept,
  organizationId: string
): Promise<string> {
  const lessons = await db.agentMemory.findMany({
    where: { agentId: agent.id, organizationId, type: "lesson" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const searchQuery = `${agent.role} ${agent.department.name}`;
  const hits = await searchKnowledge(organizationId, searchQuery, 6);
  const docs =
    hits.length > 0
      ? hits
      : (
          await db.knowledgeDocument.findMany({
            where: { organizationId },
            take: 5,
            orderBy: { updatedAt: "desc" },
          })
        ).map((d) => ({
          id: d.id,
          title: d.title,
          snippet: (d.content ?? "").slice(0, 200),
          score: 0,
        }));

  const skills = skillsPromptText(agent.id, agent.department.slug);
  const tools = await connectorsPromptTextAsync(organizationId, agent.department.slug);
  const lessonsText = lessons.map((l) => `- ${l.content}`).join("\n");
  const knowledgeText = docs
    .map((d) => `- [[${d.title}]]${d.snippet ? `: ${d.snippet}` : ""}`)
    .join("\n");

  return [
    `# Identity`,
    `You are ${agent.name}, ${agent.role} at the company.`,
    agent.title ? `Title: ${agent.title}` : "",
    ``,
    `# Brief`,
    agent.systemInstructions ?? "Deliver excellent work for your department.",
    ``,
    skills ? `# Skills\n${skills}` : "",
    lessonsText ? `# Standing lessons\n${lessonsText}` : "",
    tools ? `# Available tools\n${tools}` : "",
    knowledgeText ? `# Company knowledge\n${knowledgeText}` : "",
    ``,
    `# Rules`,
    `- Be concise and actionable`,
    `- Flag actions needing CEO approval (send, pay, post, publish)`,
    `- Output in Markdown unless asked otherwise`,
  ]
    .filter(Boolean)
    .join("\n");
}
