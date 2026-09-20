# AI Company OS

A virtual AI workforce platform where business owners manage specialized AI agents through an interactive isometric office. The office is the navigation layer; orchestration, permissions, and connectors are the product underneath.

**Phase 1** delivers a fully functional demo with simulated agent execution — no external API keys required.

## Demo Company

**Nova Coffee GmbH** — Premium specialty coffee roaster and B2B supplier in Berlin.

| | |
|---|---|
| Email | `ceo@novacoffee.demo` |
| Password | `demo1234` |

## Features (Phase 1)

- Interactive virtual office with 2D/3D views (ClawProwl-style R3F scene), 6 departments and ~30 AI agents
- Click departments and agents to navigate
- Live agent status simulation via SSE events
- Company dashboard with health metrics
- Command center — submit business goals, get execution plans, start mock workflows
- Approval center for sensitive actions
- Full PostgreSQL schema ready for Phase 2+

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Or use an existing PostgreSQL instance and update `DATABASE_URL` accordingly.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if needed. Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Install and setup database

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials.

## Project Structure

```
docs/           Product, architecture, agent system, security, roadmap
prisma/         Database schema and seed data
src/app/        Next.js pages and API routes
src/components/ Office, dashboard, command center, UI
src/lib/        Auth, DB, mock engine, events, RBAC
```

## Documentation

- [Product Vision](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Agent System](docs/AGENT_SYSTEM.md)
- [Security](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)

## Development Phases

| Phase | Focus |
|---|---|
| **1** (current) | Interactive office + simulated workforce |
| 2 | Task engine + orchestrator + approvals |
| 3 | Real AI provider + agent runtime |
| 4 | Connectors / MCP |
| 5 | Knowledge ingestion + memory |
| 6 | Billing, SSO, production hardening |

## Tech Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS, Framer Motion, React Three Fiber
- PostgreSQL, Prisma
- NextAuth.js (credentials)
