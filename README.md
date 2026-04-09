# Jarvis Automation Workspace

This repo is organized for many automations and small products, not one giant agent. The shared rule is simple:

- keep integrations and infrastructure reusable
- model each business workflow as its own vertical slice
- give every workflow a local test dataset and a human review surface

The first implemented slice is `propertyManager`, aimed at your rental-home business. It is the first real product in the Jarvis shell, with a portfolio dashboard, lease document storage plan, rent tracking, and lease-extension drafting workspace. The earlier `leaseOps` automation still exists as a backend workflow for lease review logic.

## Why this structure

For long-term maintenance, a narrow event-driven workflow is better than a free-roaming assistant. Your lease workflow needs a system of record, deterministic audit logic, and a final human approval step before any legal communication or DocuSign send.

## Current product setup

`propertyManager` reads a demo workspace from `data/property-manager/demo/workspace.yaml` and renders:

- a portfolio dashboard with lease status, rent collections, and extension drafting state
- a document inbox showing uploaded PDFs and where they live on disk
- a shared Jarvis shell that can later host jobs and consulting tools in the same local app

PDF storage plan:

- local test phase: `storage/property-manager/inbox/` for new uploads
- approved lease files: `storage/property-manager/leases/<property-id>/...`
- metadata and paths belong in the database, so the same storage keys can later move to GCS without changing the app model

`leaseOps` still provides:

- a JSON/HTML lease audit
- a SQLite-backed review queue for likely signed lease files that are newer than the approved folder copy

## Quickstart

```bash
npm install
npm test
npm run property:dashboard
npm run web
npm run lease:audit
npm run lease:discover
npm run lease:review
```

For JSON output only:

```bash
npm run lease:audit:json
```

## Project layout

- `src/apps/`: product surfaces and shared UI shell
- `src/platform/`: shared helpers you can reuse across automations and products
- `src/automations/leaseOps/`: lease-specific backend workflow logic
- `src/server/`: local web server for the Jarvis shell
- `data/property-manager/demo/`: demo workspace for the property product
- `data/lease-ops/demo/`: realistic sample fixtures for local testing
- `database/`: SQLite and Postgres schema files for the review queue
- `docs/`: architecture notes
- `deploy/gcp/`: cloud deployment notes
- `tests/`: unit tests

## What to build next

1. Add authenticated upload and edit flows to the property dashboard.
2. Move property-manager metadata into SQLite/Postgres instead of demo YAML.
3. Attach PDF parsing and LLM extraction behind the upload inbox.
4. Add the job and consulting products into the same Jarvis shell.
