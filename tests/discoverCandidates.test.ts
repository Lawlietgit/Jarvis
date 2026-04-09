import { describe, expect, it } from 'vitest';
import { discoverCandidates } from '../src/automations/leaseOps/discoverCandidates.js';
import { loadLeaseOpsDataset } from '../src/automations/leaseOps/loadLeaseOpsDataset.js';

describe('discoverCandidates', () => {
  it('only suggests lease files that are newer than the approved folder copy', async () => {
    const dataset = await loadLeaseOpsDataset('data/lease-ops/demo');
    const report = discoverCandidates(dataset, new Date('2026-03-29T12:00:00-04:00'));

    expect(report.overview.pendingCandidates).toBe(1);
    expect(report.pendingCandidates[0]?.propertyId).toBe('oak-101');
    expect(report.pendingCandidates[0]?.source).toBe('docusign');
    expect(report.pendingCandidates[0]?.suggestedImportPath).toContain('oak-101');
  });
});
