import { describe, expect, it } from 'vitest';
import { auditPortfolio } from '../src/automations/leaseOps/auditPortfolio.js';
import { loadLeaseOpsDataset } from '../src/automations/leaseOps/loadLeaseOpsDataset.js';

describe('auditPortfolio', () => {
  it('classifies the demo portfolio into actionable buckets', async () => {
    const dataset = await loadLeaseOpsDataset('data/lease-ops/demo');
    const report = auditPortfolio(dataset, new Date('2026-03-29T12:00:00-04:00'));

    const byPropertyId = Object.fromEntries(report.items.map((item) => [item.propertyId, item]));

    expect(byPropertyId['oak-101'].status).toBe('up_to_date');
    expect(byPropertyId['oak-101'].registryNeedsUpdate).toBe(true);

    expect(byPropertyId['pine-204'].status).toBe('renewal_in_progress');
    expect(byPropertyId['pine-204'].draftEmail?.to).toBe('ben@example.com');

    expect(byPropertyId['cedar-12'].status).toBe('renewal_in_progress');
    expect(byPropertyId['cedar-12'].draftEmail?.to).toBe('renewals@northstarpm.example');

    expect(byPropertyId['maple-7'].status).toBe('awaiting_manager_update');
    expect(report.overview.needingAttention).toBe(3);
  });

  it('marks a property expired when the lease date is in the past and no renewal is active', async () => {
    const dataset = await loadLeaseOpsDataset('data/lease-ops/demo');
    dataset.properties.push({
      property_id: 'elm-9',
      address: '9 Elm Street',
      tenant_name: 'Jordan Reed',
      tenant_email: 'jordan@example.com',
      management_mode: 'self_managed',
      current_lease_end: '2026-02-28',
      current_rent: 1800,
      notice_days: 45
    });

    const report = auditPortfolio(dataset, new Date('2026-03-29T12:00:00-04:00'));
    const expired = report.items.find((item) => item.propertyId === 'elm-9');

    expect(expired?.status).toBe('expired');
    expect(expired?.draftEmail?.subject).toContain('Lease renewal');
  });
});
