import type { TaskHandler, TaskKind } from '../types.js';
import { runDownloadToSheet } from '../tasks/downloadToSheet.js';
import { runEmailAndReminder } from '../tasks/emailAndReminder.js';

const handlers: Record<TaskKind, TaskHandler> = {
  download_to_sheet: runDownloadToSheet,
  email_and_reminder: runEmailAndReminder
};

export function getTaskHandler(kind: TaskKind): TaskHandler {
  return handlers[kind];
}
