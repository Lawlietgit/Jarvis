# GCP deployment scaffold

This repo is designed to start locally and move to a small GCP serverless footprint later.

## Recommended services

- Cloud Run service: review UI and webhook/API surface
- Cloud Run Jobs: backfills and scheduled mailbox scans
- Cloud Scheduler: daily and hourly triggers
- Secret Manager: API keys and OAuth secrets
- Cloud Storage: approved documents and synced lease files
- Cloud SQL Postgres: production workflow state

## Suggested environments

- Local development: SQLite + fixture datasets
- Production: Postgres using `database/postgres/001_leaseops.sql`

## First deployment pieces to add later

1. Dockerfile for the web service
2. Cloud Run Job entrypoint for discovery runs
3. Secret Manager wiring
4. Postgres connection layer
5. OAuth credentials for Gmail and DocuSign
