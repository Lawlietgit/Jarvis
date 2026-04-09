export type RentPaymentStatus = 'full' | 'partial' | 'unpaid';
export type LeaseExtensionStatus = 'not_needed' | 'review_ready' | 'awaiting_decision' | 'sent';
export type DocumentReviewStatus = 'approved' | 'inbox' | 'needs_review';

export interface PropertyManagerLease {
  leaseId: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  analyzedAt: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  securityDeposit?: number;
  extractionConfidence: number;
}

export interface PropertyRentLedger {
  currentMonth: string;
  amountDue: number;
  amountPaid: number;
  status: RentPaymentStatus;
  lastPaymentAt?: string;
  note?: string;
}

export interface LeaseExtensionPlan {
  status: LeaseExtensionStatus;
  targetTermMonths?: number;
  recommendedMonthlyRent?: number;
  rationale: string;
  draftStoragePath?: string;
}

export interface PropertyWorkspaceRecord {
  propertyId: string;
  label: string;
  address: string;
  tenantName: string;
  tenantEmail?: string;
  managementMode: 'self_managed' | 'third_party';
  currentLease: PropertyManagerLease;
  rentLedger: PropertyRentLedger;
  extensionPlan: LeaseExtensionPlan;
}

export interface PropertyDocumentInboxItem {
  documentId: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  reviewStatus: DocumentReviewStatus;
  suggestedPropertyId?: string;
  extractedSummary: string;
}

export interface PropertyManagerTask {
  taskId: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'blocked' | 'done';
}

export interface PropertyManagerWorkspace {
  portfolioName: string;
  operatorName: string;
  storageRoot: string;
  generatedAt: string;
  properties: PropertyWorkspaceRecord[];
  documentInbox: PropertyDocumentInboxItem[];
  tasks: PropertyManagerTask[];
}

export interface PropertyManagerSummary {
  totalProperties: number;
  expiringWithin60Days: number;
  partialOrUnpaid: number;
  inboxDocuments: number;
  extensionDraftsReady: number;
  collectedThisMonth: number;
  dueThisMonth: number;
}
