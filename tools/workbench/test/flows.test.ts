import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex, isIndexedPath, isGovernedText } from "../src/index.ts";
import * as F from "../src/flows.ts";
import * as FU from "../src/flows_ui.ts";
import { classes } from "./harness.ts";

// Synthetic parts only (DAT-002): SCR-1 inside ASM-1 inside TOP-1, plus one requirement SCR-1 satisfies.
const fm = (o: Record<string, string>): string => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const note = (o: Record<string, string>, title: string, sysml = ""): string => `---\n${fm(o)}\n---\n# ${title}\n${sysml ? `\n## SysML v2\n\n\`\`\`sysml\n${sysml}\n\`\`\`\n` : ""}`;
const part = (id: string, pn: string, body = "", extra: Record<string, string> = {}): string => note({ type: "Object", subtype: "part", id, uid: "u" + id, status: "Draft", partNumber: pn, revision: "A01", sourceRole: "authoritative-model", primarySymbol: `${id.replace("-", "_")}::P_${pn.replace("-", "_")}`, ...extra }, pn, `package ${id.replace("-", "_")} {\n part def ${"P_" + pn.replace("-", "_")} {\n${body}\n }\n}`);
const files = (extra: [string, string][] = []): Map<string, string> => new Map<string, string>([
  ["P/SCR-1.md", part("OBJ-00010", "SCR-1", "", { makeBuy: "buy", description: "Screw, M4 x 10", businessLine: "MHE" })],
  ["P/ASM-1.md", part("OBJ-00011", "ASM-1", "  part s : OBJ_00010::P_SCR_1;", { makeBuy: "make", businessLine: "GSE" })],
  ["P/TOP-1.md", part("OBJ-00012", "TOP-1", "  part a : OBJ_00011::P_ASM_1;")], ...extra]);
const idx = (f: Map<string, string>) => buildIndex(f, { classes });
const AUTHOR = "SkellySpencer";      // 13 characters, last name then first name
const NOW = new Date(2026, 10, 26, 15, 30, 0, 0);
const def = (id: string): F.FlowDef => { const d = F.flowDef(id); assert.ok(d, id); return d!; };
const fill = (d: F.FlowDef, r: F.FlowRecord, key: string): void => {
  const s = F.flowSections(d).find((x) => x.key === key)!;
  for (const b of s.blocks) for (const f of b.fields ?? []) if (f.req && f.kind !== "read" && !(r.vals[f.id] ?? "").trim()) r.vals[f.id] = f.kind === "select" ? (f.opts ?? []).find((o) => o) ?? "x" : "filled";
};

test("eleven flows, each with a unique prefix, a Driving reason first and Files and evidence last", () => {
  const ds = F.flowDefs();
  assert.deepEqual(ds.map((d) => d.id), ["CHG", "NEW", "RDL", "ISS", "REV", "OPT", "SPC", "FWC", "TPL", "TRP", "DOC"]);
  for (const d of ds) {
    const s = F.flowSections(d);
    assert.equal(s[0]!.title, "Driving reason", d.id);
    assert.equal(s[s.length - 1]!.title, "Files and evidence", d.id);
    assert.ok(F.FLOW_GROUPS.includes(d.group as (typeof F.FLOW_GROUPS)[number]), d.id);
    const ids = F.allFields(d).map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length, `${d.id} has a repeated field id`);
    assert.equal(new Set(s.map((x) => x.key)).size, s.length, `${d.id} has a repeated section key`);
    for (const b of d.blocks) {
      if (b.show) assert.ok(["mech", "fw", "asm", "copy"].includes(b.show), `${d.id} show ${b.show}`);
      if (b.src) assert.ok(["whereUsed", "children", "requirements", "issues", "ecoFlows", "verifications"].includes(b.src), `${d.id} src ${b.src}`);
      for (const f of b.fields ?? []) if (f.optsFrom) assert.ok(d.blocks.some((x) => x.id === f.optsFrom!.split(":")[0]), `${d.id} ${f.id} optsFrom`);
    }
  }
});

test("no sample record survives from the prototype (DAT-002): no part numbers, no sample rows outside the template tables", () => {
  const text = JSON.stringify(F.flowDefs());
  assert.doesNotMatch(text, /\b\d{4}-\d{4}\b/);
  assert.doesNotMatch(text, /sidecar|charger control|PosiCharge|Ampure/i, "no product names from the prototype samples");
  const templ = new Set(["CHG:appr", "CHG:docs", "CHG:ready", "NEW:docs", "REV:appr", "ISS:follow"]);
  for (const d of F.flowDefs()) for (const b of d.blocks) if (b.t === "table" && (b.rows ?? []).length) assert.ok(templ.has(`${d.id}:${b.id}`), `${d.id}:${b.id} keeps rows`);
});

test("a Change flow starts on the selected part: fields filled from the note, where-used and identity computed", () => {
  const ix = idx(files()), d = def("CHG");
  const r = F.startFlow(d, ix, "P/ASM-1.md", AUTHOR, NOW, []);
  assert.equal(r.flowId, "CHG-2611-0001");
  assert.equal(r.guid, "20261126153000000" + AUTHOR);
  assert.equal(r.pick, "P/ASM-1.md");
  assert.equal(r.vals["cr.part"], "ASM-1 ASM-1");
  assert.equal(r.vals["cr.rev"], "A01");
  assert.equal(r.vals["p.type"], "Assembly");
  assert.equal(r.vals["p.mb"], "Make");
  assert.equal(F.startFlow(def("NEW"), ix, "P/ASM-1.md", AUTHOR, NOW, []).vals["n.used"], "GSE", "product line comes from businessLine");
  assert.equal(r.base["p.type"], "Assembly", "a filled value is kept as the starting value");
  assert.deepEqual(r.rows["imp"]!.map((x) => x["pn"]), ["TOP-1"]);
  assert.deepEqual(r.rows["bom"]!.map((x) => [x["f"], x["pn"], x["q"]]), [["10", "SCR-1", "1"]]);
  assert.equal(r.rows["appr"]!.length, 5, "discipline rows are templates");
  assert.ok(r.rows["appr"]!.every((x) => x["a"] === ""), "approver names start empty");
  assert.equal(F.dynValue("pn", ix, r, d), "ASM-1");
  assert.equal(F.dynValue("lines", ix, r, d), "GSE");
  assert.equal(F.dynValue("openEco", ix, r, d), "None");
  assert.equal(F.dynValue("flowId", ix, r, d), "CHG-2611-0001");
});

test("groups follow the element type: Material only for mechanical, BOM only for assemblies", () => {
  const ix = idx(files()), d = def("CHG"), r = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []);
  const mech = d.blocks.find((b) => b.show === "mech")!, asm = d.blocks.find((b) => b.show === "asm")!;
  assert.equal(r.vals["p.type"], "Part");
  assert.equal(F.flowShown(d, r, asm), false);
  r.vals["p.sub"] = "mechanical";
  assert.equal(F.flowShown(d, r, mech), true);
  r.vals["p.sub"] = "electrical";
  assert.equal(F.flowShown(d, r, mech), false);
});

test("submit: blocked while a required field is empty; editing afterwards makes it stale; all sections submitted completes the flow", () => {
  const ix = idx(files()), d = def("ISS"), r0 = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []);
  const first = F.submitSection(d, r0, "driving-reason", AUTHOR, NOW);
  assert.ok("error" in first && /Reason type/.test(first.error));
  fill(d, r0, "driving-reason");
  const ok = F.submitSection(d, r0, "driving-reason", AUTHOR, NOW);
  assert.ok("rec" in ok);
  let r = ok.rec;
  const sec = F.flowSections(d).find((s) => s.key === "driving-reason")!;
  assert.equal(F.sectionState(d, r, sec), "submitted");
  r.vals["rs.stmt"] = "changed";
  assert.equal(F.sectionState(d, r, sec), "stale");
  const again = F.submitSection(d, r, "driving-reason", AUTHOR, NOW); assert.ok("rec" in again); r = again.rec;
  assert.deepEqual(r.events.map((e) => e.ev), ["created", "section_submitted", "reopened", "section_submitted"]);
  assert.ok("error" in F.submitSection(d, r, "files-and-evidence", AUTHOR, NOW), "Files and evidence has no Submitted box");
  for (const s of F.flowSections(d).filter(F.submittable)) { fill(d, r, s.key); const x = F.submitSection(d, r, s.key, AUTHOR, NOW); assert.ok("rec" in x, s.key); r = x.rec; }
  assert.equal(r.status, "complete");
  assert.equal(r.events[r.events.length - 1]!.ev, "completed");
});

test("the record note reads back to the same flow, holds only submitted sections as evidence, and is not a model note", () => {
  const f = files(), ix = idx(f), d = def("CHG"), r0 = F.startFlow(d, ix, "P/ASM-1.md", AUTHOR, NOW, []);
  fill(d, r0, "driving-reason"); r0.vals["rs.econo"] = "ECO-0042";
  const s = F.submitSection(d, r0, "driving-reason", AUTHOR, NOW); assert.ok("rec" in s);
  r0.vals["cr.problem"] = "Unsubmitted edit is kept";
  const text = F.renderFlowNote(d, s.rec);
  assert.match(text, /^---\nmdseFlow: CHG\n/);
  assert.match(text, /^flowId: CHG-2611-0001$/m);
  assert.match(text, /^sectionsSubmitted: \["Driving reason"\]$/m);
  assert.match(text, /^## Driving reason$/m);
  assert.doesNotMatch(text, /^## Raise the request$/m, "unsubmitted sections are not evidence");
  assert.match(text, /^## Not yet submitted$/m);
  assert.doesNotMatch(text.split("\n---")[0]!, /^(type|uid):/m);
  const back = F.parseFlowNote(text);
  assert.deepEqual(back, s.rec);
  assert.equal(back!.vals["cr.problem"], "Unsubmitted edit is kept");
  f.set(F.flowPath(s.rec.flowId), text);
  const ix2 = idx(f);
  assert.equal(ix2.notes.has(F.flowPath(s.rec.flowId)), false, "the index skips flow records");
  assert.equal(ix2.notes.size, ix.notes.size);
});

test("numbering, listing and the save plan", () => {
  const f = files(), ix = idx(f), d = def("RDL");
  const a = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []);
  const p1 = F.planSaveFlow(d, a, f);
  assert.deepEqual(p1.problems, []);
  assert.equal(p1.writes[0]!.before, null);
  assert.equal(p1.writes[0]!.path, "_ops/Flows/RDL-2611-0001.md");
  f.set(p1.writes[0]!.path, p1.writes[0]!.after);
  const listed = F.listFlows(f);
  assert.deepEqual(listed.map((x) => x.rec.flowId), ["RDL-2611-0001"]);
  const b = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, listed.map((x) => x.rec));
  assert.equal(b.flowId, "RDL-2611-0002");
  assert.notEqual(b.guid, a.guid, "the GUID is unique even in the same millisecond");
  assert.match(F.planSaveFlow(d, a, f).problems[0]!, /Nothing changed/);
  const clash = { ...b, flowId: a.flowId };
  assert.match(F.planSaveFlow(d, clash, f).problems[0]!, /belongs to another flow/);
  assert.equal(F.nextFlowId("RDL", new Date(2026, 11, 1), listed.map((x) => x.rec)), "RDL-2612-0001", "numbers restart each month");
});

test("firmware: the properties file marks each changed line with its starting value", () => {
  const ix = idx(files()), d = def("FWC"), r = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []);
  assert.equal(r.base["f.version"], "A01");
  r.vals["f.version"] = "A02"; r.vals["f.hw"] = "rev-b, rev-c";
  const y = F.firmwareYaml(d, r);
  assert.deepEqual(y.find((l) => l.line.startsWith("version:")), { line: "version: A02", changed: true, was: "A01" });
  assert.equal(y.find((l) => l.line.startsWith("target_hardware:"))!.line, "target_hardware: [rev-b, rev-c]");
  assert.equal(y.find((l) => l.line.startsWith("bootloader_min:"))!.changed, false);
});

test("options: the selection offers the candidates entered in the table", () => {
  const ix = idx(files()), d = def("OPT"), r = F.startFlow(d, ix, "P/SCR-1.md", AUTHOR, NOW, []);
  const f = F.allFields(d).find((x) => x.id === "s.pick")!;
  r.rows["cand"] = [{ name: "Screw, M4 x 12" }, { name: "" }];
  assert.deepEqual(F.fieldOptions(f, r), ["", "Screw, M4 x 12", "Keep the current part"]);
});

test("Raised by and Tested by are filled with the person's name from their person note", () => {
  const f = files(); f.set("People/Spencer Skelly.md", `---\nname: "Spencer Skelly"\nauthorCode: ${AUTHOR}\ntags: [person]\n---\n# Spencer Skelly\n`);
  const ix = idx(f), host = { files: () => f, author: () => AUTHOR, applyPlan: async () => ({ message: "", undo: async () => "" }) };
  assert.equal(F.authorName(f, AUTHOR), "Spencer Skelly");
  assert.equal(F.authorName(files(), AUTHOR), AUTHOR, "no person note: the code");
  assert.equal(FU.beginFlow("TRP", ix, "P/SCR-1.md", host, NOW), "");
  assert.equal(FU.currentFlow()!.rec.vals["rs.by"], "Spencer Skelly");
  assert.equal(FU.currentFlow()!.rec.vals["u.by"], "Spencer Skelly");
  FU.closeFlow();
});

test("the Flow menu lists the flows by group and the saved records; a flow needs a registered author", () => {
  const f = files(), ix = idx(f), host = { files: () => f, author: () => "", applyPlan: async () => ({ message: "", undo: async () => "" }) };
  const m = FU.flowMenu(f);
  assert.deepEqual(m.start.map((g) => [g.group, g.items.length]), [["Change", 6], ["Define", 3], ["Verify", 2]]);
  assert.deepEqual(m.open, []);
  assert.match(FU.beginFlow("CHG", ix, "P/ASM-1.md", host, NOW), /author code/);
  const ok = FU.beginFlow("CHG", ix, "P/ASM-1.md", { ...host, author: () => AUTHOR }, NOW);
  assert.equal(ok, "");
  assert.equal(FU.currentFlow()!.rec.flowId, "CHG-2611-0001");
  FU.closeFlow();
  assert.equal(FU.currentFlow(), null);
});

test("what counts as a model note matches the index (the plugin skips a rebuild when neither version is one)", () => {
  const f = files(), ix = idx(f);
  for (const [p, t] of f) assert.equal(isGovernedText(t), ix.notes.has(p), p);
  assert.equal(isGovernedText("# Meeting\n\nNotes.\n"), false);
  assert.equal(isGovernedText("---\ntype: Object\n---\n# No uid\n"), false);
  assert.equal(isGovernedText(undefined), false);
  assert.equal(isIndexedPath("_ops/Flows/CHG-2611-0001.md"), true);
  assert.equal(isIndexedPath("99_System/11_Import/Parser Check.md"), false, "99_System still rebuilds as before");
});
