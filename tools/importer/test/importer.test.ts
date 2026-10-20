import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
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
const asVault = (res: ImportResult) => ({ hasVault: true, files: new Map(res.files.map((f) => [f.path, f.content])) });

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
  const second = await run({ existing: { hasVault: true, files } });
  const out = second.files.find((f) => f.path === target)!.content;
  assert.match(out, /status: Approved/); assert.match(out, /Engineer wrote this\./); assert.match(out, /subtype: software/);
  assert.match(out, /\[!flagConflict\] Source differs: subtype/);
  const third = await run({ existing: { hasVault: true, files: new Map([...files, [target, out]]) } });
  assert.equal(third.status, "NO_CHANGES", "flags must be idempotent");
});
