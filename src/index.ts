import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPropertyManagerWorkspace } from './apps/propertyManager/loadWorkspace.js';
import { renderPropertyManagerDashboard } from './apps/propertyManager/renderDashboard.js';
import { summarizePropertyManagerWorkspace } from './apps/propertyManager/summarizeWorkspace.js';
import { auditPortfolio } from './automations/leaseOps/auditPortfolio.js';
import { discoverCandidates } from './automations/leaseOps/discoverCandidates.js';
import { loadLeaseOpsDataset } from './automations/leaseOps/loadLeaseOpsDataset.js';
import { renderCandidateReviewConsole, renderCandidateReviewHtml } from './automations/leaseOps/renderCandidateReview.js';
import { renderLeaseAuditConsole, renderLeaseAuditHtml } from './automations/leaseOps/renderLeaseAudit.js';
import { loadRuntimeConfig } from './platform/config/loadRuntimeConfig.js';
import { LeaseOpsSqliteStore } from './platform/persistence/leaseOpsSqliteStore.js';

interface LeaseAuditArgs {
  command: 'lease-audit';
  datasetPath: string;
  json: boolean;
  writeReport: boolean;
}

interface LeaseDiscoverArgs {
  command: 'lease-discover';
  datasetPath: string;
  dbPath: string;
  json: boolean;
  writeReport: boolean;
}

interface LeaseReviewArgs {
  command: 'lease-review';
  dbPath: string;
  json: boolean;
  writeReport: boolean;
}

interface PropertyDashboardArgs {
  command: 'property-dashboard';
  datasetPath: string;
  json: boolean;
  writeReport: boolean;
}

type CliArgs = LeaseAuditArgs | LeaseDiscoverArgs | LeaseReviewArgs | PropertyDashboardArgs;

function parseArgs(argv: string[]): CliArgs {
  const [command, datasetPath, ...flags] = argv;

  if (command === 'lease-audit' && datasetPath) {
    return {
      command: 'lease-audit',
      datasetPath,
      json: flags.includes('--json'),
      writeReport: flags.includes('--write-report')
    };
  }

  if (command === 'lease-discover' && datasetPath) {
    return {
      command: 'lease-discover',
      datasetPath,
      dbPath: readFlagValue(flags, '--db') ?? 'data/runtime/jarvis.sqlite',
      json: flags.includes('--json'),
      writeReport: flags.includes('--write-report')
    };
  }

  if (command === 'lease-review') {
    return {
      command: 'lease-review',
      dbPath: readFlagValue([datasetPath, ...flags], '--db') ?? 'data/runtime/jarvis.sqlite',
      json: flags.includes('--json') || datasetPath === '--json',
      writeReport: flags.includes('--write-report') || datasetPath === '--write-report'
    };
  }

  if (command === 'property-dashboard' && datasetPath) {
    return {
      command: 'property-dashboard',
      datasetPath,
      json: flags.includes('--json'),
      writeReport: flags.includes('--write-report')
    };
  }

  throw new Error(
    'Usage: node dist/src/index.js <lease-audit|lease-discover|lease-review|property-dashboard> <dataset-dir?> [--db path] [--json] [--write-report]'
  );
}

function readFlagValue(flags: string[], flagName: string): string | undefined {
  const flagIndex = flags.indexOf(flagName);
  if (flagIndex === -1) {
    return undefined;
  }

  return flags[flagIndex + 1];
}

async function maybeWriteReport(fileName: string, html: string): Promise<string> {
  const outputDir = resolve('artifacts');
  const outputPath = resolve(outputDir, fileName);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, html, 'utf8');
  return outputPath;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const now = new Date();
  const runtimeConfig = loadRuntimeConfig();

  if (args.command === 'lease-audit') {
    const dataset = await loadLeaseOpsDataset(resolve(args.datasetPath));
    const report = auditPortfolio(dataset, now);

    if (args.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(renderLeaseAuditConsole(report));
    }

    if (args.writeReport) {
      const outputPath = await maybeWriteReport(
        'lease-audit-report.html',
        renderLeaseAuditHtml(report)
      );
      console.log(`\nHTML report: ${outputPath}`);
    }

    return;
  }

  if (args.command === 'property-dashboard') {
    const workspace = await loadPropertyManagerWorkspace(resolve(args.datasetPath));
    const summary = summarizePropertyManagerWorkspace(workspace, now);

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            generatedAt: workspace.generatedAt,
            storageRoot: workspace.storageRoot,
            summary,
            properties: workspace.properties,
            documentInbox: workspace.documentInbox,
            tasks: workspace.tasks
          },
          null,
          2
        )
      );
    } else {
      console.log(
        [
          `Property dashboard generated at ${workspace.generatedAt}`,
          `Portfolio: ${workspace.portfolioName}`,
          `Properties: ${summary.totalProperties} | Expiring <=60d: ${summary.expiringWithin60Days} | Partial/unpaid: ${summary.partialOrUnpaid}`,
          `Inbox docs: ${summary.inboxDocuments} | Drafts ready: ${summary.extensionDraftsReady}`,
          `Storage root: ${workspace.storageRoot}`
        ].join('\n')
      );
    }

    if (args.writeReport) {
      const outputPath = await maybeWriteReport(
        'property-manager-dashboard.html',
        renderPropertyManagerDashboard(workspace, now)
      );
      console.log(`\nHTML report: ${outputPath}`);
    }

    return;
  }

  if (args.command === 'lease-discover') {
    const dataset = await loadLeaseOpsDataset(resolve(args.datasetPath));
    const discoveryReport = discoverCandidates(dataset, now);
    const store = new LeaseOpsSqliteStore(resolve(args.dbPath));
    const runId = store.createRun({
      workflow: 'lease_candidate_discovery',
      mode: 'backfill',
      startedAt: now.toISOString(),
      status: 'running',
      statsJson: JSON.stringify({ syncFolder: runtimeConfig.leaseOps.syncFolder })
    });

    try {
      store.syncApprovedDocuments(dataset.approved_documents);
      store.upsertCandidates(runId, discoveryReport.pendingCandidates, now.toISOString());
      store.completeRun(runId, 'completed', JSON.stringify(discoveryReport.overview), new Date().toISOString());
    } finally {
      store.close();
    }

    if (args.json) {
      console.log(JSON.stringify(discoveryReport, null, 2));
    } else {
      console.log(renderCandidateReviewConsole(discoveryReport));
      console.log(`\nSQLite queue: ${resolve(args.dbPath)}`);
      console.log(`Sync folder: ${resolve(runtimeConfig.leaseOps.syncFolder)}`);
    }

    if (args.writeReport) {
      const outputPath = await maybeWriteReport(
        'lease-candidate-review.html',
        renderCandidateReviewHtml(discoveryReport)
      );
      console.log(`\nHTML report: ${outputPath}`);
    }

    return;
  }

  const store = new LeaseOpsSqliteStore(resolve(args.dbPath));
  const pendingCandidates = store.listPendingCandidates();
  store.close();

  const reviewReport = {
    generatedAt: now.toISOString(),
    overview: {
      approvedDocuments: 0,
      pendingCandidates: pendingCandidates.length,
      skippedCovered: 0
    },
    pendingCandidates
  };

  if (args.json) {
    console.log(JSON.stringify(reviewReport, null, 2));
  } else {
    console.log(renderCandidateReviewConsole(reviewReport));
  }

  if (args.writeReport) {
    const outputPath = await maybeWriteReport(
      'lease-candidate-review.html',
      renderCandidateReviewHtml(reviewReport)
    );
    console.log(`\nHTML report: ${outputPath}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
