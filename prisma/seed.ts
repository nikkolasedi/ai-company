import {
  AgentStatus,
  ApprovalStatus,
  PrismaClient,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  COMPACT_DESK_2D,
  DEPARTMENT_ZONE_LAYOUTS,
  departmentOfficeOrigin,
} from "../src/lib/office/layout";

const db = new PrismaClient();

const AGENTS_BY_SLUG: Record<
  string,
  Array<{
    name: string;
    role: string;
    title: string;
    isOrchestrator?: boolean;
  }>
> = {
  operations: [
    { name: "Alex Morgan", role: "Operations Manager", title: "Head of Operations", isOrchestrator: true },
    { name: "Sam Rivera", role: "Process Analyst", title: "Process Analyst" },
    { name: "Jordan Lee", role: "Procurement", title: "Procurement Specialist" },
    { name: "Casey Kim", role: "Admin", title: "Administrative Coordinator" },
  ],
  marketing: [
    { name: "Mia Chen", role: "Marketing Manager", title: "Head of Marketing" },
    { name: "Liam Foster", role: "Content", title: "Content Strategist" },
    { name: "Emma Walsh", role: "SEO", title: "SEO Specialist" },
    { name: "Noah Brooks", role: "Social Media", title: "Social Media Manager" },
    { name: "Ava Singh", role: "Brand", title: "Brand Designer" },
    { name: "Ethan Park", role: "Campaign Analyst", title: "Campaign Analyst" },
  ],
  sales: [
    { name: "Olivia Hart", role: "Sales Manager", title: "Head of Sales" },
    { name: "James Reid", role: "Lead Research", title: "Lead Research Specialist" },
    { name: "Sophia Grant", role: "Outreach", title: "Outreach Specialist" },
    { name: "Ben Carter", role: "CRM", title: "CRM Manager" },
    { name: "Isabella Cruz", role: "Proposal", title: "Proposal Writer" },
    { name: "Lucas Meyer", role: "Sales Analyst", title: "Sales Analyst" },
  ],
  finance: [
    { name: "Charlotte Weber", role: "Finance Manager", title: "Head of Finance" },
    { name: "Henry Bauer", role: "Invoice", title: "Invoice Specialist" },
    { name: "Amelia Koch", role: "Cashflow", title: "Cashflow Analyst" },
    { name: "Felix Braun", role: "Financial Reporting", title: "Financial Reporter" },
  ],
  "customer-communication": [
    { name: "Grace Nguyen", role: "Customer Support", title: "Support Lead" },
    { name: "Daniel Ortiz", role: "Email", title: "Email Specialist" },
    { name: "Chloe Martin", role: "Meeting", title: "Meeting Coordinator" },
    { name: "Ryan Patel", role: "Communication", title: "Communications Manager" },
    { name: "Zoe Anderson", role: "Customer Success", title: "Customer Success Manager" },
  ],
  technology: [
    { name: "Marcus Tech", role: "CTO", title: "Chief Technology Officer" },
    { name: "Nina Code", role: "Developer", title: "Senior Developer" },
    { name: "Oscar Test", role: "QA", title: "QA Engineer" },
    { name: "Paula Data", role: "Data", title: "Data Analyst" },
    { name: "Quinn IT", role: "IT Support", title: "IT Support Specialist" },
  ],
};

const DEPARTMENT_META: Record<string, { name: string; color: string; description: string }> = {
  operations: {
    name: "Operations",
    color: "#6366f1",
    description: "Process optimization, procurement, and daily operations",
  },
  marketing: {
    name: "Marketing",
    color: "#ec4899",
    description: "Brand, content, SEO, and campaign management",
  },
  sales: {
    name: "Sales",
    color: "#22c55e",
    description: "Lead generation, outreach, CRM, and proposals",
  },
  finance: {
    name: "Finance",
    color: "#f59e0b",
    description: "Invoicing, cashflow, and financial reporting",
  },
  "customer-communication": {
    name: "Customer & Communication",
    color: "#06b6d4",
    description: "Customer support, email, meetings, and success",
  },
  technology: {
    name: "Technology",
    color: "#8b5cf6",
    description: "Development, QA, data, and IT support",
  },
};

const DEPARTMENTS = DEPARTMENT_ZONE_LAYOUTS.map((zone) => {
  const origin = departmentOfficeOrigin(zone.center2d);
  const meta = DEPARTMENT_META[zone.slug];
  const agentDefs = AGENTS_BY_SLUG[zone.slug] ?? [];

  return {
    name: meta.name,
    slug: zone.slug,
    color: meta.color,
    description: meta.description,
    officeX: origin.officeX,
    officeY: origin.officeY,
    agents: agentDefs.map((agent, i) => ({
      ...agent,
      deskX: COMPACT_DESK_2D[i]?.deskX ?? 15,
      deskY: COMPACT_DESK_2D[i]?.deskY ?? 10,
    })),
  };
});

async function main() {
  console.log("Seeding Nova Coffee GmbH...");

  await db.auditLog.deleteMany();
  await db.approval.deleteMany();
  await db.message.deleteMany();
  await db.task.deleteMany();
  await db.execution.deleteMany();
  await db.workflow.deleteMany();
  await db.goal.deleteMany();
  await db.tool.deleteMany();
  await db.connector.deleteMany();
  await db.knowledgeDocument.deleteMany();
  await db.agentMemory.deleteMany();
  await db.agentMetric.deleteMany();
  await db.agent.deleteMany();
  await db.department.deleteMany();
  await db.membership.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();

  const org = await db.organization.create({
    data: {
      name: "Nova Coffee GmbH",
      slug: "nova-coffee",
      description:
        "Premium specialty coffee roaster and B2B supplier based in Berlin, Germany.",
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await db.user.create({
    data: {
      email: "ceo@novacoffee.demo",
      name: "Nikko CEO",
      passwordHash,
    },
  });

  await db.membership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  const allAgents: { id: string; name: string; role: string }[] = [];

  for (const dept of DEPARTMENTS) {
    const department = await db.department.create({
      data: {
        name: dept.name,
        slug: dept.slug,
        color: dept.color,
        description: dept.description,
        officeX: dept.officeX,
        officeY: dept.officeY,
        organizationId: org.id,
      },
    });

    for (const agent of dept.agents) {
      const created = await db.agent.create({
        data: {
          name: agent.name,
          role: agent.role,
          title: agent.title,
          status: AgentStatus.IDLE,
          systemInstructions: `You are ${agent.name}, the ${agent.role} at Nova Coffee GmbH. Focus on delivering excellent results for the ${dept.name} department.`,
          model: agent.isOrchestrator ? "claude-sonnet-4-20250514" : "gpt-4o-mini",
          tools: agent.isOrchestrator
            ? ["search", "draft", "analyze", "delegate"]
            : ["search", "draft", "analyze"],
          connectors: ["gmail", "slack", "notion"],
          permissions: agent.isOrchestrator ? "EXECUTE_WITH_APPROVAL" : "EXECUTE",
          deskX: agent.deskX,
          deskY: agent.deskY,
          isOrchestrator: agent.isOrchestrator ?? false,
          departmentId: department.id,
          organizationId: org.id,
        },
      });
      allAgents.push(created);
    }
  }

  const connectorDefs = [
    {
      name: "Gmail",
      provider: "gmail",
      tools: [
        { name: "gmail_send", description: "Send email via Gmail", permission: "EXECUTE_WITH_APPROVAL" as const },
        { name: "gmail_search", description: "Search inbox", permission: "READ" as const },
      ],
    },
    {
      name: "Slack",
      provider: "slack",
      tools: [
        { name: "slack_post", description: "Post to Slack channel", permission: "EXECUTE" as const },
        { name: "slack_search", description: "Search messages", permission: "READ" as const },
      ],
    },
    {
      name: "Notion",
      provider: "notion",
      tools: [
        { name: "notion_create_page", description: "Create Notion page", permission: "EXECUTE" as const },
        { name: "notion_search", description: "Search workspace", permission: "READ" as const },
      ],
    },
    {
      name: "HubSpot",
      provider: "hubspot",
      tools: [
        { name: "hubspot_create_contact", description: "Create CRM contact", permission: "EXECUTE_WITH_APPROVAL" as const },
        { name: "hubspot_search", description: "Search CRM", permission: "READ" as const },
      ],
    },
  ];

  await db.connector.create({
    data: {
      name: "MCP Policy",
      provider: "mcp-policy",
      status: "CONNECTED",
      organizationId: org.id,
      config: {
        allow: [],
        deny: [],
        departments: {
          gmail: ["sales", "customer-communication", "operations", "finance"],
          slack: ["operations", "customer-communication", "technology"],
          notion: ["marketing", "operations", "technology", "sales"],
          hubspot: ["sales", "marketing"],
        },
      },
    },
  });

  for (const def of connectorDefs) {
    const connector = await db.connector.create({
      data: {
        name: def.name,
        provider: def.provider,
        status: "CONNECTED",
        organizationId: org.id,
        config: {
          source: "seed",
          mcp: true,
          departments:
            def.provider === "gmail"
              ? ["sales", "customer-communication", "operations", "finance"]
              : def.provider === "slack"
                ? ["operations", "customer-communication", "technology"]
                : def.provider === "notion"
                  ? ["marketing", "operations", "technology", "sales"]
                  : def.provider === "hubspot"
                    ? ["sales", "marketing"]
                    : ["marketing", "sales", "operations"],
        },
      },
    });
    for (const tool of def.tools) {
      await db.tool.create({
        data: {
          name: tool.name,
          description: tool.description,
          permission: tool.permission,
          connectorId: connector.id,
          organizationId: org.id,
        },
      });
    }
  }

  await db.knowledgeDocument.create({
    data: {
      title: "Nova Coffee — Company Overview",
      content:
        "Nova Coffee GmbH is a Berlin-based specialty coffee roaster. We serve independent cafés and B2B clients across Germany with single-origin and house blend offerings.",
      organizationId: org.id,
    },
  });

  const marketingManager = allAgents.find((a) => a.role === "Marketing Manager")!;
  const salesOutreach = allAgents.find((a) => a.role === "Outreach")!;

  const task1 = await db.task.create({
    data: {
      title: "Q4 Instagram campaign draft",
      description: "Create content calendar for holiday season",
      status: TaskStatus.RUNNING,
      organizationId: org.id,
      assignedAgentId: marketingManager.id,
      estimatedCost: 0.12,
      estimatedMinutes: 15,
    },
  });

  await db.agent.update({
    where: { id: marketingManager.id },
    data: { status: AgentStatus.WORKING, currentTaskId: task1.id },
  });

  const task2 = await db.task.create({
    data: {
      title: "Berlin café lead list",
      description: "Research 50 potential B2B café clients in Berlin",
      status: TaskStatus.COMPLETED,
      organizationId: org.id,
      assignedAgentId: allAgents.find((a) => a.role === "Lead Research")!.id,
      estimatedCost: 0.18,
      estimatedMinutes: 20,
      completedAt: new Date(Date.now() - 3600000),
      result: "Identified 52 qualified leads in Berlin metro area",
    },
  });

  await db.task.create({
    data: {
      title: "Monthly invoice reconciliation",
      description: "Reconcile October supplier invoices",
      status: TaskStatus.PENDING,
      organizationId: org.id,
      assignedAgentId: allAgents.find((a) => a.role === "Invoice")!.id,
      estimatedCost: 0.08,
      estimatedMinutes: 10,
    },
  });

  await db.approval.create({
    data: {
      title: "Approve mass email campaign",
      description: "Outreach sequence to 200 B2B leads in Germany",
      actionType: "EXECUTE_WITH_APPROVAL",
      status: ApprovalStatus.PENDING,
      organizationId: org.id,
      payload: { agentId: salesOutreach.id, recipientCount: 200 },
    },
  });

  await db.approval.create({
    data: {
      title: "Approve supplier payment",
      description: "Payment of €4,500 to Green Bean Suppliers Ltd",
      actionType: "EXECUTE_WITH_APPROVAL",
      status: ApprovalStatus.PENDING,
      organizationId: org.id,
      payload: { amount: 4500, currency: "EUR" },
    },
  });

  const auditEntries = [
    { action: "GOAL_SUBMITTED", resource: "Goal", metadata: { title: "Expand B2B sales in Germany" } },
    { action: "TASK_COMPLETED", resource: "Task", resourceId: task2.id, metadata: { agent: "James Reid" } },
    { action: "APPROVAL_REQUESTED", resource: "Approval", metadata: { title: "Mass email campaign" } },
    { action: "AGENT_ASSIGNED", resource: "Task", resourceId: task1.id, metadata: { agent: "Mia Chen" } },
    { action: "DEPARTMENT_VIEWED", resource: "Department", metadata: { slug: "marketing" } },
  ];

  for (const entry of auditEntries) {
    await db.auditLog.create({
      data: {
        ...entry,
        organizationId: org.id,
        userId: user.id,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
      },
    });
  }

  console.log(`Seeded ${allAgents.length} agents across ${DEPARTMENTS.length} departments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
