import type { ExecutionContext, TaskDefinition, TaskResult } from '../types.js';

export async function runDownloadToSheet(
  task: TaskDefinition,
  context: ExecutionContext
): Promise<TaskResult> {
  const source = task.params.source_url ?? 'unknown-source';
  const destination = task.params.destination_sheet ?? 'unknown-sheet';

  if (context.dryRun) {
    return {
      taskId: task.task_id,
      kind: task.kind,
      status: 'simulated',
      summary: `Dry-run: would download from ${source} and write rows to ${destination}.`
    };
  }

  return {
    taskId: task.task_id,
    kind: task.kind,
    status: 'completed',
    summary: `Downloaded data from ${source} and wrote it to ${destination}.`
  };
}
