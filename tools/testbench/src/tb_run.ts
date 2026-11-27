/* Testbench runs (D-0170, TBN rules): one run of one verification case on one unit, recorded as a test report note
 * with its evidence files in the same folder. Plain logic, no DOM and no file access.
 *
 * - A run starts from a governed Verification note (the test case). Its steps come from the numbered list in the case
 *   note, or in a Procedure note it links to; the engineer can add, edit and remove steps.
 * - Evidence (photos, scope screenshots and CSV exports, DAQ files, logs) is stored as files in the run's folder,
 *   `<report folder>/<run ID>/`, named for its step, with a SHA-256 in the report. Never inside the database.
 * - The report note has no `type` or `uid`: it is a record, not a model note, so the index skips it. It links the case
 *   in its YAML so the case note's backlinks show every run. Its body is readable in Obsidian without Testbench; a
 *   fenced `mdse-run` block holds the state Testbench reads back. */
import type { ModelIndex, Note } from "../../workbench/src/index.ts";
import { incoming, outgoing } from "../../workbench/src/index.ts";
import { edUid } from "../../workbench/src/edit.ts";
import type { EditPlan } from "../../workbench/src/edit.ts";
import type { CsvSummary } from "./tb_csv.ts";

export type StepResult = "" | "Pass" | "Fail" | "N/A";
export interface RunStep { n: number; action: string; expected: string; measured: string; unit: string; result: StepResult; note: string }
export interface RunEquipment { name: string; id: string; calDue: string }
export interface RunAttachment {
  /** vault path of the file */ file: string; name: string; kind: "image" | "csv" | "file";
  /** step number, or 0 for the setup */ step: number; caption: string; sha256: string; bytes: number; added: string; by: string;
  source: "drop" | "inbox" | "phone" | "pick"; summary?: CsvSummary | null;
}
export interface RunEvent { at: string; by: string; ev: "created" | "saved" | "submitted" | "reopened" }
export interface RunRecord {
  schema: 1; runId: string; guid: string; author: string; created: string; folder: string;
  casePath: string; caseTitle: string; caseId: string; method: string; requirements: Array<{ id: string; title: string; path: string }>;
  plan: string; setup: string; unit: { serial: string; hw: string; fw: string }; date: string; testedBy: string;
  equipment: RunEquipment[]; steps: RunStep[]; attachments: RunAttachment[];
  overall: "" | "Pass" | "Fail" | "Pass with deviations" | "Incomplete"; deviations: string; issue: string; reviewedBy: string;
  status: "in progress" | "submitted"; events: RunEvent[];
}
export const OVERALL = ["", "Pass", "Fail", "Pass with deviations", "Incomplete"] as const;
export const STEP_RESULTS: StepResult[] = ["", "Pass", "Fail", "N/A"];
export const DEFAULT_REPORT_FOLDER = "Test Reports";

const tp2 = (x: number): string => String(x).padStart(2, "0");
export const isCase = (n: Note): boolean => n.type === "Verification";
/** Every verification case in the vault, with the requirements it verifies. */
export function testCases(ix: ModelIndex): Array<{ note: Note; requirements: Note[] }> {
  return [...ix.notes.values()].filter(isCase).map((note) => ({ note, requirements: verifiedRequirements(ix, note.path) }))
    .sort((a, b) => a.note.title.localeCompare(b.note.title));
}
export function verifiedRequirements(ix: ModelIndex, casePath: string): Note[] {
  const out = new Set<string>();
  for (const e of outgoing(ix, casePath)) if (e.kind === "verifies" && e.to) out.add(e.to);
  return [...out].map((p) => ix.notes.get(p)).filter((x): x is Note => !!x);
}
/** Steps written as a numbered list ("1. Apply 48 V. Expected: green LED"). Looks in the case note, then in procedures it links to. */
export function stepsFromNotes(ix: ModelIndex | null, c: Note | null): RunStep[] {
  if (!c) return [];
  const bodies = [c.body];
  if (ix) for (const e of [...outgoing(ix, c.path), ...incoming(ix, c.path)]) { const o = ix.notes.get(e.to === c.path ? e.from : e.to ?? ""); if (o && o.type === "Procedure") bodies.push(o.body); }
  for (const l of c.links) { const p = ix?.byName.get(l.target.toLowerCase()); const o = p ? ix!.notes.get(p) : undefined; if (o && o.type === "Procedure" && !bodies.includes(o.body)) bodies.push(o.body); }
  for (const b of bodies) {
    const steps: RunStep[] = [];
    for (const line of b.split(/\r?\n/)) {
      const m = /^\s*(\d+)[.)]\s+(.+?)\s*$/.exec(line); if (!m) continue;
      const [action, expected] = splitExpected(m[2]!);
      steps.push({ n: steps.length + 1, action, expected, measured: "", unit: "", result: "", note: "" });
    }
    if (steps.length) return steps;
  }
  return [];
}
function splitExpected(s: string): [string, string] {
  const m = /^(.*?)\s*(?:[—–-]+\s*)?(?:expected|expect|shall read|result)\s*[:=]\s*(.+)$/i.exec(s) ?? /^(.*?)\s*(?:->|=>|→)\s*(.+)$/.exec(s);
  return m ? [m[1]!.replace(/[\s.;,—–-]+$/, "").trim(), m[2]!.trim()] : [s.trim(), ""];
}
export const blankStep = (n: number): RunStep => ({ n, action: "", expected: "", measured: "", unit: "", result: "", note: "" });

/* ---- identity --------------------------------------------------------------------------------------------- */
/** TRP-yymm-nnnn, after the highest in these runs (the Test report prefix of D-0169). */
export function nextRunId(now: Date, runs: Array<{ runId: string }>): string {
  const stem = `TRP-${tp2(now.getFullYear() % 100)}${tp2(now.getMonth() + 1)}-`;
  const max = runs.map((r) => r.runId).filter((x) => x.startsWith(stem)).map((x) => Number(x.slice(stem.length)) || 0).reduce((a, b) => Math.max(a, b), 0);
  return stem + String(max + 1).padStart(4, "0");
}
export const runReportPath = (r: { folder: string; runId: string }): string => `${r.folder}/${r.runId}/${r.runId}.md`;
export const runDir = (r: { folder: string; runId: string }): string => `${r.folder}/${r.runId}`;

export function startRun(ix: ModelIndex | null, casePath: string, author: string, now: Date, runs: RunRecord[], folder = DEFAULT_REPORT_FOLDER, testedBy = ""): RunRecord {
  const c = ix?.notes.get(casePath) ?? null;
  const reqs = c && ix ? verifiedRequirements(ix, c.path) : [];
  const steps = stepsFromNotes(ix, c);
  const at = now.toISOString();
  return {
    schema: 1, runId: nextRunId(now, runs), guid: edUid(author, now, new Set(runs.map((r) => r.guid))), author, created: at, folder: folder.replace(/\/+$/, "") || DEFAULT_REPORT_FOLDER,
    casePath: c?.path ?? "", caseTitle: c?.title ?? "", caseId: c?.id ?? "", method: c?.subtype ?? "",
    requirements: reqs.map((q) => ({ id: q.id, title: q.title, path: q.path })), plan: "", setup: "",
    unit: { serial: "", hw: "", fw: "" }, date: `${now.getFullYear()}-${tp2(now.getMonth() + 1)}-${tp2(now.getDate())}`, testedBy,
    equipment: [], steps: steps.length ? steps : [blankStep(1), blankStep(2), blankStep(3)], attachments: [],
    overall: "", deviations: "", issue: "", reviewedBy: "", status: "in progress", events: [{ at, by: author, ev: "created" }],
  };
}

/* ---- evidence files --------------------------------------------------------------------------------------- */
const IMG = /\.(jpe?g|png|gif|webp|bmp|heic|heif|tiff?)$/i;
export const kindOf = (name: string, mime = ""): RunAttachment["kind"] => (IMG.test(name) || mime.startsWith("image/") ? "image" : /\.(csv|tsv)$/i.test(name) || mime === "text/csv" ? "csv" : "file");
const safe = (s: string): string => s.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
/** Where a captured file goes: `<run folder>/step-03-scope.png`, numbered when the name is taken. */
export function evidencePath(run: RunRecord, step: number, original: string, taken: Set<string>): string {
  const dot = original.lastIndexOf("."), ext = dot > 0 ? original.slice(dot).toLowerCase() : "", stem = safe(dot > 0 ? original.slice(0, dot) : original);
  const base = `${runDir(run)}/${step ? "step-" + tp2(step) : "setup"}-${stem}`;
  let p = base + ext, i = 2; while (taken.has(p)) p = `${base}-${i++}${ext}`;
  return p;
}
export const attachmentsFor = (run: RunRecord, step: number): RunAttachment[] => run.attachments.filter((a) => a.step === step);

/* ---- checks and submit ------------------------------------------------------------------------------------ */
export function runProblems(run: RunRecord, today = ""): string[] {
  const p: string[] = [];
  if (!run.casePath) p.push("No test case is selected.");
  if (!run.unit.serial.trim()) p.push("Unit serial number is empty.");
  if (!run.unit.hw.trim()) p.push("Hardware rev is empty.");
  if (!run.unit.fw.trim()) p.push("Firmware version is empty.");
  if (!run.date.trim()) p.push("Test date is empty.");
  if (!run.testedBy.trim()) p.push("Tested by is empty.");
  const open = run.steps.filter((s) => !s.result); if (open.length) p.push(`Step${open.length === 1 ? "" : "s"} ${open.map((s) => s.n).join(", ")} ${open.length === 1 ? "has" : "have"} no result.`);
  const failed = run.steps.filter((s) => s.result === "Fail");
  if (!run.overall) p.push("Overall result is not set.");
  else if (failed.length && run.overall === "Pass") p.push(`Overall result is Pass but step${failed.length === 1 ? "" : "s"} ${failed.map((s) => s.n).join(", ")} failed.`);
  if (run.overall === "Pass with deviations" && !run.deviations.trim()) p.push("Describe the deviations.");
  if (today) for (const e of run.equipment) if (e.calDue && e.calDue < today) p.push(`${e.name || e.id || "Equipment"}: calibration was due ${e.calDue}.`);
  return p;
}
export function stepCounts(run: RunRecord): { pass: number; fail: number; na: number; open: number } {
  const c = { pass: 0, fail: 0, na: 0, open: 0 };
  for (const s of run.steps) { if (s.result === "Pass") c.pass++; else if (s.result === "Fail") c.fail++; else if (s.result === "N/A") c.na++; else c.open++; }
  return c;
}
/** Mark the run submitted (or saved in progress). Submit refuses while problems remain. */
export function markRun(run: RunRecord, how: "saved" | "submitted", by: string, now: Date): { run: RunRecord } | { error: string } {
  if (how === "submitted") { const p = runProblems(run); if (p.length) return { error: p.join(" ") }; }
  const at = now.toISOString(), events = [...run.events];
  if (how === "submitted" && run.status === "submitted") events.push({ at, by, ev: "reopened" });
  events.push({ at, by, ev: how });
  return { run: { ...run, status: how === "submitted" ? "submitted" : run.status === "submitted" ? "submitted" : "in progress", events } };
}

/* ---- the report note -------------------------------------------------------------------------------------- */
const tq = (s: string): string => JSON.stringify(s ?? "");
const tcell = (s: string): string => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const wiki = (path: string, title: string): string => (path ? `[[${path.replace(/\.md$/i, "")}|${title || path}]]` : "");
const kb = (n: number): string => (n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");
function evidenceBlock(a: RunAttachment): string[] {
  const name = a.file.slice(a.file.lastIndexOf("/") + 1), out: string[] = [];
  if (a.kind === "image") out.push(`![[${a.file}|700]]`);
  else out.push(`[[${a.file}|${name}]] (${kb(a.bytes)})`);
  if (a.caption) out.push(`*${a.caption}*`);
  if (a.kind === "csv" && a.summary && a.summary.columns.length) {
    const s = a.summary;
    out.push("", `${s.rows} rows${s.sampleInterval ? `, sample interval ${s.sampleInterval}` : ""}${s.meta.length ? " · " + s.meta.slice(0, 4).map((m) => `${m.key}: ${m.value}`).join(" · ") : ""}`, "",
      "| Column | Min | Max | Mean |", "| --- | --- | --- | --- |", ...s.columns.slice(0, 12).map((c) => `| ${tcell(c.name)} | ${c.min} | ${c.max} | ${c.mean} |`));
  }
  out.push("");
  return out;
}
export function renderReport(run: RunRecord): string {
  const c = stepCounts(run);
  const fm = ["---", `mdseTestReport: ${run.runId}`, `guid: ${run.guid}`, `status: ${tq(run.status)}`, `result: ${tq(run.overall)}`,
    `case: ${tq(wiki(run.casePath, run.caseTitle))}`, `caseId: ${tq(run.caseId)}`, `method: ${tq(run.method)}`,
    `requirements: [${run.requirements.map((q) => tq(wiki(q.path, q.id || q.title))).join(", ")}]`, `plan: ${tq(run.plan)}`,
    `unitSerial: ${tq(run.unit.serial)}`, `hardwareRev: ${tq(run.unit.hw)}`, `firmware: ${tq(run.unit.fw)}`, `testDate: ${tq(run.date)}`, `testedBy: ${tq(run.testedBy)}`,
    `reviewedBy: ${tq(run.reviewedBy)}`, `stepsPass: ${c.pass}`, `stepsFail: ${c.fail}`, `attachments: ${run.attachments.length}`, `author: ${run.author}`, "---"];
  const b: string[] = [`# ${run.runId} — ${run.caseTitle || "Test report"}`, "",
    `**Result: ${run.overall || "not set"}** · ${c.pass} passed, ${c.fail} failed, ${c.na} not applicable${c.open ? `, ${c.open} not run` : ""} · ${run.status}`, "",
    "| Test case | Unit | Hardware | Firmware | Date | Tested by |", "| --- | --- | --- | --- | --- | --- |",
    `| ${tcell(wiki(run.casePath, run.caseTitle))} | ${tcell(run.unit.serial)} | ${tcell(run.unit.hw)} | ${tcell(run.unit.fw)} | ${tcell(run.date)} | ${tcell(run.testedBy)} |`, ""];
  if (run.requirements.length) b.push("**Verifies:** " + run.requirements.map((q) => wiki(q.path, `${q.id} ${q.title}`.trim())).join(", "), "");
  b.push("## Setup", "", run.setup || "—", "");
  if (run.equipment.length) b.push("| Equipment | ID | Calibration due |", "| --- | --- | --- |", ...run.equipment.map((e) => `| ${tcell(e.name)} | ${tcell(e.id)} | ${tcell(e.calDue)} |`), "");
  for (const a of attachmentsFor(run, 0)) b.push(...evidenceBlock(a));
  b.push("## Steps", "");
  for (const s of run.steps) {
    b.push(`### Step ${s.n} — ${s.result || "not run"}`, "", s.action || "—", "");
    const rows = [["Expected", s.expected], ["Measured", [s.measured, s.unit].filter(Boolean).join(" ")], ["Note", s.note]].filter(([, v]) => v);
    if (rows.length) b.push("| | |", "| --- | --- |", ...rows.map(([k, v]) => `| ${k} | ${tcell(v!)} |`), "");
    for (const a of attachmentsFor(run, s.n)) b.push(...evidenceBlock(a));
  }
  b.push("## Conclusion", "", `- **Overall result:** ${run.overall || "—"}`, `- **Deviations from the procedure:** ${run.deviations || "None"}`,
    `- **Issue flow:** ${run.issue || "—"}`, `- **Reviewed by:** ${run.reviewedBy || "—"}`, "");
  if (run.attachments.length) b.push("## Evidence files", "", "| File | Step | Kind | Size | SHA-256 | Source |", "| --- | --- | --- | --- | --- | --- |",
    ...run.attachments.map((a) => `| [[${a.file}\\|${a.name}]] | ${a.step || "setup"} | ${a.kind} | ${kb(a.bytes)} | \`${a.sha256.slice(0, 16)}…\` | ${a.source} |`), "");
  b.push("## Run state", "", "Read back by Testbench; edit the run in Testbench, not here.", "", "```mdse-run", JSON.stringify(run, null, 1), "```", "");
  return fm.join("\n") + "\n\n" + b.join("\n");
}
export function parseReport(text: string): RunRecord | null {
  const m = /```mdse-run\r?\n([\s\S]*?)\r?\n```/.exec(text); if (!m) return null;
  try { const r = JSON.parse(m[1]!) as RunRecord; return r.schema === 1 && r.runId && r.guid ? r : null; } catch { return null; }
}
/* Each note is checked and parsed once per text (the vault is scanned on every index rebuild). Runs handed out are
 * shared; treat them as read-only (an opened run is always a fresh parse, see openRun). */
const RUN_CACHE = new Map<string, { text: string; run: RunRecord | null }>();
let RUN_CACHE_VERSION = 0;
/** Changes whenever a report was added, changed or removed since the last listRuns. */
export const runListVersion = (): number => RUN_CACHE_VERSION;
/** Every run report in the vault, newest first. */
export function listRuns(files: Map<string, string>): Array<{ path: string; run: RunRecord }> {
  const out: Array<{ path: string; run: RunRecord }> = [];
  for (const [p, t] of files) {
    if (!/\.md$/i.test(p)) continue;
    let c = RUN_CACHE.get(p);
    if (!c || c.text !== t) {
      const run = t.includes("```mdse-run") ? parseReport(t) : null;
      if (run || c?.run) RUN_CACHE_VERSION++;
      c = { text: t, run }; RUN_CACHE.set(p, c);
    }
    if (c.run) out.push({ path: p, run: c.run });
  }
  for (const [p, c] of [...RUN_CACHE]) if (!files.has(p)) { RUN_CACHE.delete(p); if (c.run) RUN_CACHE_VERSION++; }
  return out.sort((a, b) => b.run.created.localeCompare(a.run.created));
}
export function planSaveReport(run: RunRecord, files: Map<string, string>): EditPlan {
  const path = runReportPath(run), before = files.get(path) ?? null, after = renderReport(run);
  if (before !== null) { const cur = parseReport(before); if (cur && cur.guid !== run.guid) return { summary: "", writes: [], problems: [`${path} belongs to another run. Start the run again to take the next number.`] }; }
  if (before === after) return { summary: "", writes: [], problems: ["Nothing changed since the last save."] };
  return { summary: `Save ${run.runId} to ${path}.`, writes: [{ path, before, after }], problems: [] };
}
