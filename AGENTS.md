# AGENTS

## Goal
Build reliable and auditable personal automation workflows for web tasks.

## Working rules

- Keep credentials out of task files.
- Use secret references (`secret_ref`) and resolve at runtime.
- Default to `dry-run` for new or changed workflows.
- Require explicit confirmation for risky actions.

## Shared architecture

- `tasks/*.yaml` define task intent and parameters.
- `src/runtime/executor.ts` enforces policy and executes handlers.
- `src/tasks/*` contains task-specific integrations.
- `artifacts/` (optional) stores execution logs/output snapshots.

## Quality bar

- Add tests for every new task handler.
- Validate task schemas before execution.
- Keep handlers idempotent when possible.
