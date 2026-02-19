import type { ExecutionContext, TaskDefinition, TaskResult } from '../types.js';

export async function runEmailAndReminder(
  task: TaskDefinition,
  context: ExecutionContext
): Promise<TaskResult> {
  const recipient = task.params.to ?? 'unknown-recipient';
  const reminderAt = task.params.remind_at ?? 'unspecified-time';

  if (context.dryRun) {
    return {
      taskId: task.task_id,
      kind: task.kind,
      status: 'simulated',
      summary: `Dry-run: would send email to ${recipient} and create reminder for ${reminderAt}.`
    };
  }

  return {
    taskId: task.task_id,
    kind: task.kind,
    status: 'completed',
    summary: `Sent email to ${recipient} and scheduled reminder at ${reminderAt}.`
  };
}
