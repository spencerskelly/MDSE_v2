import test from "node:test";
import assert from "node:assert/strict";
import { usageIdent, IdentScope, identLosesName } from "../src/naming.ts";
import { preflight, preflightCsv, flagShape } from "../src/preflight.ts";
import { toolsetStatus, semverCmp } from "../src/vault_update.ts";

test("IMP-124: a signed or decimal name keeps what makes it different", () => {
  assert.equal(usageIdent("+3.3VDC"), "plus3p3VDC");
  assert.equal(usageIdent("3.3VDC"), "_3p3VDC");
  assert.notEqual(usageIdent("+3.3VDC"), usageIdent("3.3VDC"));
  assert.equal(usageIdent("-12V"), "minus12V");
  assert.equal(usageIdent("CAN-H"), "CANH", "a hyphen between words still separates them");
  assert.equal(usageIdent("Flexible Conductor"), "flexibleConductor");
  assert.ok(identLosesName("+3.3VDC", usageIdent("+3.3VDC")), "the EA name is recorded when the identifier is not just a respelling");
  assert.ok(!identLosesName("Flexible Conductor", "flexibleConductor"));
});

test("IMP-124: two ports with one name are told apart by their type", () => {
  const s = new IdentScope();
  assert.equal(s.take("a", "ICableJacket"), "a");
  assert.equal(s.take("a", "IConductor"), "a_IConductor");
  assert.equal(s.take("a", "IConductor"), "a_2", "the same type again falls back to a number");
  assert.equal(s.take("b"), "b");
  assert.equal(s.take("b"), "b_2");
});

const flagFile = (path: string, ...titles: string[]) => ({ path, content: `# x\n\n${titles.map((t) => `> [!flagNote] ${t}\n> detail\n`).join("\n")}` });
const base = { files: [], ledger: [], status: "WRITE_READY", elements: 100, errors: 0, problems: [], bomErrors: [], bomWarnings: 0, conflicts: 0, existingDiffers: 0, badPaths: [] };

test("IMP-125: preflight groups the flags a run would write and gives a verdict", () => {
  assert.equal(flagShape("Port `a1` added from an assembly"), "Port `…` added from an assembly");
  assert.equal(flagShape("Unresolved Association link to Web Portal"), "Unresolved Association link", "the target name is not part of the kind");
  const p = preflight({ ...base, files: [flagFile("IPC/A.md", "Port `a` added from an assembly", "Untyped part usage `x`"), flagFile("IPC/B.md", "Port `b` added from an assembly"), flagFile("99_System/Skip.md", "Port `c` added from an assembly")],
    ledger: [{ disposition: "deferred_review", diagnostic_code: "USAGE_WITHOUT_NOTE_OWNER", ea_type: "Part" }, { disposition: "native", diagnostic_code: "", ea_type: "Class" }] });
  assert.equal(p.flagTotal, 3, "99_System notes are not engineering notes");
  assert.equal(p.groups[0]!.count, 2); assert.equal(p.groups[0]!.title, "Port `…` added from an assembly");
  assert.equal(p.deferred[0]!.code, "USAGE_WITHOUT_NOTE_OWNER");
  assert.equal(p.verdict, "FLAGS");
  assert.match(preflightCsv(p), /^flag,title,note\nNote,/);
  assert.equal(preflight(base).verdict, "CLEAN");
  const f = preflight({ ...base, ledger: [
    ...Array.from({ length: 4 }, () => ({ disposition: "native", diagnostic_code: "", ea_type: "Class" })), { disposition: "native", diagnostic_code: "UNVERIFIED_SYNTAX", ea_type: "Class" },
    { disposition: "native", diagnostic_code: "SUBTYPE_DEFAULTED_PART", ea_type: "Class" }, { disposition: "native", diagnostic_code: "UNRESOLVED_PORT_TYPE:TARGET_IS_X", ea_type: "Port" },
    { disposition: "deferred_review", diagnostic_code: "X", ea_type: "Part" }, { disposition: "error", diagnostic_code: "EXCEPTION", ea_type: "Part" },
    { disposition: "evidence_only", diagnostic_code: "REFERENCE_ONLY", ea_type: "Note" }, { disposition: "alias_merged", diagnostic_code: "USAGE_WINS", ea_type: "Part" }] }).fate;
  assert.deepEqual([f.clean, f.nonStandard.total, f.mayBeLost.total, f.mayBeLost.deferred, f.mayBeLost.skippedByError, f.textOnly, f.merged], [5, 2, 2, 1, 1, 1, 1]);
  assert.equal(f.nonStandard.codes.map((c) => c.code).sort().join(), "SUBTYPE_DEFAULTED_PART,UNRESOLVED_PORT_TYPE");
});

test("IMP-125: errors, bad names and a heavy deferral change the verdict", () => {
  assert.equal(preflight({ ...base, bomErrors: ["Missing column(s): Quantity."] }).verdict, "BLOCKED");
  assert.equal(preflight({ ...base, badPaths: ["IPC/a?.md"] }).verdict, "BLOCKED");
  assert.equal(preflight({ ...base, status: "FAILED" }).verdict, "BLOCKED");
  assert.equal(preflight({ ...base, errors: 2 }).verdict, "REVIEW");
  assert.equal(preflight({ ...base, bomSkipped: 3 }).verdict, "REVIEW", "skipped BOM lines are a look-first, not a stop");
  assert.equal(preflight({ ...base, existingDiffers: 1 }).verdict, "REVIEW");
  const heavy = preflight({ ...base, ledger: Array.from({ length: 20 }, () => ({ disposition: "deferred_review", diagnostic_code: "X", ea_type: "Part" })) });
  assert.equal(heavy.verdict, "REVIEW"); assert.match(heavy.reasons[0]!, /20 of 100/);
});

test("IMP-126: the version check compares the vault's toolset with the one being installed", () => {
  assert.equal(semverCmp("0.0.0-dev", "0.9.0"), -1); assert.equal(semverCmp("0.9.0", "0.9.0"), 0); assert.equal(semverCmp("0.10.0", "0.9.0"), 1); assert.equal(semverCmp("0.9.0-dev", "0.9.0"), -1);
  const base = { ".vault.yaml": "mdse_release: 0.9.0\nschema: mdse-vault/0.1\n", ".obsidian/plugins/mdse-workbench/manifest.json": '{"version":"0.9.0"}', ".obsidian/plugins/mdse-workbench/main.js": "new", "99_System/03_Schemas/a.yaml": "a: 1\n" };
  const vault = (rel: string, wb: string, js: string, schema: string): Record<string, string> => ({ ".vault.yaml": `mdse_release: ${rel}\nschema: mdse-vault/0.1\n`, ".obsidian/plugins/mdse-workbench/manifest.json": `{"version":"${wb}"}`, ".obsidian/plugins/mdse-workbench/main.js": js, "99_System/03_Schemas/a.yaml": schema });
  const run = (files: Record<string, string> | null) => toolsetStatus({ base, read: async (p) => (files ? files[p] ?? null : null), runDate: "2026-10-21T09:00:00" });
  return (async () => {
    assert.equal((await run(null)).verdict, "NEW_VAULT");
    const cur = await run(vault("0.9.0", "0.9.0", "new", "a: 1\n")); assert.equal(cur.verdict, "CURRENT"); assert.ok(cur.rows.every((r) => r.state === "same"));
    const old = await run(vault("0.0.0-dev", "0.8.0", "old", "a: 0\n")); assert.equal(old.verdict, "UPDATE");
    assert.equal(old.rows.find((r) => r.name === "mdse-workbench")!.state, "update"); assert.equal(old.rows[0]!.state, "update");
    const newer = await run(vault("0.9.0", "1.0.0", "newest", "a: 1\n")); assert.equal(newer.verdict, "VAULT_NEWER");
    const dev = await run(vault("0.9.0", "0.9.0", "built yesterday", "a: 1\n")); assert.equal(dev.rows.find((r) => r.name === "mdse-workbench")!.state, "differs");
  })();
});
