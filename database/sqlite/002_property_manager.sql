CREATE TABLE IF NOT EXISTS pm_properties (
  property_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  management_mode TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pm_lease_documents (
  lease_id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  analyzed_at TEXT,
  lease_start TEXT,
  lease_end TEXT,
  monthly_rent INTEGER,
  security_deposit INTEGER,
  extraction_confidence REAL,
  review_status TEXT NOT NULL DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS pm_rent_entries (
  rent_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  month_key TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  recorded_at TEXT NOT NULL,
  UNIQUE(property_id, month_key)
);

CREATE TABLE IF NOT EXISTS pm_extension_drafts (
  draft_id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  status TEXT NOT NULL,
  target_term_months INTEGER,
  recommended_monthly_rent INTEGER,
  rationale TEXT NOT NULL,
  draft_storage_path TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pm_document_inbox (
  document_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  review_status TEXT NOT NULL,
  suggested_property_id TEXT REFERENCES pm_properties(property_id),
  extracted_summary TEXT NOT NULL
);
