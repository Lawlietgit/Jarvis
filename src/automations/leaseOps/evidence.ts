import type {
  ApprovedLeaseDocument,
  DocusignEnvelope,
  EmailEvent,
  PropertyRecord,
  SignedLeaseSnapshot
} from './types.js';

function normalizeText(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase();
}

export function compareTimestampsDesc(left: string, right: string): number {
  return new Date(right).getTime() - new Date(left).getTime();
}

export function matchesProperty(
  property: PropertyRecord,
  candidate: { property_id?: string; tenant_name?: string }
): boolean {
  if (candidate.property_id) {
    return candidate.property_id === property.property_id;
  }

  return normalizeText(candidate.tenant_name) === normalizeText(property.tenant_name);
}

export function getMatchingEmails(property: PropertyRecord, emails: EmailEvent[]): EmailEvent[] {
  return emails
    .filter((email) => matchesProperty(property, email))
    .sort((left, right) => compareTimestampsDesc(left.received_at, right.received_at));
}

export function getMatchingEnvelopes(
  property: PropertyRecord,
  envelopes: DocusignEnvelope[]
): DocusignEnvelope[] {
  return envelopes
    .filter((envelope) => matchesProperty(property, envelope))
    .sort((left, right) => compareTimestampsDesc(left.updated_at, right.updated_at));
}

export function getLatestSignedLease(
  emails: EmailEvent[],
  envelopes: DocusignEnvelope[]
): SignedLeaseSnapshot | undefined {
  const emailCandidates: SignedLeaseSnapshot[] = emails
    .filter((email) => email.category === 'lease_attachment' && email.extracted_lease?.lease_end)
    .map((email) => ({
      source: 'email',
      sourceRecordId: email.message_id,
      timestamp: email.extracted_lease?.signed_at ?? email.received_at,
      leaseEnd: email.extracted_lease?.lease_end,
      monthlyRent: email.extracted_lease?.monthly_rent,
      title: email.subject,
      confidence: 0.83
    }));

  const envelopeCandidates: SignedLeaseSnapshot[] = envelopes
    .filter((envelope) => envelope.status === 'completed' && envelope.lease_end)
    .map((envelope) => ({
      source: 'docusign',
      sourceRecordId: envelope.envelope_id,
      timestamp: envelope.completed_at ?? envelope.updated_at,
      leaseEnd: envelope.lease_end,
      monthlyRent: envelope.monthly_rent,
      title: envelope.title,
      confidence: 0.97
    }));

  return [...envelopeCandidates, ...emailCandidates].sort((left, right) => {
    const timeOrder = compareTimestampsDesc(left.timestamp, right.timestamp);

    if (timeOrder !== 0) {
      return timeOrder;
    }

    if (left.source === right.source) {
      return 0;
    }

    return left.source === 'docusign' ? -1 : 1;
  })[0];
}

export function getLatestConversation(emails: EmailEvent[]): EmailEvent | undefined {
  return emails.find(
    (email) => email.category === 'renewal_discussion' || email.category === 'manager_update'
  );
}

export function getOpenEnvelope(envelopes: DocusignEnvelope[]): DocusignEnvelope | undefined {
  return envelopes.find((envelope) => envelope.status === 'draft' || envelope.status === 'sent');
}

export function getLatestApprovedDocument(
  property: PropertyRecord,
  approvedDocuments: ApprovedLeaseDocument[]
): ApprovedLeaseDocument | undefined {
  return approvedDocuments
    .filter((document) => document.property_id === property.property_id)
    .sort((left, right) => {
      if (left.lease_end && right.lease_end) {
        return compareTimestampsDesc(left.lease_end, right.lease_end);
      }

      return compareTimestampsDesc(left.imported_at, right.imported_at);
    })[0];
}

export function daysUntil(date: string | undefined, now: Date): number | undefined {
  if (!date) {
    return undefined;
  }

  const millisPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(date).getTime() - now.getTime()) / millisPerDay);
}
