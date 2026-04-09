# Property Manager Architecture

## Purpose

`propertyManager` is the first Jarvis product surface. It should be easy to use daily, even before the rest of Jarvis exists.

## Frontend

Use one shared Jarvis shell with separate app routes:

- `/apps/property-manager`
- `/apps/job-hunter`
- `/apps/consulting`

The shell gives you one navigation model and one deployment target while still letting each product have its own data model and workflows.

For the property app specifically, the frontend needs four primary views:

1. Portfolio overview
2. Property detail with current lease and rent ledger
3. Document inbox for uploaded PDFs awaiting review
4. Extension studio for LLM-generated renewal drafts

## Backend

For the test phase, keep it local-first:

- metadata: SQLite
- uploaded files: local filesystem under `storage/property-manager/`
- generated HTML/UI: local server on `localhost`

For production later:

- metadata: Postgres
- files: GCS bucket using the same relative object keys
- app server: Cloud Run

## File storage

Use two separate storage zones:

- `storage/property-manager/inbox/`
  - raw uploads before approval and classification
- `storage/property-manager/leases/<property-id>/`
  - approved lease files tied to a property

The database should store:

- `storage_path`
- `original_file_name`
- `mime_type`
- `checksum`
- `uploaded_at`
- `approved_at`
- `source`

That keeps storage implementation swappable without changing business logic.

## Domain and email

No domain purchase is required for the local test phase.

You can keep using your personal email for outbound actions while Jarvis is still your personal system. The important separation is operational:

- use a dedicated OpenAI API key for Jarvis
- keep product data in its own database/storage layout
- avoid mixing raw uploaded business files into your personal desktop folders
