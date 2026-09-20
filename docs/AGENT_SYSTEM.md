# AI Company OS — Agent System

## Agent Definition

```typescript
Agent {
  id, name, department, role,
  systemInstructions, model, tools, connectors,
  permissions, knowledgeSources, memory, status, currentTask
}
```

## Reusable Runtime

Do not build independent chatbot implementations per department. One runtime accepts configuration:

- Instructions + model + tools + permissions + knowledge + memory + status

## Office Events

| Event | Description |
|---|---|
| AGENT_STARTED_TASK | Agent begins working on a task |
| AGENT_THINKING | Agent is processing/planning |
| AGENT_DELEGATED | Agent delegated work to another |
| AGENT_RECEIVED_TASK | Agent received delegated work |
| AGENT_COMPLETED | Agent finished a task |
| AGENT_WAITING_APPROVAL | Agent paused for human approval |
| AGENT_FAILED | Agent encountered an error |

## Mock Engine Contract (Phase 1)

```typescript
interface ExecutionEngine {
  submitGoal(orgId: string, goal: string): Promise<ExecutionPlan>
  startExecution(executionId: string): Promise<void>
  getAgentStatus(agentId: string): AgentStatus
}
```

Phase 1 uses keyword-based plan generation and timed simulation. Phase 3 swaps in real AI via the same interface.

## Structured Communication

Agents communicate through structured Task and Message objects, not only free-form chat.

## Demo Workflows

Example command: "Find 50 potential B2B customers in Germany and prepare an outreach campaign."

Mock engine assigns Marketing (research), Sales (outreach), Finance (budget review) with parallel and sequential steps.
