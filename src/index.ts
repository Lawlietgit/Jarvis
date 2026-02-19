import { loadTaskFromFile } from './config/loadTask.js';
import { executeTask } from './runtime/executor.js';

function parseArgs(argv: string[]): { command: string; taskPath: string; dryRun: boolean } {
  const [command, taskPath, ...flags] = argv;

  if (!command || !taskPath) {
    throw new Error('Usage: tsx src/index.ts run <task-file> [--dry-run]');
  }

  return {
    command,
    taskPath,
    dryRun: flags.includes('--dry-run')
  };
}

async function main(): Promise<void> {
  const { command, taskPath, dryRun } = parseArgs(process.argv.slice(2));

  if (command !== 'run') {
    throw new Error(`Unsupported command: ${command}`);
  }

  const task = await loadTaskFromFile(taskPath);
  const result = await executeTask(task, { dryRun, now: new Date() });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
