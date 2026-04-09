import type {
  DocusignEnvelope,
  DraftEmail,
  EmailEvent,
  LeaseAuditItem,
  LeaseAuditReport,
  LeaseAuditStatus,
  LeaseOpsDataset,
  PropertyRecord,
  SignedLeaseSnapshot
} from './types.js';
import {
  daysUntil,
  getLatestConversation,
  getLatestSignedLease,
  getMatchingEmails,
  getMatchingEnvelopes,
  getOpenEnvelope
} from './evidence.js';

const statusPriority: Record<LeaseAuditStatus, number> = {
  expired: 0,
  missing_lease: 1,
  awaiting_manager_update: 2,
  expiring_soon: 3,
  renewal_in_progress: 4,
  tracked_by_manager: 5,
  up_to_date: 6
};

const trackedStatuses = [
  'up_to_date',
  'renewal_in_progress',
  'expiring_soon',
  'tracked_by_manager',
  'awaiting_manager_update',
  'missing_lease',
  'expired'
] as const;

function buildDraftEmail(
  property: PropertyRecord,
  status: LeaseAuditStatus,
  effectiveLeaseEnd: string | undefined
): DraftEmail | undefined {
  const recipient =
    property.management_mode === 'third_party' ? property.manager_email : property.tenant_email;

  if (!recipient) {
    return undefined;
  }

  if (property.management_mode === 'third_party') {
    return {
      to: recipient,
      subject: `Lease status check for ${property.address}`,
      body:
        `Hi ${property.manager_name ?? 'team'},\n\n` +
        `Please confirm the latest lease status for ${property.address} occupied by ${property.tenant_name}. ` +
        `Our current tracked lease end is ${effectiveLeaseEnd ?? 'missing'}.\n\n` +
        `I need the latest signed lease date, current rent, and whether a renewal package is already in flight.\n\n` +
        `Thanks,\nJarvis`
    };
  }

  if (status === 'renewal_in_progress') {
    return {
      to: recipient,
      subject: `Following up on your lease renewal for ${property.address}`,
      body:
        `Hi ${property.tenant_name},\n\n` +
        `Following up on our recent lease renewal discussion for ${property.address}. ` +
        `Please let me know if you are ready for the extension paperwork or if you have any questions.\n\n` +
        `Thanks,\nJarvis`
    };
  }

  if (status === 'expiring_soon' || status === 'expired') {
    return {
      to: recipient,
      subject: `Lease renewal for ${property.address}`,
      body:
        `Hi ${property.tenant_name},\n\n` +
        `Your current lease for ${property.address} ends on ${effectiveLeaseEnd ?? 'an unknown date'}. ` +
        `I would like to confirm whether you want to renew and, if so, prepare the extension package.\n\n` +
        `Thanks,\nJarvis`
    };
  }

  return undefined;
}

function summarizeEvidence(
  property: PropertyRecord,
  signedLease: SignedLeaseSnapshot | undefined,
  latestConversation: EmailEvent | undefined,
  openEnvelope: DocusignEnvelope | undefined
): string[] {
  const evidence: string[] = [];

  if (signedLease) {
    evidence.push(`Latest signed lease from ${signedLease.source}: ${signedLease.title}`);
  } else if (property.current_lease_end) {
    evidence.push(`Using registry lease end ${property.current_lease_end} until newer evidence is found.`);
  } else {
    evidence.push('No signed lease evidence found in the current dataset.');
  }

  if (latestConversation) {
    evidence.push(`Recent conversation: "${latestConversation.subject}" on ${latestConversation.received_at}`);
  }

  if (openEnvelope) {
    evidence.push(`Open DocuSign envelope: "${openEnvelope.title}" (${openEnvelope.status})`);
  }

  return evidence;
}

function determineStatus(input: {
  property: PropertyRecord;
  effectiveLeaseEnd?: string;
  daysUntilExpiration?: number;
  latestConversation?: EmailEvent;
  openEnvelope?: DocusignEnvelope;
}): LeaseAuditStatus {
  const { property, effectiveLeaseEnd, daysUntilExpiration, latestConversation, openEnvelope } = input;

  if (!effectiveLeaseEnd) {
    return property.management_mode === 'third_party' ? 'awaiting_manager_update' : 'missing_lease';
  }

  if (daysUntilExpiration !== undefined && daysUntilExpiration < 0) {
    return 'expired';
  }

  if (openEnvelope || latestConversation) {
    return 'renewal_in_progress';
  }

  if (daysUntilExpiration !== undefined && daysUntilExpiration <= property.notice_days) {
    return property.management_mode === 'third_party' ? 'awaiting_manager_update' : 'expiring_soon';
  }

  if (property.management_mode === 'third_party') {
    return 'tracked_by_manager';
  }

  return 'up_to_date';
}

function determineRecommendedAction(
  status: LeaseAuditStatus,
  property: PropertyRecord,
  registryNeedsUpdate: boolean
): string {
  if (status === 'up_to_date') {
    return registryNeedsUpdate
      ? 'Update the registry with the newest signed lease term and rent.'
      : 'No immediate action required.';
  }

  if (status === 'tracked_by_manager') {
    return registryNeedsUpdate
      ? 'Update the registry, then keep monitoring without direct outreach.'
      : 'Monitor only; the property is managed externally.';
  }

  if (status === 'renewal_in_progress') {
    return property.management_mode === 'third_party'
      ? 'Follow up with the manager and keep the renewal thread moving.'
      : 'Continue the tenant renewal thread and prepare the extension package.';
  }

  if (status === 'awaiting_manager_update') {
    return 'Request the latest signed lease status and current rent from the management company.';
  }

  if (status === 'missing_lease') {
    return 'Locate the signed lease in Gmail or request the latest copy from the tenant.';
  }

  if (status === 'expired') {
    return 'Escalate immediately: confirm occupancy terms and finalize a renewal or notice path.';
  }

  return 'Start renewal outreach and prepare the extension draft before the notice window closes.';
}

function auditProperty(property: PropertyRecord, dataset: LeaseOpsDataset, now: Date): LeaseAuditItem {
  const emails = getMatchingEmails(property, dataset.emails);
  const envelopes = getMatchingEnvelopes(property, dataset.envelopes);
  const latestSignedLease = getLatestSignedLease(emails, envelopes);
  const latestConversation = getLatestConversation(emails);
  const openEnvelope = getOpenEnvelope(envelopes);

  const effectiveLeaseEnd = latestSignedLease?.leaseEnd ?? property.current_lease_end;
  const effectiveRent = latestSignedLease?.monthlyRent ?? property.current_rent;
  const registryNeedsUpdate =
    (latestSignedLease?.leaseEnd !== undefined &&
      latestSignedLease.leaseEnd !== property.current_lease_end) ||
    (latestSignedLease?.monthlyRent !== undefined &&
      latestSignedLease.monthlyRent !== property.current_rent);

  const daysUntilExpiration = daysUntil(effectiveLeaseEnd, now);
  const status = determineStatus({
    property,
    effectiveLeaseEnd,
    daysUntilExpiration,
    latestConversation,
    openEnvelope
  });

  return {
    propertyId: property.property_id,
    address: property.address,
    tenantName: property.tenant_name,
    managementMode: property.management_mode,
    effectiveLeaseEnd,
    effectiveRent,
    daysUntilExpiration,
    status,
    latestSource: latestSignedLease?.source ?? (property.current_lease_end ? 'registry' : 'none'),
    registryNeedsUpdate,
    recommendedAction: determineRecommendedAction(status, property, registryNeedsUpdate),
    evidence: summarizeEvidence(property, latestSignedLease, latestConversation, openEnvelope),
    draftEmail: buildDraftEmail(property, status, effectiveLeaseEnd)
  };
}

function buildStatusCounts(items: LeaseAuditItem[]): Record<LeaseAuditStatus, number> {
  return trackedStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: items.filter((item) => item.status === status).length
    }),
    {} as Record<LeaseAuditStatus, number>
  );
}

export function auditPortfolio(dataset: LeaseOpsDataset, now: Date): LeaseAuditReport {
  const items = dataset.properties
    .map((property) => auditProperty(property, dataset, now))
    .sort((left, right) => {
      const statusOrder = statusPriority[left.status] - statusPriority[right.status];

      if (statusOrder !== 0) {
        return statusOrder;
      }

      return left.address.localeCompare(right.address);
    });

  const attentionStatuses: LeaseAuditStatus[] = [
    'expired',
    'missing_lease',
    'awaiting_manager_update',
    'expiring_soon',
    'renewal_in_progress'
  ];

  return {
    generatedAt: now.toISOString(),
    overview: {
      totalProperties: items.length,
      statusCounts: buildStatusCounts(items),
      needingAttention: items.filter((item) => attentionStatuses.includes(item.status)).length
    },
    items
  };
}
