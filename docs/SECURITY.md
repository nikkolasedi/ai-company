# AI Company OS — Security

## Permission Levels

| Level | Description |
|---|---|
| READ | View data only |
| DRAFT | Create drafts, no external action |
| EXECUTE | Perform actions autonomously |
| EXECUTE_WITH_APPROVAL | Requires human approval before action |

## Sensitive Actions (require approval)

- Payments and refunds
- Financial commitments
- Mass email sends
- External publishing
- Production code changes

## RBAC Roles

| Role | Capabilities |
|---|---|
| OWNER | Full control, billing, delete org |
| ADMIN | Manage agents, connectors, approvals |
| MEMBER | Submit goals, view dashboards |
| VIEWER | Read-only access |

## Security Requirements (production roadmap)

- Tenant isolation on every query
- Encrypted secrets (never in frontend/logs)
- Audit logs for all sensitive actions
- Least privilege for agent tool access
- Approval gates before EXECUTE_WITH_APPROVAL actions
- Rate limits and timeouts
- Input/output validation
- Prompt-injection protection
- Sandboxing for code execution

## Phase 1

Demo credentials only. RBAC helper stubs enforce org scoping on API writes. Approval UI updates local DB state.
