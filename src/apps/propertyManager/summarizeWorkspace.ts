import type { PropertyManagerSummary, PropertyManagerWorkspace } from './types.js';

function daysUntil(date: string, now: Date): number {
  return Math.floor((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function summarizePropertyManagerWorkspace(
  workspace: PropertyManagerWorkspace,
  now: Date
): PropertyManagerSummary {
  const totalProperties = workspace.properties.length;
  const expiringWithin60Days = workspace.properties.filter(
    (property) => daysUntil(property.currentLease.leaseEnd, now) <= 60
  ).length;
  const partialOrUnpaid = workspace.properties.filter(
    (property) => property.rentLedger.status === 'partial' || property.rentLedger.status === 'unpaid'
  ).length;
  const inboxDocuments = workspace.documentInbox.filter(
    (document) => document.reviewStatus !== 'approved'
  ).length;
  const extensionDraftsReady = workspace.properties.filter(
    (property) => property.extensionPlan.status === 'review_ready'
  ).length;
  const collectedThisMonth = workspace.properties.reduce(
    (sum, property) => sum + property.rentLedger.amountPaid,
    0
  );
  const dueThisMonth = workspace.properties.reduce(
    (sum, property) => sum + property.rentLedger.amountDue,
    0
  );

  return {
    totalProperties,
    expiringWithin60Days,
    partialOrUnpaid,
    inboxDocuments,
    extensionDraftsReady,
    collectedThisMonth,
    dueThisMonth
  };
}
