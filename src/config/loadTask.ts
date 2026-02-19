import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import type { TaskDefinition, TaskKind } from '../types.js';

const supportedKinds: Set<TaskKind> = new Set([
  'download_to_sheet',
  'email_and_reminder'
]);

export function parseTaskDocument(raw: string): TaskDefinition {
  const parsed = yaml.load(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Task file must contain a YAML object.');
  }

  const candidate = parsed as Partial<TaskDefinition>;

  if (!candidate.task_id || typeof candidate.task_id !== 'string') {
    throw new Error('Task requires string field: task_id');
  }

  if (!candidate.kind || typeof candidate.kind !== 'string') {
    throw new Error('Task requires string field: kind');
  }

  if (!supportedKinds.has(candidate.kind as TaskKind)) {
    throw new Error(`Unsupported task kind: ${candidate.kind}`);
  }

  if (!candidate.account || typeof candidate.account !== 'string') {
    throw new Error('Task requires string field: account');
  }

  if (!candidate.params || typeof candidate.params !== 'object') {
    throw new Error('Task requires object field: params');
  }

  return {
    task_id: candidate.task_id,
    kind: candidate.kind as TaskKind,
    account: candidate.account,
    params: candidate.params as Record<string, string>,
    policy: candidate.policy
  };
}

export async function loadTaskFromFile(path: string): Promise<TaskDefinition> {
  const content = await readFile(path, 'utf8');
  return parseTaskDocument(content);
}
