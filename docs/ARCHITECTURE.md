# AI Company OS — Architecture

## Layers

```
┌─────────────────────────────────────────┐
│  UI Layer (Isometric Office, Dashboard) │
├─────────────────────────────────────────┤
│  API Layer (Next.js Route Handlers)     │
├─────────────────────────────────────────┤
│  Orchestration (CEO, Workflows, Tasks)  │
├─────────────────────────────────────────┤
│  Agent Runtime (Single reusable engine) │
├─────────────────────────────────────────┤
│  Connectors / MCP Registry              │
├─────────────────────────────────────────┤
│  Data Layer (PostgreSQL + Prisma)       │
└─────────────────────────────────────────┘
```

## Key Principle

**One reusable Agent Runtime.** Every employee uses the same runtime; their role is configuration.

## Event-Driven Office

The visual office subscribes to events and remains independent from AI execution:

- `AGENT_STARTED_TASK`
- `AGENT_THINKING`
- `AGENT_DELEGATED`
- `AGENT_RECEIVED_TASK`
- `AGENT_COMPLETED`
- `AGENT_WAITING_APPROVAL`
- `AGENT_FAILED`

Events flow via SSE from the mock/real execution engine to the office UI.

## Multi-Tenant Model

All data is scoped by `Organization`. Users access organizations through `Membership` with RBAC roles.

## Core Entities

Organization → Departments → Agents → Tasks/Workflows/Goals → Executions → Approvals → AuditLogs

Knowledge and connectors are first-class entities with permission boundaries.

## Phase 1 Scope

- Full schema, demo seed data
- Mock execution engine (no real LLM)
- SSE office events
- NextAuth demo login
