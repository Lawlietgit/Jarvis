CREATE TABLE IF NOT EXISTS automation_runs (
  run_id BIGSERIAL PRIMARY KEY,
  workflow TEXT NOT NULL,
  mode TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  stats_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS approved_lease_documents (
  approved_id BIGSERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  source TEXT NOT NULL,
  source_record_id TEXT,
  imported_at TIMESTAMPTZ NOT NULL,
  lease_end DATE,
  monthly_rent INTEGER,
  UNIQUE(property_id, folder_path)
);

CREATE TABLE IF NOT EXISTS lease_candidate_documents (
  candidate_id BIGSERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  title TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  lease_end DATE,
  monthly_rent INTEGER,
  confidence DOUBLE PRECISION NOT NULL,
  reason TEXT NOT NULL,
  suggested_import_path TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  last_run_id BIGINT NOT NULL REFERENCES automation_runs(run_id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(source, source_record_id)
);

CREATE TABLE IF NOT EXISTS approval_actions (
  approval_id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES lease_candidate_documents(candidate_id),
  decision TEXT NOT NULL,
  actor_email TEXT,
  note TEXT,
  decided_at TIMESTAMPTZ NOT NULL
);
