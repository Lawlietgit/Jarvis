CREATE TABLE IF NOT EXISTS pm_properties (
  property_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  management_mode TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pm_lease_documents (
  lease_id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL,
  analyzed_at TIMESTAMPTZ,
  lease_start DATE,
  lease_end DATE,
  monthly_rent INTEGER,
  security_deposit INTEGER,
  extraction_confidence DOUBLE PRECISION,
  review_status TEXT NOT NULL DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS pm_rent_entries (
  rent_entry_id BIGSERIAL PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  month_key TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  UNIQUE(property_id, month_key)
);

CREATE TABLE IF NOT EXISTS pm_extension_drafts (
  draft_id BIGSERIAL PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES pm_properties(property_id),
  status TEXT NOT NULL,
  target_term_months INTEGER,
  recommended_monthly_rent INTEGER,
  rationale TEXT NOT NULL,
  draft_storage_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pm_document_inbox (
  document_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL,
  review_status TEXT NOT NULL,
  suggested_property_id TEXT REFERENCES pm_properties(property_id),
  extracted_summary TEXT NOT NULL
);
