import type { ExecutionContext, TaskDefinition, TaskResult } from '../types.js';
import { getTaskHandler } from './registry.js';

export async function executeTask(
  task: TaskDefinition,
  context: ExecutionContext
): Promise<TaskResult> {
  if (task.policy?.require_confirmation && !context.dryRun) {
    throw new Error(
      `Task ${task.task_id} requires confirmation; run in dry-run or add approval flow.`
    );
  }

  const handler = getTaskHandler(task.kind);
  return handler(task, context);
}
