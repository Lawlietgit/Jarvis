# AGENTS

## Goal
Build small, auditable automations for personal operations. Each automation should be easy to test locally and easy to review before anything high-risk is sent.

## Repository organization

- Put reusable helpers in `src/platform/`.
- Put each workflow in its own folder under `src/automations/`.
- Put fixture datasets under `data/<workflow>/demo/`.
- Prefer static HTML or JSON review outputs before building a full web app.

## Safety rules

- Keep secrets out of git and resolve them at runtime.
- Treat legal and financial actions as approval-required.
- Never silently send emails, notices, or DocuSign envelopes from a new workflow.
- Preserve evidence links back to Gmail, DocuSign, or the source system.

## Quality bar

- Every workflow needs unit tests against realistic fixtures.
- Every workflow should produce a human-readable report.
- Shared abstractions must stay simple enough that one workflow cannot break another.
