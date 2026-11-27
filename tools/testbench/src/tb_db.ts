/* The Testbench database (D-0170): this computer's index of test runs, in `.mdse/testbench.db` (never committed).
 * Rebuilt from the report notes; only `drafts` (runs being worked on and not yet saved) is kept. Evidence files are
 * indexed here by path and hash, never stored. */
import { MdseDb } from "../../core/src/mdse_db.ts";
import type { SqlStatic, DbSchema } from "../../core/src/mdse_db.ts";
import type { RunRecord } from "./tb_run.ts";
import * as R from "./tb_run.ts";

export const TB_DB_PATH = ".mdse/testbench.db";
export const TB_DB_SCHEMA: DbSchema = {
  name: "mdse-testbench", version: 1,
  tables: [
    { name: "runs", columns: ["guid TEXT PRIMARY KEY", "run_id TEXT", "case_path TEXT", "case_title TEXT", "case_id TEXT", "method TEXT", "status TEXT", "result TEXT",
      "unit_serial TEXT", "hw TEXT", "fw TEXT", "test_date TEXT", "tested_by TEXT", "report_path TEXT", "created TEXT", "submitted_at TEXT", "steps INTEGER",
      "steps_pass INTEGER", "steps_fail INTEGER", "attachments INTEGER"] },
    { name: "run_requirements", columns: ["guid TEXT", "req_path TEXT", "req_id TEXT"], constraints: ["PRIMARY KEY (guid, req_path)"] },
    { name: "steps", columns: ["guid TEXT", "n INTEGER", "action TEXT", "expected TEXT", "measured TEXT", "unit TEXT", "result TEXT"], constraints: ["PRIMARY KEY (guid, n)"] },
    { name: "attachments", columns: ["guid TEXT", "file TEXT", "step INTEGER", "kind TEXT", "caption TEXT", "sha256 TEXT", "bytes INTEGER", "source TEXT", "added TEXT"], constraints: ["PRIMARY KEY (guid, file)"] },
    { name: "equipment", columns: ["guid TEXT", "name TEXT", "id TEXT", "cal_due TEXT"] },
    { name: "drafts", kept: true, columns: ["guid TEXT PRIMARY KEY", "run_id TEXT", "case_title TEXT", "saved_at TEXT", "json TEXT"] },
  ],
  indexes: ["CREATE INDEX IF NOT EXISTS runs_case ON runs (case_path)", "CREATE INDEX IF NOT EXISTS runs_unit ON runs (unit_serial)", "CREATE INDEX IF NOT EXISTS att_sha ON attachments (sha256)"],
};
export function openTestbenchDb(SQL: SqlStatic, bytes?: Uint8Array | null): MdseDb { return new MdseDb(SQL, TB_DB_SCHEMA, bytes); }

/** Rebuild the derived tables from the reports. Skipped (nothing written) when no report changed since this
 * database's last rebuild. */
const BUILT = new WeakMap<MdseDb, number>();
export function indexRuns(db: MdseDb, files: Map<string, string>, force = false): number {
  const runs = R.listRuns(files), v = R.runListVersion();
  if (!force && BUILT.get(db) === v) return runs.length;
  BUILT.set(db, v);
  db.tx(() => {
    db.clearDerived();
    for (const { path, run } of runs) indexRun(db, run, path);
  });
  return runs.length;
}
function indexRun(db: MdseDb, run: RunRecord, path: string): void {
  const c = R.stepCounts(run), sub = [...run.events].reverse().find((e) => e.ev === "submitted")?.at ?? "";
  db.put("runs", { guid: run.guid, run_id: run.runId, case_path: run.casePath, case_title: run.caseTitle, case_id: run.caseId, method: run.method, status: run.status, result: run.overall,
    unit_serial: run.unit.serial, hw: run.unit.hw, fw: run.unit.fw, test_date: run.date, tested_by: run.testedBy, report_path: path, created: run.created, submitted_at: sub,
    steps: run.steps.length, steps_pass: c.pass, steps_fail: c.fail, attachments: run.attachments.length });
  for (const q of run.requirements) db.put("run_requirements", { guid: run.guid, req_path: q.path, req_id: q.id });
  for (const s of run.steps) db.put("steps", { guid: run.guid, n: s.n, action: s.action, expected: s.expected, measured: s.measured, unit: s.unit, result: s.result });
  for (const a of run.attachments) db.put("attachments", { guid: run.guid, file: a.file, step: a.step, kind: a.kind, caption: a.caption, sha256: a.sha256, bytes: a.bytes, source: a.source, added: a.added });
  for (const e of run.equipment) db.put("equipment", { guid: run.guid, name: e.name, id: e.id, cal_due: e.calDue });
}

export function saveRunDraft(db: MdseDb, run: RunRecord, now = new Date()): void {
  db.put("drafts", { guid: run.guid, run_id: run.runId, case_title: run.caseTitle, saved_at: now.toISOString(), json: JSON.stringify(run) });
}
export function loadRunDraft(db: MdseDb, guid: string): { run: RunRecord; savedAt: string } | null {
  const r = db.one<{ json: string; saved_at: string }>("SELECT json, saved_at FROM drafts WHERE guid = ?", [guid]);
  if (!r) return null; try { return { run: JSON.parse(r.json) as RunRecord, savedAt: r.saved_at }; } catch { return null; }
}
export function removeRunDraft(db: MdseDb, guid: string): void { db.run("DELETE FROM drafts WHERE guid = ?", [guid]); }
export function draftRuns(db: MdseDb): Array<{ guid: string; run_id: string; case_title: string; saved_at: string; saved: number }> {
  return db.all("SELECT d.guid, d.run_id, d.case_title, d.saved_at, CASE WHEN r.guid IS NULL THEN 0 ELSE 1 END AS saved FROM drafts d LEFT JOIN runs r ON r.guid = d.guid ORDER BY d.saved_at DESC");
}

/* ---- queries for the Plan view and for searching evidence ---- */
export interface CaseStats { case_path: string; runs: number; last_result: string; last_date: string; last_run: string; last_report: string }
export function caseStats(db: MdseDb): Map<string, CaseStats> {
  // one pass: the newest run of each case, with the case's run count (window functions, SQLite 3.25+)
  const rows = db.all<CaseStats>(`SELECT case_path, runs, result AS last_result, test_date AS last_date, run_id AS last_run, report_path AS last_report
    FROM (SELECT case_path, result, test_date, run_id, report_path, count(*) OVER (PARTITION BY case_path) AS runs,
                 row_number() OVER (PARTITION BY case_path ORDER BY created DESC) AS n FROM runs) WHERE n = 1`);
  return new Map(rows.map((r) => [r.case_path, r]));
}
export function runsOfUnit(db: MdseDb, serial: string): Array<{ run_id: string; case_title: string; result: string; test_date: string; report_path: string }> {
  return db.all("SELECT run_id, case_title, result, test_date, report_path FROM runs WHERE unit_serial = ? ORDER BY created DESC", [serial]);
}
export function findEvidence(db: MdseDb, text: string, kind = ""): Array<{ file: string; caption: string; kind: string; run_id: string; step: number; report_path: string }> {
  const q = `%${text}%`;
  return db.all(`SELECT a.file, a.caption, a.kind, r.run_id, a.step, r.report_path FROM attachments a JOIN runs r ON r.guid = a.guid
    WHERE (a.caption LIKE ? OR a.file LIKE ? OR r.case_title LIKE ? OR r.unit_serial LIKE ?) AND (? = '' OR a.kind = ?) ORDER BY r.created DESC LIMIT 200`, [q, q, q, q, kind, kind]);
}
