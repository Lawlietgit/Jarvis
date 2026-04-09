import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import type {
  ApprovedLeaseDocument,
  LeaseOpsRunRecord,
  ReviewCandidate
} from '../../automations/leaseOps/types.js';

interface RunRow {
  run_id: number;
}

interface CandidateRow {
  payload_json: string;
}

const sqliteSchemaPath = resolve('database/sqlite/001_leaseops.sql');

export class LeaseOpsSqliteStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec(readFileSync(sqliteSchemaPath, 'utf8'));
  }

  createRun(run: LeaseOpsRunRecord): number {
    const result = this.database
      .prepare(
        `INSERT INTO automation_runs (workflow, mode, started_at, status, stats_json)
         VALUES (?, ?, ?, ?, ?)
         RETURNING run_id`
      )
      .get(run.workflow, run.mode, run.startedAt, run.status, run.statsJson) as unknown as RunRow;

    return result.run_id;
  }

  completeRun(runId: number, status: LeaseOpsRunRecord['status'], statsJson: string, completedAt: string): void {
    this.database
      .prepare(
        `UPDATE automation_runs
         SET status = ?, stats_json = ?, completed_at = ?
         WHERE run_id = ?`
      )
      .run(status, statsJson, completedAt, runId);
  }

  syncApprovedDocuments(documents: ApprovedLeaseDocument[]): void {
    const statement = this.database.prepare(
      `INSERT INTO approved_lease_documents
       (property_id, file_name, folder_path, source, source_record_id, imported_at, lease_end, monthly_rent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(property_id, folder_path) DO UPDATE SET
         source = excluded.source,
         source_record_id = excluded.source_record_id,
         imported_at = excluded.imported_at,
         lease_end = excluded.lease_end,
         monthly_rent = excluded.monthly_rent`
    );

    for (const document of documents) {
      statement.run(
        document.property_id,
        document.file_name,
        document.folder_path,
        document.source,
        document.source_record_id ?? null,
        document.imported_at,
        document.lease_end ?? null,
        document.monthly_rent ?? null
      );
    }
  }

  upsertCandidates(runId: number, candidates: ReviewCandidate[], nowIso: string): void {
    const statement = this.database.prepare(
      `INSERT INTO lease_candidate_documents
       (property_id, source, source_record_id, title, observed_at, lease_end, monthly_rent, confidence, reason, suggested_import_path, status, payload_json, last_run_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(source, source_record_id) DO UPDATE SET
         title = excluded.title,
         observed_at = excluded.observed_at,
         lease_end = excluded.lease_end,
         monthly_rent = excluded.monthly_rent,
         confidence = excluded.confidence,
         reason = excluded.reason,
         suggested_import_path = excluded.suggested_import_path,
         payload_json = excluded.payload_json,
         last_run_id = excluded.last_run_id,
         updated_at = excluded.updated_at`
    );

    for (const candidate of candidates) {
      statement.run(
        candidate.propertyId,
        candidate.source,
        candidate.sourceRecordId,
        candidate.title,
        candidate.observedAt,
        candidate.leaseEnd ?? null,
        candidate.monthlyRent ?? null,
        candidate.confidence,
        candidate.reason,
        candidate.suggestedImportPath,
        candidate.status,
        JSON.stringify(candidate),
        runId,
        nowIso,
        nowIso
      );
    }
  }

  listPendingCandidates(): ReviewCandidate[] {
    const rows = this.database
      .prepare(
        `SELECT payload_json
         FROM lease_candidate_documents
         WHERE status = 'pending_review'
         ORDER BY observed_at DESC`
      )
      .all() as unknown as CandidateRow[];

    return rows.map((row) => JSON.parse(row.payload_json) as ReviewCandidate);
  }

  close(): void {
    this.database.close();
  }
}
