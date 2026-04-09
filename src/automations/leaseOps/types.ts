export type ManagementMode = 'self_managed' | 'third_party';

export interface PropertyRecord {
  property_id: string;
  address: string;
  tenant_name: string;
  tenant_email?: string;
  management_mode: ManagementMode;
  manager_name?: string;
  manager_email?: string;
  current_lease_end?: string;
  current_rent?: number;
  notice_days: number;
}

export type EmailCategory =
  | 'lease_attachment'
  | 'renewal_discussion'
  | 'manager_update'
  | 'notice';

export interface EmailLeaseFacts {
  lease_end?: string;
  monthly_rent?: number;
  signed_at?: string;
}

export interface EmailEvent {
  message_id: string;
  received_at: string;
  from: string;
  subject: string;
  property_id?: string;
  tenant_name?: string;
  category: EmailCategory;
  summary: string;
  extracted_lease?: EmailLeaseFacts;
}

export type EnvelopeStatus = 'draft' | 'sent' | 'completed';

export interface DocusignEnvelope {
  envelope_id: string;
  property_id?: string;
  tenant_name?: string;
  title: string;
  status: EnvelopeStatus;
  document_type: 'lease' | 'lease_extension';
  updated_at: string;
  completed_at?: string;
  lease_end?: string;
  monthly_rent?: number;
}

export interface LeaseOpsDataset {
  properties: PropertyRecord[];
  emails: EmailEvent[];
  envelopes: DocusignEnvelope[];
  approved_documents: ApprovedLeaseDocument[];
}

export type LeaseAuditStatus =
  | 'up_to_date'
  | 'renewal_in_progress'
  | 'expiring_soon'
  | 'tracked_by_manager'
  | 'awaiting_manager_update'
  | 'missing_lease'
  | 'expired';

export interface DraftEmail {
  to: string;
  subject: string;
  body: string;
}

export interface LeaseAuditItem {
  propertyId: string;
  address: string;
  tenantName: string;
  managementMode: ManagementMode;
  effectiveLeaseEnd?: string;
  effectiveRent?: number;
  daysUntilExpiration?: number;
  status: LeaseAuditStatus;
  latestSource: 'registry' | 'email' | 'docusign' | 'none';
  registryNeedsUpdate: boolean;
  recommendedAction: string;
  evidence: string[];
  draftEmail?: DraftEmail;
}

export interface LeaseAuditReport {
  generatedAt: string;
  overview: {
    totalProperties: number;
    statusCounts: Record<LeaseAuditStatus, number>;
    needingAttention: number;
  };
  items: LeaseAuditItem[];
}

export interface ApprovedLeaseDocument {
  property_id: string;
  file_name: string;
  folder_path: string;
  source: 'folder' | 'manual_import';
  source_record_id?: string;
  imported_at: string;
  lease_end?: string;
  monthly_rent?: number;
}

export interface SignedLeaseSnapshot {
  source: 'email' | 'docusign';
  sourceRecordId: string;
  timestamp: string;
  leaseEnd?: string;
  monthlyRent?: number;
  title: string;
  confidence: number;
}

export type ReviewCandidateStatus =
  | 'pending_review'
  | 'approved_for_import'
  | 'ignored'
  | 'covered_by_existing_lease';

export interface ReviewCandidate {
  propertyId: string;
  address: string;
  tenantName: string;
  source: 'email' | 'docusign';
  sourceRecordId: string;
  title: string;
  observedAt: string;
  leaseEnd?: string;
  monthlyRent?: number;
  confidence: number;
  reason: string;
  suggestedImportPath: string;
  evidence: string[];
  status: ReviewCandidateStatus;
}

export interface LeaseCandidateDiscoveryReport {
  generatedAt: string;
  overview: {
    approvedDocuments: number;
    pendingCandidates: number;
    skippedCovered: number;
  };
  pendingCandidates: ReviewCandidate[];
}

export interface LeaseOpsRunRecord {
  runId?: number;
  workflow: 'lease_candidate_discovery';
  mode: 'backfill' | 'incremental';
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  statsJson: string;
}
