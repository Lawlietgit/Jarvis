export type TaskKind = 'download_to_sheet' | 'email_and_reminder';

export interface TaskDefinition {
  task_id: string;
  kind: TaskKind;
  account: string;
  params: Record<string, string>;
  policy?: {
    require_confirmation?: boolean;
  };
}

export interface ExecutionContext {
  dryRun: boolean;
  now: Date;
}

export interface TaskResult {
  taskId: string;
  kind: TaskKind;
  status: 'simulated' | 'completed';
  summary: string;
}

export type TaskHandler = (
  task: TaskDefinition,
  context: ExecutionContext
) => Promise<TaskResult>;
