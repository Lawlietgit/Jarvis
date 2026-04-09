import { describe, expect, it } from 'vitest';
import { loadLeaseOpsDataset } from '../src/automations/leaseOps/loadLeaseOpsDataset.js';

describe('loadLeaseOpsDataset', () => {
  it('loads the demo dataset', async () => {
    const dataset = await loadLeaseOpsDataset('data/lease-ops/demo');

    expect(dataset.properties).toHaveLength(4);
    expect(dataset.emails.length).toBeGreaterThan(0);
    expect(dataset.envelopes.length).toBeGreaterThan(0);
    expect(dataset.approved_documents).toHaveLength(3);
  });
});
