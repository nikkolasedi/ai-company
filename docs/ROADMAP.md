# AI Company OS — Roadmap

## Phase 1 — Interactive Office + Simulated Workforce ✅ (current)

**Deliverables:**
- Running Next.js app with auth
- Full Prisma schema + Nova Coffee seed
- Interactive isometric office
- Agent state simulation via mock engine
- Department navigation + agent profiles
- Command center mockup
- Documentation + README

**Exit criteria:** Login → office → click departments/agents → submit goal → see simulated execution.

## Phase 2 — Command Center + Task Engine

- Real task system with dependencies
- Orchestrator delegation logic
- Activity stream
- Approval center (full workflow)

## Phase 3 — Real AI Runtime

- AI provider abstraction (OpenAI, Anthropic)
- Agent runtime with tool calling
- Structured outputs
- CEO → Marketing → Sales workflows

## Phase 4 — Connectors / MCP

- Connector registry
- Gmail, Slack, HubSpot, etc.
- Permission layer before tool execution

## Phase 5 — Knowledge & Memory

- PDF/DOCX/TXT/CSV/URL ingestion
- Company knowledge retrieval
- Agent/task/conversation memory (bounded, inspectable)

## Phase 6 — Production SaaS

- Billing and usage limits
- Enterprise SSO
- Audit logs, observability
- Security hardening, rate limiting
- Multi-tenant isolation at scale

## Engineering Principle

> The office is the interface. The orchestration engine is the product. The connector system is the infrastructure. The company knowledge base is the context. The agents are the workforce. The human is the CEO.
