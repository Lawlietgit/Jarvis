import { describe, expect, it } from 'vitest';
import { loadPropertyManagerWorkspace } from '../src/apps/propertyManager/loadWorkspace.js';
import { summarizePropertyManagerWorkspace } from '../src/apps/propertyManager/summarizeWorkspace.js';

describe('propertyManager workspace', () => {
  it('loads the demo workspace', async () => {
    const workspace = await loadPropertyManagerWorkspace('data/property-manager/demo/workspace.yaml');

    expect(workspace.properties).toHaveLength(3);
    expect(workspace.documentInbox).toHaveLength(2);
    expect(workspace.storageRoot).toBe('storage/property-manager');
  });

  it('summarizes expiring leases and rent issues', async () => {
    const workspace = await loadPropertyManagerWorkspace('data/property-manager/demo/workspace.yaml');
    const summary = summarizePropertyManagerWorkspace(
      workspace,
      new Date('2026-04-09T12:00:00-04:00')
    );

    expect(summary.totalProperties).toBe(3);
    expect(summary.expiringWithin60Days).toBe(1);
    expect(summary.partialOrUnpaid).toBe(2);
    expect(summary.inboxDocuments).toBe(2);
    expect(summary.extensionDraftsReady).toBe(1);
    expect(summary.collectedThisMonth).toBe(3750);
    expect(summary.dueThisMonth).toBe(7900);
  });
});
