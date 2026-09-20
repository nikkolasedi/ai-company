import fs from "node:fs";
import path from "node:path";

export interface Skill {
  name: string;
  description: string;
  body: string;
  departments: string[];
  agentIds: string[];
}

const SKILLS_DIR = path.join(process.cwd(), "skills");

function parseFrontmatter(text: string): { meta: Record<string, unknown>; body: string } {
  const meta: Record<string, unknown> = {};
  let body = text;
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    body = text.slice(match[0].length);
    for (const line of match[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1].toLowerCase();
      const val = kv[2].trim();
      if (val.startsWith("[")) {
        meta[key] = val
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        meta[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
  return { meta, body: body.trim() };
}

function loadSkillFile(filePath: string, folderName: string): Skill | null {
  const text = fs.readFileSync(filePath, "utf8");
  const { meta, body } = parseFrontmatter(text);
  if (!body) return null;

  const departments = Array.isArray(meta.departments)
    ? (meta.departments as string[])
    : meta.departments
      ? [String(meta.departments)]
      : [];

  const agentIds = Array.isArray(meta.agents)
    ? (meta.agents as string[])
    : meta.agents
      ? [String(meta.agents)]
      : [];

  return {
    name: String(meta.name ?? folderName).toLowerCase(),
    description: String(meta.description ?? ""),
    body: body.slice(0, 6000),
    departments: departments.map((d) => d.toLowerCase()),
    agentIds: agentIds.map((a) => a.toLowerCase()),
  };
}

let cachedSkills: Skill[] | null = null;

export function loadSkills(): Skill[] {
  if (cachedSkills) return cachedSkills;
  const skills: Skill[] = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    cachedSkills = skills;
    return skills;
  }

  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        const skill = loadSkillFile(skillFile, entry.name);
        if (skill) skills.push(skill);
      }
    } else if (entry.name.endsWith(".md") && entry.name.toUpperCase() !== "README.MD") {
      const skill = loadSkillFile(path.join(SKILLS_DIR, entry.name), entry.name.replace(/\.md$/i, ""));
      if (skill) skills.push(skill);
    }
  }

  cachedSkills = skills;
  return skills;
}

export function skillsForAgent(
  agentId: string,
  departmentSlug: string
): Skill[] {
  const all = loadSkills();
  const id = agentId.toLowerCase();
  const dept = departmentSlug.toLowerCase();

  return all.filter(
    (s) =>
      s.agentIds.includes(id) ||
      s.departments.includes(dept) ||
      (s.agentIds.length === 0 && s.departments.length === 0)
  );
}

export function skillNamesForAgent(agentId: string, departmentSlug: string): string[] {
  return skillsForAgent(agentId, departmentSlug).map((s) => s.name);
}

export function skillsPromptText(agentId: string, departmentSlug: string): string {
  const skills = skillsForAgent(agentId, departmentSlug);
  if (!skills.length) return "";
  return skills
    .map((s) => `## Skill: ${s.name}\n${s.description}\n\n${s.body}`)
    .join("\n\n---\n\n");
}
