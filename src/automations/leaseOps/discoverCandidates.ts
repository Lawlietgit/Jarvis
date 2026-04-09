import type {
  LeaseCandidateDiscoveryReport,
  LeaseOpsDataset,
  PropertyRecord,
  ReviewCandidate
} from './types.js';
import {
  getLatestApprovedDocument,
  getLatestSignedLease,
  getMatchingEmails,
  getMatchingEnvelopes
} from './evidence.js';

function makeSuggestedImportPath(property: PropertyRecord, observedAt: string, source: string): string {
  const datePart = observedAt.slice(0, 10);
  return `leases/${property.property_id}/${datePart}-${source}-lease.pdf`;
}

function isCurrentOrFuture(date: string | undefined, now: Date): boolean {
  return date !== undefined && new Date(date).getTime() >= now.getTime();
}

export function discoverCandidates(
  dataset: LeaseOpsDataset,
  now: Date
): LeaseCandidateDiscoveryReport {
  const pendingCandidates: ReviewCandidate[] = [];
  let skippedCovered = 0;

  for (const property of dataset.properties) {
    const latestApproved = getLatestApprovedDocument(property, dataset.approved_documents);
    const latestSigned = getLatestSignedLease(
      getMatchingEmails(property, dataset.emails),
      getMatchingEnvelopes(property, dataset.envelopes)
    );

    if (!latestSigned) {
      continue;
    }

    const approvedLeaseEnd = latestApproved?.lease_end;
    const candidateIsCovered =
      approvedLeaseEnd !== undefined &&
      latestSigned.leaseEnd !== undefined &&
      new Date(approvedLeaseEnd).getTime() >= new Date(latestSigned.leaseEnd).getTime();

    const addressAlreadyCoveredToday =
      isCurrentOrFuture(approvedLeaseEnd, now) &&
      (!latestSigned.leaseEnd ||
        (approvedLeaseEnd !== undefined &&
          new Date(latestSigned.leaseEnd).getTime() <= new Date(approvedLeaseEnd).getTime()));

    if (candidateIsCovered || addressAlreadyCoveredToday) {
      skippedCovered += 1;
      continue;
    }

    const reason =
      latestApproved?.lease_end === undefined
        ? 'Likely signed lease found, but nothing approved for this address is in the synced folder yet.'
        : `Likely signed lease appears newer than the approved folder copy ending ${latestApproved.lease_end}.`;

    pendingCandidates.push({
      propertyId: property.property_id,
      address: property.address,
      tenantName: property.tenant_name,
      source: latestSigned.source,
      sourceRecordId: latestSigned.sourceRecordId,
      title: latestSigned.title,
      observedAt: latestSigned.timestamp,
      leaseEnd: latestSigned.leaseEnd,
      monthlyRent: latestSigned.monthlyRent,
      confidence: latestSigned.confidence,
      reason,
      suggestedImportPath: makeSuggestedImportPath(
        property,
        latestSigned.timestamp,
        latestSigned.source
      ),
      evidence: [
        `Detected from ${latestSigned.source} record ${latestSigned.sourceRecordId}.`,
        latestApproved
          ? `Latest approved folder copy: ${latestApproved.file_name} ending ${latestApproved.lease_end ?? 'unknown'}.`
          : 'No approved folder copy exists yet.'
      ],
      status: 'pending_review'
    });
  }

  return {
    generatedAt: now.toISOString(),
    overview: {
      approvedDocuments: dataset.approved_documents.length,
      pendingCandidates: pendingCandidates.length,
      skippedCovered
    },
    pendingCandidates: pendingCandidates.sort((left, right) =>
      new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime()
    )
  };
}
