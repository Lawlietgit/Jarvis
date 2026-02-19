import { describe, expect, it } from 'vitest';
import { executeTask } from '../src/runtime/executor.js';
import type { TaskDefinition } from '../src/types.js';

describe('executeTask', () => {
  const baseTask: TaskDefinition = {
    task_id: 'task-1',
    kind: 'email_and_reminder',
    account: 'google_main',
    params: {
      to: 'me@example.com',
      remind_at: '2026-02-20T09:00:00-08:00'
    },
    policy: {
      require_confirmation: true
    }
  };

  it('blocks confirmed tasks in non-dry-run mode', async () => {
    await expect(
      executeTask(baseTask, { dryRun: false, now: new Date('2026-02-19T00:00:00Z') })
    ).rejects.toThrow('requires confirmation');
  });

  it('simulates task in dry-run mode', async () => {
    const result = await executeTask(baseTask, {
      dryRun: true,
      now: new Date('2026-02-19T00:00:00Z')
    });

    expect(result.status).toBe('simulated');
    expect(result.kind).toBe('email_and_reminder');
  });
});
