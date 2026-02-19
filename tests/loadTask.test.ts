import { describe, expect, it } from 'vitest';
import { parseTaskDocument } from '../src/config/loadTask.js';

describe('parseTaskDocument', () => {
  it('parses a valid task', () => {
    const raw = `
      task_id: sample
      kind: download_to_sheet
      account: bank_main
      params:
        source_url: https://example.test
    `;

    const task = parseTaskDocument(raw);
    expect(task.task_id).toBe('sample');
    expect(task.kind).toBe('download_to_sheet');
    expect(task.account).toBe('bank_main');
  });

  it('rejects unsupported task kinds', () => {
    const raw = `
      task_id: bad
      kind: unknown_kind
      account: bank_main
      params:
        foo: bar
    `;

    expect(() => parseTaskDocument(raw)).toThrow('Unsupported task kind');
  });
});
