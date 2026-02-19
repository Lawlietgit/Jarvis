# Jarvis OpenClaw Automation Scaffold

This repository is a starter kit for automating diverse personal workflows using a shared task runtime.

## What is included

- Typed task schema with runtime validation
- Task executor with `dry-run` safety mode
- Built-in task handlers (stubs) for:
  - `download_to_sheet`
  - `email_and_reminder`
- YAML config examples for accounts and task definitions
- Vitest-based test setup

## Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run tests:
   ```bash
   npm test
   ```
3. Run a task in safe mode:
   ```bash
   npm run dev
   ```

## Project layout

- `src/index.ts`: CLI entrypoint
- `src/runtime/executor.ts`: task execution pipeline
- `src/runtime/registry.ts`: maps task kind to handler
- `src/config/loadTask.ts`: YAML loader and validator
- `src/tasks/`: task implementations (replace stubs with real integrations)
- `tasks/*.example.yaml`: task examples
- `config/accounts.example.yaml`: account and secret reference examples
- `tests/`: unit tests

## Next implementation steps

- Add actual OpenClaw tool calls in task handlers.
- Wire secret resolution to your vault/provider.
- Add approval gates for high-risk actions (send/submit).
