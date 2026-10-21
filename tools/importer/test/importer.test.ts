import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import MDSE from "../../core/src/mdse_core.js";
import { buildSyntheticQeax } from "../../../testing/fixtures/synthetic-ea/make_qeax.mjs";
import { runImport } from "../src/run.ts";
import type { ImportResult } from "../src/run.ts";
import { referencedSymbols } from "../src/sysml.ts";
import { Sha256 } from "../src/sha256.ts";
import { sqliteReader, defaultOptions } from "./harness.ts";
import classes from "../../core/src/classes.json" with { type: "json" };

const dir = mkdtempSync(join(tmpdir(), "mdse-imp-"));
const qeax = join(dir, "syn.qeax");
buildSyntheticQeax(qeax);
const run = async (over = {}): Promise<ImportResult> => { const r = sqliteReader(qeax); try { return await runImport(r, defaultOptions(over)); } finally { r.close(); } };
const notes = (res: ImportResult) => res.files.filter((f) => f.path.endsWith(".md") && !f.path.startsWith("99_System/") && f.path !== "README.md");
const asVault = (res: ImportResult) => ({ hasVault: true, files: new Map(res.files.filter((f) => !f.bytes).map((f) => [f.path, f.content])), allPaths: new Set(res.files.map((f) => f.path)) });

test("sha256 matches node:crypto", () => {
  for (const s of ["", "abc", "x".repeat(1000)]) { const h = new Sha256(); h.update(new TextEncoder().encode(s)); assert.equal(h.hex(), createHash("sha256").update(s).digest("hex")); }
});

test("new-vault run: ready, every source row has a disposition, no problems", async () => {
  const res = await run();
  assert.equal(res.status, "WRITE_READY", res.problems.join("; "));
  assert.equal(res.ledger.length, res.summary.packages + res.summary.elements + res.summary.connectors);
  assert.ok(res.ledger.every((l) => l.disposition));
  assert.ok(res.summary.notes > 10);
});

test("every note validates with the core validator", async () => {
  const res = await run();
  for (const f of notes(res)) assert.deepEqual(MDSE.validate(f.content, classes).map((i: { code: string; message: string }) => `${i.code} ${i.message}`), [], f.path);
});

test("ids and uids are unique; no id in the fixture range", async () => {
  const res = await run();
  const ids = new Set<string>(), uids = new Set<string>();
  for (const f of notes(res)) { const m = MDSE.parse(f.content).meta; assert.ok(!ids.has(m.id), "dup id " + m.id); assert.ok(!uids.has(m.uid), "dup uid " + m.uid); ids.add(m.id); uids.add(m.uid); assert.ok(+m.id.slice(-5) < 99000); assert.match(m.uid, /^\d{17}.{13}$/); }
});

test("assembled SysML: every Pkg::Name reference resolves to a declared primarySymbol", async () => {
  const res = await run();
  const declared = new Set<string>(), refs: Array<[string, string]> = [];
  for (const f of notes(res)) { const m = MDSE.parse(f.content).meta, s = MDSE.extractSysml(f.content); if (m.primarySymbol) declared.add(m.primarySymbol); if (s) for (const r of referencedSymbols(s)) refs.push([f.path, r]); }
  const missing = refs.filter(([, r]) => !declared.has(r));
  assert.deepEqual(missing, []);
});

test("unknown families are deferred with a review row, never mapped by fallback", async () => {
  const res = await run();
  const unk = res.ledger.filter((l) => l.diagnostic_code === "UNKNOWN_FAMILY");
  assert.ok(unk.length >= 2, "expected the unmapped stereotype and the Telepathy connector");
  assert.ok(unk.every((l) => l.disposition === "deferred_review"));
  const csv = res.files.find((f) => f.path.endsWith("Review - Deferred Elements.csv"))!.content;
  assert.match(csv, /Totally Unmapped Stereotype/);
});

test("hostile EA note text cannot break note structure", async () => {
  const res = await run();
  for (const f of notes(res)) { const n = MDSE.parse(f.content); const fences = (f.content.match(/^```/gm) ?? []).length; assert.ok(fences % 2 === 0, f.path); assert.ok(n.h2.filter(([, h]: [number, string]) => h === "## SysML v2").length <= 1, f.path); }
});

test("base vault included when output has no vault, not when it has one", async () => {
  const fresh = await run();
  assert.equal(fresh.summary.baseVaultIncluded, true);
  assert.ok(fresh.files.some((f) => f.path === ".vault.yaml" && /vault_uid: \d{17}/.test(f.content) && /vault_name: Test Vault/.test(f.content)));
  assert.ok(!fresh.files.some((f) => f.path.endsWith("ea-family-mapping.json")));
  const again = await run({ existing: asVault(fresh) });
  assert.equal(again.summary.baseVaultIncluded, false);
  assert.ok(!again.files.some((f) => f.path === ".vault.yaml"));
});

test("base vault ships the vault .gitignore and the two view folders (D-0023)", async () => {
  const fresh = await run(), get = (p: string): string | undefined => fresh.files.find((f) => f.path === p)?.content;
  const ig = get(".gitignore") ?? "";
  for (const line of [".obsidian/workspace.json", ".obsidian/plugins/*/data.json", "99_System/22_Views/*", "!99_System/22_Views/README.md", ".DS_Store"]) assert.ok(ig.split("\n").includes(line), line);
  for (const line of ["99_System/23_Saved_Views", "plugin-lock.yaml", "99_System/11_Import", ".obsidian/app.json"]) assert.ok(!ig.split("\n").some((l) => l.trim() === line || l.trim() === line + "/*"), `${line} must stay committed`);
  assert.match(get("99_System/22_Views/README.md") ?? "", /Git ignores this folder/);
  assert.match(get("99_System/23_Saved_Views/README.md") ?? "", /Saved views/);
});

test("identical re-import changes nothing", async () => {
  const first = await run();
  const second = await run({ existing: asVault(first) });
  assert.equal(second.status, "NO_CHANGES");
  assert.equal(second.files.length, 0);
  assert.equal(second.summary.created, 0);
});

test("re-import is additive: engineer edits survive, a differing source value becomes a flagConflict", async () => {
  const first = await run();
  const files = new Map(first.files.map((f) => [f.path, f.content]));
  const target = [...files.keys()].find((p) => p.endsWith("Charger.md"))!;
  let t = files.get(target)!;
  t = t.replace("status: Draft", "status: Approved").replace("\n\n\n\n## Source: EA", "\n\nEngineer wrote this.\n\n\n\n## Source: EA").replace(/^subtype: .*$/m, "subtype: software");
  files.set(target, t);
  const second = await run({ existing: { hasVault: true, files, allPaths: new Set(first.files.map((f) => f.path)) } });
  const out = second.files.find((f) => f.path === target)!.content;
  assert.match(out, /status: Approved/); assert.match(out, /Engineer wrote this\./); assert.match(out, /subtype: software/);
  assert.match(out, /\[!flagConflict\] Source differs: subtype/);
  const third = await run({ existing: { hasVault: true, files: new Map([...files, [target, out]]), allPaths: new Set(first.files.map((f) => f.path)) } });
  assert.equal(third.status, "NO_CHANGES", "flags must be idempotent");
});

import { ELEMENT_RULES, RELATIONSHIP_RULES, CODES, codeBase, elementRule } from "../src/translation.ts";
import { ImportFailure } from "../src/run.ts";
import mapping from "../../../governance/schemas/ea-family-mapping.json" with { type: "json" };

test("translation table covers every family in the mapping file, and nothing else", () => {
  for (const e of mapping.elements) assert.ok(elementRule(e as never), "no element rule for " + e.family);
  for (const r of mapping.relationships) assert.ok(RELATIONSHIP_RULES[r.family], "no relationship rule for " + r.family);
  const fams = new Set(mapping.relationships.map((r) => r.family));
  for (const k of Object.keys(RELATIONSHIP_RULES)) assert.ok(fams.has(k), "rule for family not in mapping: " + k);
  const used = new Set(Object.values(ELEMENT_RULES).concat(Object.values(RELATIONSHIP_RULES)).flatMap((r) => r.exceptions.map((x) => codeBase(x))));
  for (const c of used) assert.ok(CODES[c], "exception code not documented: " + c);
});

test("every diagnostic code the importer writes is documented", async () => {
  const res = await run();
  for (const l of res.ledger) for (const c of [l.diagnostic_code, ...l.evidence.split(";")].filter(Boolean)) { const b = codeBase(c); if (/^(merged into|Unnamed)/.test(c)) continue; assert.ok(CODES[b], `undocumented code ${c} on ${l.source_table} ${l.source_pk}`); }
});

test("part usage wins over aggregation: one usage, aggregation is alias_merged", async () => {
  const res = await run();
  const charger = res.files.find((f) => f.path === "02 Product/Charger.md")!.content.split("## SysML v2")[1]!;
  assert.equal((charger.match(/part controller\b/g) ?? []).length, 1);
  assert.equal((charger.match(/part modules\b/g) ?? []).length, 1);
  assert.ok(!/part powerModule\b/.test(charger), "aggregation must not add a second usage when the EA Part already exists");
  assert.ok(res.ledger.some((l) => l.source_table === "t_connector" && l.disposition === "alias_merged" && l.diagnostic_code === "USAGE_WINS"));
  assert.match(charger, /part chargeFirmware : /, "an aggregation with no usage still becomes a usage");
});

test("flows: flow items carry direction and type; missing direction is reported", async () => {
  const res = await run();
  const port = res.files.find((f) => f.path.endsWith("Charge Port Interface.md"))!.content;
  assert.match(port, /in item currentCmd : IFLOW_\d{5}::ChargeCurrentCommand;/);
  assert.match(port, /out item statusOut : IFLOW_\d{5}::ChargerStatus;/);
  assert.match(port, /inout item untypedFlow;/);
  assert.ok(!/noDirection/.test(port.split("## SysML v2")[1]!));
  assert.ok(res.ledger.some((l) => l.diagnostic_code === "DIRECTION_EVIDENCE_MISSING"));
  const fn = res.files.find((f) => f.path.endsWith("Provide Charge Power.md"))!.content;
  assert.match(fn, /succession first measure if guardMeasurementReady\w* then adjust;/);
  assert.match(fn, /constraint guardMeasurementReady\w* \{ doc \/\* measurement ready \* \/ and stable \*\/ \}/, "guard wording is a doc, `*\/` escaped");
  const st = res.files.find((f) => f.path.endsWith("Charging.md"))!.content;
  assert.match(st, /transition first idle accept triggerStartButtonPressed if guardSupplyVoltageOk do effectCloseContactor then running;/);
  assert.match(st, /item triggerStartButtonPressed \{ doc \/\* Start button pressed \*\/ \}/);
  assert.doesNotMatch(st.split("## SysML v2")[0]!, /Transition idle|guard\/trigger/, "no EA-style guard line outside the SysML block (IMP-098)");
  assert.ok(res.ledger.some((l) => l.diagnostic_code === "FLOW_ENDPOINT_NOT_USAGE"));
  assert.ok(!res.ledger.some((l) => l.diagnostic_code === "PORT_CONNECTION_NEEDS_COMMON_OWNER"), "ports on different parts are connected through the owning assembly");
  assert.match(res.files.find((f) => f.path === "02 Product/Charger.md")!.content, /connect controller\.ctrlOut to modules\.pmPort;/);
  assert.match(fn, /fork split;/); assert.match(fn, /succession first adjust then split;/); assert.match(fn, /succession first split then branchOne;/);
  assert.ok(res.ledger.some((l) => l.diagnostic_code === "FORK_JOIN_AMBIGUOUS"));
  assert.ok(res.ledger.some((l) => l.diagnostic_code === "TRIGGER_RECORDED_ON_OWNER"));
  assert.ok(res.ledger.some((l) => l.diagnostic_code === "LEGAL_TRANSITION_CONTEXT"));
});

test("a row that throws is logged, skipped and does not stop the run", async () => {
  const broken = structuredClone(mapping) as typeof mapping;
  delete (broken.elements.find((e) => e.family === "Class:Hardware Component") as Record<string, unknown>).conditional_evidence;
  const res = await run({ mapping: broken });
  assert.equal(res.status, "WRITE_READY");
  assert.ok(res.errors.length >= 2, "every Hardware Component row should raise");
  const e = res.errors[0]!;
  assert.equal(e.stage, "classify"); assert.equal(e.table, "t_object"); assert.ok(e.guid && e.pk && e.message && e.stack);
  assert.ok(res.ledger.filter((l) => l.disposition === "error" && l.diagnostic_code === "EXCEPTION").length === res.errors.length);
  assert.ok(res.files.some((f) => /Error Log .*\.json$/.test(f.path)) && res.files.some((f) => /Error Log .*\.md$/.test(f.path)));
  assert.ok(res.summary.notes > 5, "other rows still produce notes");
  assert.equal(res.ledger.length, res.summary.packages + res.summary.elements + res.summary.connectors);
});

test("a failure that stops the run names the stage and the source", async () => {
  const r = sqliteReader(qeax);
  const bad = { has: r.has, scan: async function* (t: string) { if (t === "t_connector") throw new Error("disk image is malformed"); yield* r.scan(t); } };
  await assert.rejects(runImport(bad, defaultOptions()), (err: unknown) => err instanceof ImportFailure && err.stage === "read source" && /malformed/.test(err.message) && err.detail.sourceName === "synthetic.qeax");
  r.close();
});

test("attachments: Artifact note, file written once, never overwritten", async () => {
  const res = await run();
  const bin = res.files.find((f) => f.path === "Attachments/wiring.png")!;
  assert.ok(bin && bin.bytes && bin.bytes.length === 12 && bin.bytes[0] === 0x89);
  const note = res.files.find((f) => f.path.endsWith("Wiring Picture.md"))!.content;
  assert.match(note, /!\[\[Attachments\/wiring\.png\]\]/); assert.match(note, /^type: Artifact$/m);
  assert.ok(res.ledger.some((l) => l.evidence.includes("ATTACHMENT_BYTES_NOT_FOUND")), "the Datasheet has no content");
  const again = await run({ existing: asVault(res) });
  assert.equal(again.status, "NO_CHANGES"); assert.ok(!again.files.some((f) => f.path.startsWith("Attachments/")));
});

test("extend becomes an optional use case; dependency kinds stay distinct", async () => {
  const res = await run();
  const body = (name: string) => res.files.find((f) => f.path.endsWith(name))!.content.split("## SysML v2")[1]!;
  assert.match(body("Charge a Vehicle.md"), /use case \w+ : UC_\d{5}::Authenticate\[0\.\.1\];/);
  assert.match(body("Charge a Vehicle.md"), /include use case authenticate : UC_\d{5}::Authenticate;/);
  const std = body("UL 2594 5.1 Enclosure.md");
  assert.match(std, /\/\/ trace/); assert.match(std, /\/\/ refines/);
  assert.match(body("Charge Current Accuracy.md"), /dependency from REQ_\d{5}::ChargeCurrentAccuracy to STD_\d{5}::UL259451Enclosure; \/\/ derivedFrom/);
  assert.match(readFileSync(new URL("../TRANSLATION.md", import.meta.url), "utf8"), /## Dependency kinds/);
});

test("EA tags follow ea-tag-dispositions.json: placeholders and dropped tags are left out, listed body tags kept, new tags reported", async () => {
  const res = await run();
  const src = res.files.find((f) => f.path === "02 Product/Charger.md")!.content.split("## Source: EA")[1]!.split("## SysML v2")[0]!;
  assert.doesNotMatch(src, /unassigned|<memo>|Responsible|Target-Trace/);
  assert.match(src, /^- Brand: Acme$/m);
  assert.match(src, /^- Zzz New Tag: kept until decided$/m);
  assert.ok(res.warnings.some((p) => p.includes('"Zzz New Tag"')), "a tag with no disposition is reported");
  assert.ok(!res.warnings.some((p) => p.includes('"Brand"')));
  assert.deepEqual(res.problems, []);
});

test("no EA GUIDs in Source: EA except the note's own identity line (flag callouts keep the connector GUID: it is the handle to the ledger row)", async () => {
  const res = await run();
  for (const f of notes(res)) {
    const lines = (f.content.split("## Source: EA")[1] ?? "").split("## SysML v2")[0]!.split("\n").filter((l) => /\{[0-9A-F]{8}-/i.test(l));
    assert.ok(lines.length <= 1 && lines.every((l) => l.startsWith("- EA GUID: ")), `${f.path}: ${lines.join(" | ")}`);
  }
});

test("a usage with no name takes the name of its typed element (IMP-110)", async () => {
  const res = await run();
  const charger = res.files.find((f) => f.path === "02 Product/Charger.md")!.content.split("## SysML v2")[1]!;
  assert.match(charger, /part contactor : /);
  assert.ok(!/part part\d+/.test(charger.split("mystery")[0]!), "no generated name where the type could name it");
});

test("the disposition lists are well formed and cover the tags the fixtures use", async () => {
  const td = JSON.parse(readFileSync(new URL("../../../governance/schemas/ea-tag-dispositions.json", import.meta.url), "utf8")).tags as Array<{ tag: string; disposition: string }>;
  assert.equal(new Set(td.map((t) => t.tag)).size, td.length, "one entry per tag");
  assert.ok(td.every((t) => ["property", "body", "structure", "archive", "drop"].includes(t.disposition)));
  for (const k of ["Priority-Trace", "Responsible", "Special Characteristic", "Special Characteristic Comment", "Special Characteristic-Trace", "Supporting", "Target", "Target-Trace"]) assert.equal(td.find((t) => t.tag === k)?.disposition, "drop", k);
});

test("Source: EA does not repeat what SysML or the YAML already say (IMP-096)", async () => {
  const res = await run();
  const all = notes(res).filter((f) => !f.path.endsWith("Boundaries.md")).map((f) => (f.content.split("## Source: EA")[1] ?? "").split("## SysML v2")[0]!).join("\n");
  assert.doesNotMatch(all, /^- (Usage|Flow|Control node|Aggregation|Specializes|Satisfies|Verifies|Allocated to|Realises|Performs|Derived from|Dependency|Connection|Includes|Extended by|Link describes|EA type|EA stereotype|EA author|EA created|EA package)\b/m);
  const charger = res.files.find((f) => f.path === "02 Product/Charger.md")!.content;
  assert.match(charger, /part modules\[3\]|part modules : [^;]*\[3\]/, "quantity is SysML multiplicity");
  assert.match(charger, /^eaType: /m, "EA type and stereotype are in the YAML");
});

test("requirement wording is the definition's doc, not repeated in the body (IMP-097)", async () => {
  const res = await run();
  const req = res.files.find((f) => f.content.includes("outdoor use"))!.content;
  const sysml = req.split("## SysML v2")[1]!;
  assert.match(sysml, /requirement def [\s\S]*doc \/\*[\s\S]*outdoor use[\s\S]*\*\//, "text is a doc comment in the requirement def");
  assert.equal(req.split("## SysML v2")[0]!.includes("outdoor use"), false, "not duplicated above the SysML block");
});

test("file names the browser would refuse never reach the writer: device names with an extension, invisible characters, lone surrogates", async () => {
  const { safeName } = await import("../src/naming.ts");
  assert.equal(safeName("Con.pdf"), "Con_.pdf");
  assert.equal(safeName("aux"), "aux_");
  assert.equal(safeName("COM1.final.xlsx"), "COM1_.final.xlsx");
  assert.equal(safeName("Console.pdf"), "Console.pdf");
  assert.equal(safeName("Rail\u200e Spec\u202e v2\u2028"), "Rail Spec v2");
  assert.equal(safeName("Bad\ud800 name\udfff"), "Bad name");
  assert.equal(safeName("Emoji \ud83d\ude80 ok"), "Emoji \ud83d\ude80 ok", "a valid surrogate pair is kept");
  assert.equal(safeName("Tab\there\u0085"), "Tabhere");
  assert.equal(safeName("x".repeat(160) + "."), "x".repeat(100) + "~a");
  assert.equal(safeName("\u2028\u200e"), "Unnamed");
  const res = await run();
  const bad = res.files.flatMap((f) => f.path.split("/").map((c) => [f.path, c])).filter(([, c]) => !c || /[\u0000-\u001f\u007f-\u009f<>:"\\|?*\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufff9-\uffff]|[. ]$/.test(c!) || /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(c!.split(".")[0]!));
  assert.deepEqual(bad, []);
});

test("folder paths are squeezed to fit Windows extraction, and a folder has one spelling whatever sits below it (IMP-103)", async () => {
  const { folderSqueezer, DIR_BUDGET } = await import("../src/naming.ts");
  const long = (i: number): string => `Subsystem ${i} with a long descriptive package name`;
  const deep = Array.from({ length: 12 }, (_, i) => long(i));
  const shallow = deep.slice(0, 3);
  const sq = folderSqueezer([deep, shallow, ["02 Product", "Power Train"]]);
  assert.deepEqual(sq(["02 Product", "Power Train"]), ["02 Product", "Power Train"], "a short tree is left whole");
  const full = sq(deep);
  for (let n = 1; n <= deep.length; n++) assert.deepEqual(sq(deep.slice(0, n)), full.slice(0, n), `prefix ${n} must be spelled as in the deep path`);
  assert.deepEqual(sq(shallow), full.slice(0, 3));
  assert.ok(full.join("/").length <= DIR_BUDGET + 12, full.join("/"));
  assert.deepEqual(folderSqueezer([deep, shallow])(deep), full, "deterministic");
  const alone = folderSqueezer([shallow]);
  assert.deepEqual(alone(shallow), shallow, "a shallow tree keeps its names even if another tree is deep");
  const res = await run();
  const longest = Math.max(...res.files.map((f) => f.path.length));
  assert.ok(longest < 200, String(longest));
});
