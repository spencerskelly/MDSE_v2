import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import os from "node:os";
import { randomBytes, createHash } from "node:crypto";
import { buildIndex } from "../../workbench/src/index.ts";
import { classes } from "../../workbench/test/harness.ts";
import { loadSqlJsNode } from "../../core/src/sqljs_node.ts";
import * as R from "../src/tb_run.ts";
import * as C from "../src/tb_csv.ts";
import * as P from "../src/tb_pair.ts";
import * as D from "../src/tb_db.ts";

// Synthetic notes only (DAT-002): a requirement, a test case that verifies it with a numbered procedure.
const fm = (o: Record<string, string>): string => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const note = (o: Record<string, string>, title: string, body: string, sysml = ""): string => `---\n${fm(o)}\n---\n# ${title}\n\n${body}\n${sysml ? `\n## SysML v2\n\n\`\`\`sysml\n${sysml}\n\`\`\`\n` : ""}`;
const files = (): Map<string, string> => new Map([
  ["R/Fault report.md", note({ type: "Requirement", subtype: "functional", id: "REQ-00001", uid: "uR1", status: "Draft", primarySymbol: "R1::Fault_report" }, "Fault report", "The unit shall report a fault within 2 s.",
    "package R1 {\n requirement def Fault_report;\n}")],
  ["V/Fault timing.md", note({ type: "Verification", subtype: "test", id: "VER-00001", uid: "uV1", status: "Draft", primarySymbol: "V1::Fault_timing" }, "Fault timing",
    "Procedure:\n\n1. Power the unit at 48 V. Expected: green LED\n2. Short the sense input -> fault reported within 2 s\n3. Remove the short",
    "package V1 {\n verification def Fault_timing {\n  requirement r : R1::Fault_report;\n  objective o {\n   verify r;\n  }\n }\n}")],
]);
const AUTHOR = "SkellySpencer", NOW = new Date(2026, 10, 26, 17, 0, 0, 0);
const SQL = await loadSqlJsNode();

test("a run starts from the test case: requirements verified, steps from its numbered list, expected values split out", () => {
  const ix = buildIndex(files(), { classes });
  const run = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, [], "Test Reports", "S. Skelly");
  assert.equal(run.runId, "TRP-2611-0001");
  assert.equal(run.guid.length, 30);
  assert.equal(run.caseTitle, "Fault timing");
  assert.equal(run.method, "test");
  assert.deepEqual(run.requirements.map((q) => q.id), ["REQ-00001"]);
  assert.deepEqual(run.steps.map((s) => [s.n, s.action, s.expected]), [[1, "Power the unit at 48 V", "green LED"], [2, "Short the sense input", "fault reported within 2 s"], [3, "Remove the short", ""]]);
  assert.equal(run.date, "2026-11-26");
  assert.equal(R.runReportPath(run), "Test Reports/TRP-2611-0001/TRP-2611-0001.md");
});

test("evidence files are named for their step and never overwrite", () => {
  const run = R.startRun(null, "", AUTHOR, NOW, []);
  const taken = new Set<string>();
  const a = R.evidencePath(run, 3, "IMG 0042.HEIC", taken); taken.add(a);
  const b = R.evidencePath(run, 3, "IMG 0042.HEIC", taken);
  assert.equal(a, "Test Reports/TRP-2611-0001/step-03-IMG-0042.heic");
  assert.equal(b, "Test Reports/TRP-2611-0001/step-03-IMG-0042-2.heic");
  assert.equal(R.evidencePath(run, 0, "bench.jpg", taken), "Test Reports/TRP-2611-0001/setup-bench.jpg");
  assert.equal(R.kindOf("scope.CSV"), "csv");
  assert.equal(R.kindOf("blob", "image/jpeg"), "image");
});

test("submit is refused until the unit, every step and a consistent overall result are recorded", () => {
  const ix = buildIndex(files(), { classes });
  let run = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, [], "Test Reports", "S. Skelly");
  const r0 = R.markRun(run, "submitted", AUTHOR, NOW);
  assert.ok("error" in r0 && /serial/.test(r0.error) && /no result/.test(r0.error));
  run.unit = { serial: "SN-TEST-001", hw: "B", fw: "1.0.0" };
  run.steps.forEach((s) => { s.result = "Pass"; });
  run.steps[1]!.result = "Fail"; run.overall = "Pass";
  const r1 = R.markRun(run, "submitted", AUTHOR, NOW);
  assert.ok("error" in r1 && /step 2 failed/.test(r1.error));
  run.overall = "Fail";
  run.equipment.push({ name: "Scope", id: "EQ-1", calDue: "2026-01-01" });
  assert.match(R.runProblems(run, "2026-11-26").join(" "), /calibration was due 2026-01-01/);
  const r2 = R.markRun(run, "submitted", AUTHOR, NOW); assert.ok("run" in r2); run = r2.run;
  assert.equal(run.status, "submitted");
});

test("the report note: readable evidence, CSV summary, hashes, and it reads back to the same run", () => {
  const ix = buildIndex(files(), { classes });
  const run = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, []);
  const csv = "Model,SYNTH-SCOPE\nSample Interval,1e-06\nTime,CH1,CH2\n0,0.01,4.9\n1e-06,0.02,5.1\n2e-06,1.5,5.0\n";
  run.attachments.push({ file: "Test Reports/TRP-2611-0001/step-02-ch1.csv", name: "ch1.csv", kind: "csv", step: 2, caption: "Sense line at fault", sha256: "a".repeat(64), bytes: csv.length, added: NOW.toISOString(), by: AUTHOR, source: "inbox", summary: C.summarizeCsv(csv) });
  run.attachments.push({ file: "Test Reports/TRP-2611-0001/setup-bench.jpg", name: "bench.jpg", kind: "image", step: 0, caption: "Bench setup", sha256: "b".repeat(64), bytes: 812000, added: NOW.toISOString(), by: AUTHOR, source: "phone" });
  const text = R.renderReport(run);
  assert.match(text, /^---\nmdseTestReport: TRP-2611-0001\n/);
  assert.doesNotMatch(text.split("\n---")[0]!, /^(type|uid):/m, "a report is not a model note");
  assert.match(text, /^case: "\[\[V\/Fault timing\|Fault timing\]\]"$/m);
  assert.match(text, /!\[\[Test Reports\/TRP-2611-0001\/setup-bench\.jpg\|700\]\]/);
  assert.match(text, /\| CH1 \| 0\.01 \| 1\.5 \| 0\.51 \|/);
  assert.match(text, /`aaaaaaaaaaaaaaaa…`/);
  assert.deepEqual(R.parseReport(text), run);
  const f = files(); f.set(R.runReportPath(run), text);
  assert.equal(buildIndex(f, { classes }).notes.size, 2, "the index skips the report");
  assert.deepEqual(R.listRuns(f).map((x) => x.run.runId), ["TRP-2611-0001"]);
  assert.equal(R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, [run]).runId, "TRP-2611-0002");
});

test("scope and DAQ CSV: preamble kept as metadata, header found, numeric columns summarised", () => {
  const s = C.summarizeCsv("Model,SYNTH-SCOPE\r\nSample Interval,2e-09\r\n\r\nTime,CH1\r\n-1e-08,0.0\r\n0,3.3\r\n1e-08,3.28\r\n");
  assert.equal(s.rows, 3);
  assert.equal(s.sampleInterval, "2e-09");
  assert.deepEqual(s.meta.map((m) => m.key), ["Model", "Sample Interval"]);
  assert.deepEqual(s.columns.map((c) => [c.name, c.min, c.max]), [["Time", "-1.0000e-8", "1.0000e-8"], ["CH1", "0", "3.3"]]);
  const daq = C.summarizeCsv("t;temp_C;volt\n0;21,5;12\n1;22;12.1\n");
  assert.equal(daq.delimiter, ";");
  assert.equal(C.summarizeCsv("no numbers here\nat all").rows, 0);
});

test("phone capture: the page, a token-only upload, type and size limits, and the session closes", async () => {
  const saved: P.PairUpload[] = [];
  const deps: P.PairDeps = { http, os, randomHex: (n) => randomBytes(n).toString("hex") };
  const s = await P.openPairSession(deps, { label: "TRP-2611-0001 · Step 2", maxBytes: 1000, onFile: async (u) => { saved.push(u); return "Test Reports/TRP-2611-0001/step-02-" + u.name; } });
  const base = `http://127.0.0.1:${s.port}/c/${s.token}`;
  assert.match(s.url, new RegExp(`:${s.port}/c/${s.token}$`));
  const page = await fetch(base); assert.equal(page.status, 200); assert.match(await page.text(), /Take photo/);
  assert.equal((await fetch(`http://127.0.0.1:${s.port}/c/wrong`)).status, 404);
  const ok = await fetch(base + "/upload?name=scope.png&caption=CH1", { method: "POST", headers: { "Content-Type": "image/png" }, body: new Uint8Array([137, 80, 78, 71]) });
  assert.deepEqual(await ok.json(), { ok: true, file: "step-02-scope.png" });
  assert.equal(saved[0]!.caption, "CH1"); assert.equal(saved[0]!.bytes.length, 4);
  assert.equal((await fetch(base + "/upload?name=x.exe", { method: "POST", headers: { "Content-Type": "application/x-msdownload" }, body: "MZ" })).status, 415);
  assert.equal((await fetch(base + "/upload?name=big.jpg", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: new Uint8Array(2000) })).status, 413);
  assert.equal(s.received.length, 1);
  await s.close();
  await assert.rejects(fetch(base), "the server is gone after close");
});

test("the Testbench database indexes runs, evidence and units, and keeps drafts", () => {
  const ix = buildIndex(files(), { classes }), db = D.openTestbenchDb(SQL), f = files();
  const run = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, []);
  run.unit = { serial: "SN-TEST-001", hw: "B", fw: "1.0.0" }; run.overall = "Pass"; run.steps.forEach((s) => { s.result = "Pass"; });
  run.attachments.push({ file: "Test Reports/TRP-2611-0001/step-01-led.jpg", name: "led.jpg", kind: "image", step: 1, caption: "Green LED on", sha256: createHash("sha256").update("x").digest("hex"), bytes: 10, added: NOW.toISOString(), by: AUTHOR, source: "phone" });
  f.set(R.runReportPath(run), R.renderReport(run));
  const draft = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, [run]);
  D.saveRunDraft(db, draft, NOW);
  assert.equal(D.indexRuns(db, f), 1);
  assert.deepEqual(D.runsOfUnit(db, "SN-TEST-001").map((x) => x.run_id), ["TRP-2611-0001"]);
  assert.deepEqual(D.findEvidence(db, "LED").map((x) => x.step), [1]);
  assert.equal(D.caseStats(db).get("V/Fault timing.md")!.last_result, "Pass");
  assert.deepEqual(D.draftRuns(db).map((x) => [x.run_id, x.saved]), [["TRP-2611-0002", 0]]);
  const again = D.openTestbenchDb(SQL, db.export());
  assert.equal(D.loadRunDraft(again, draft.guid)!.run.runId, "TRP-2611-0002");
});

test("runs: parsed once per text, the index rebuilt only on change, and case stats take the newest run", () => {
  const ix = buildIndex(files(), { classes }), db = D.openTestbenchDb(SQL), f = files();
  const a = R.startRun(ix, "V/Fault timing.md", AUTHOR, NOW, []); a.overall = "Fail";
  f.set(R.runReportPath(a), R.renderReport(a));
  const b = R.startRun(ix, "V/Fault timing.md", AUTHOR, new Date(NOW.getTime() + 60_000), [a]); b.overall = "Pass";
  f.set(R.runReportPath(b), R.renderReport(b));
  D.indexRuns(db, f); db.export();
  const first = R.listRuns(f)[0]!.run;
  assert.equal(R.listRuns(f)[0]!.run, first, "same text, same parsed run");
  D.indexRuns(db, f);
  assert.equal(db.dirty, false, "no report changed: nothing rewritten");
  const st = D.caseStats(db).get("V/Fault timing.md")!;
  assert.deepEqual([st.runs, st.last_result, st.last_run], [2, "Pass", b.runId]);
  f.set("Notes/meeting.md", "# Meeting\n\nNo report here.\n");
  D.indexRuns(db, f);
  assert.equal(db.dirty, false, "a plain note is not a report");
  f.delete(R.runReportPath(b));
  D.indexRuns(db, f);
  assert.deepEqual([D.caseStats(db).get("V/Fault timing.md")!.runs, D.caseStats(db).get("V/Fault timing.md")!.last_result], [1, "Fail"]);
});
