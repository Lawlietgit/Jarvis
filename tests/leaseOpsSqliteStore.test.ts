import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('LeaseOpsSqliteStore', () => {
  it('persists pending review candidates', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'jarvis-leaseops-'));
    tempDirs.push(tempDir);
    const dbPath = join(tempDir, 'jarvis.sqlite');
    const script = `
      import { LeaseOpsSqliteStore } from './dist/src/platform/persistence/leaseOpsSqliteStore.js';
      const store = new LeaseOpsSqliteStore(${JSON.stringify(dbPath)});
      const runId = store.createRun({
        workflow: 'lease_candidate_discovery',
        mode: 'backfill',
        startedAt: '2026-03-29T12:00:00Z',
        status: 'running',
        statsJson: '{}'
      });
      store.upsertCandidates(
        runId,
        [{
          propertyId: 'oak-101',
          address: '101 Oak Street',
          tenantName: 'Alice Chen',
          source: 'docusign',
          sourceRecordId: 'env-1001',
          title: 'Oak Street 2026 Renewal',
          observedAt: '2026-03-20T21:15:00.000Z',
          leaseEnd: '2027-05-31',
          monthlyRent: 2525,
          confidence: 0.97,
          reason: 'Newer than approved folder copy.',
          suggestedImportPath: 'leases/oak-101/2026-03-20-docusign-lease.pdf',
          evidence: ['Detected from docusign record env-1001.'],
          status: 'pending_review'
        }],
        '2026-03-29T12:00:00Z'
      );
      console.log(JSON.stringify(store.listPendingCandidates()));
      store.close();
    `;

    const output = execFileSync('node', ['--input-type=module', '--eval', script], {
      encoding: 'utf8'
    });
    const candidates = JSON.parse(output) as Array<{ propertyId: string; sourceRecordId: string }>;

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.propertyId).toBe('oak-101');
    expect(candidates[0]?.sourceRecordId).toBe('env-1001');
  });
});
