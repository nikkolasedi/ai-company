import {
  AgentStatus,
  ApprovalStatus,
  PrismaClient,
  TaskStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEPARTMENTS = [
  {
    name: "Operations",
    slug: "operations",
    color: "#6366f1",
    description: "Process optimization, procurement, and daily operations",
    officeX: 100,
    officeY: 320,
    agents: [
      { name: "Alex Morgan", role: "Operations Manager", title: "Head of Operations", isOrchestrator: true, deskX: 0, deskY: 0 },
      { name: "Sam Rivera", role: "Process Analyst", title: "Process Analyst", deskX: 60, deskY: 20 },
      { name: "Jordan Lee", role: "Procurement", title: "Procurement Specialist", deskX: 120, deskY: 0 },
      { name: "Casey Kim", role: "Admin", title: "Administrative Coordinator", deskX: 180, deskY: 20 },
    ],
  },
  {
    name: "Marketing",
    slug: "marketing",
    color: "#ec4899",
    description: "Brand, content, SEO, and campaign management",
    officeX: 380,
    officeY: 120,
    agents: [
      { name: "Mia Chen", role: "Marketing Manager", title: "Head of Marketing", deskX: 0, deskY: 0 },
      { name: "Liam Foster", role: "Content", title: "Content Strategist", deskX: 60, deskY: 20 },
      { name: "Emma Walsh", role: "SEO", title: "SEO Specialist", deskX: 120, deskY: 0 },
      { name: "Noah Brooks", role: "Social Media", title: "Social Media Manager", deskX: 180, deskY: 20 },
      { name: "Ava Singh", role: "Brand", title: "Brand Designer", deskX: 240, deskY: 0 },
      { name: "Ethan Park", role: "Campaign Analyst", title: "Campaign Analyst", deskX: 300, deskY: 20 },
    ],
  },
  {
    name: "Sales",
    slug: "sales",
    color: "#22c55e",
    description: "Lead generation, outreach, CRM, and proposals",
    officeX: 680,
    officeY: 320,
    agents: [
      { name: "Olivia Hart", role: "Sales Manager", title: "Head of Sales", deskX: 0, deskY: 0 },
      { name: "James Reid", role: "Lead Research", title: "Lead Research Specialist", deskX: 60, deskY: 20 },
      { name: "Sophia Grant", role: "Outreach", title: "Outreach Specialist", deskX: 120, deskY: 0 },
      { name: "Ben Carter", role: "CRM", title: "CRM Manager", deskX: 180, deskY: 20 },
      { name: "Isabella Cruz", role: "Proposal", title: "Proposal Writer", deskX: 240, deskY: 0 },
      { name: "Lucas Meyer", role: "Sales Analyst", title: "Sales Analyst", deskX: 300, deskY: 20 },
    ],
  },
  {
    name: "Finance",
    slug: "finance",
    color: "#f59e0b",
    description: "Invoicing, cashflow, and financial reporting",
    officeX: 100,
    officeY: 520,
    agents: [
      { name: "Charlotte Weber", role: "Finance Manager", title: "Head of Finance", deskX: 0, deskY: 0 },
      { name: "Henry Bauer", role: "Invoice", title: "Invoice Specialist", deskX: 60, deskY: 20 },
      { name: "Amelia Koch", role: "Cashflow", title: "Cashflow Analyst", deskX: 120, deskY: 0 },
      { name: "Felix Braun", role: "Financial Reporting", title: "Financial Reporter", deskX: 180, deskY: 20 },
    ],
  },
  {
    name: "Customer & Communication",
    slug: "customer-communication",
    color: "#06b6d4",
    description: "Customer support, email, meetings, and success",
    officeX: 380,
    officeY: 520,
    agents: [
      { name: "Grace Nguyen", role: "Customer Support", title: "Support Lead", deskX: 0, deskY: 0 },
      { name: "Daniel Ortiz", role: "Email", title: "Email Specialist", deskX: 60, deskY: 20 },
      { name: "Chloe Martin", role: "Meeting", title: "Meeting Coordinator", deskX: 120, deskY: 0 },
      { name: "Ryan Patel", role: "Communication", title: "Communications Manager", deskX: 180, deskY: 20 },
      { name: "Zoe Anderson", role: "Customer Success", title: "Customer Success Manager", deskX: 240, deskY: 0 },
    ],
  },
  {
    name: "Technology",
    slug: "technology",
    color: "#8b5cf6",
    description: "Development, QA, data, and IT support",
    officeX: 680,
    officeY: 120,
    agents: [
      { name: "Marcus Tech", role: "CTO", title: "Chief Technology Officer", deskX: 0, deskY: 0 },
      { name: "Nina Code", role: "Developer", title: "Senior Developer", deskX: 60, deskY: 20 },
      { name: "Oscar Test", role: "QA", title: "QA Engineer", deskX: 120, deskY: 0 },
      { name: "Paula Data", role: "Data", title: "Data Analyst", deskX: 180, deskY: 20 },
      { name: "Quinn IT", role: "IT Support", title: "IT Support Specialist", deskX: 240, deskY: 0 },
    ],
  },
];

async function main() {
  console.log("Seeding Nova Coffee GmbH...");

  await db.auditLog.deleteMany();
  await db.approval.deleteMany();
  await db.message.deleteMany();
  await db.task.deleteMany();
  await db.execution.deleteMany();
  await db.workflow.deleteMany();
  await db.goal.deleteMany();
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
          model: "mock-gpt-4",
          tools: ["search", "draft", "analyze"],
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
