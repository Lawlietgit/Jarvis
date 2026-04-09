CREATE TABLE IF NOT EXISTS automation_runs (
  run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow TEXT NOT NULL,
  mode TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  stats_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approved_lease_documents (
  approved_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  source TEXT NOT NULL,
  source_record_id TEXT,
  imported_at TEXT NOT NULL,
  lease_end TEXT,
  monthly_rent INTEGER,
  UNIQUE(property_id, folder_path)
);

CREATE TABLE IF NOT EXISTS lease_candidate_documents (
  candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  title TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  lease_end TEXT,
  monthly_rent INTEGER,
  confidence REAL NOT NULL,
  reason TEXT NOT NULL,
  suggested_import_path TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  last_run_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source, source_record_id),
  FOREIGN KEY(last_run_id) REFERENCES automation_runs(run_id)
);

CREATE TABLE IF NOT EXISTS approval_actions (
  approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  decision TEXT NOT NULL,
  actor_email TEXT,
  note TEXT,
  decided_at TEXT NOT NULL,
  FOREIGN KEY(candidate_id) REFERENCES lease_candidate_documents(candidate_id)
);
