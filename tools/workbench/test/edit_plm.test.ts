import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildIndex } from "../src/index.ts";
import * as P from "../src/edit_plm.ts";
import { classes } from "./harness.ts";

const props = JSON.parse(readFileSync(new URL("../../../governance/schemas/properties.json", import.meta.url), "utf8")) as { properties: Array<{ name: string; values?: string[] }> };
const fm = (o: Record<string, string>): string => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const note = (o: Record<string, string>, title: string, sysml = ""): string => `---\n${fm(o)}\n---\n# ${title}\n${sysml ? `\n## SysML v2\n\n\`\`\`sysml\n${sysml}\n\`\`\`\n` : ""}`;
const part = (id: string, pn: string, extra: Record<string, string> = {}): string => note({ type: "Object", subtype: "part", id, uid: "u" + id, status: "Draft", partNumber: pn, bomCategory: "Fasteners", bomRole: "part", ...extra }, "Screw " + pn, `package ${id.replace("-", "_")} {\n part def P_${pn} {\n }\n}`);
const elem = note({ type: "Object", subtype: "part", id: "OBJ-00001", uid: "u1", status: "Draft", name: "Power Module" }, "Power Module");
const doc = note({ type: "Info", subtype: "note", id: "INF-00001", uid: "u2", status: "Draft" }, "Wiring note");
const files = (): Map<string, string> => new Map([["BOM/Parts/Part/Fasteners/SCR-1.md", part("OBJ-00010", "SCR-1", { level: "part" })], ["BOM/Parts/Part/Fasteners/SCR-2.md", part("OBJ-00011", "SCR-2")], ["M/Power Module.md", elem], ["M/Wiring note.md", doc]]);
const idx = (f: Map<string, string>) => buildIndex(f, { classes });

test("the governed lists in the Workbench equal properties.json (D-0124)", () => {
  for (const k of P.PLM_FIELDS) assert.deepEqual(P.PLM_LISTS[k], props.properties.find((p) => p.name === k)!.values, k);
});

test("plmSetYaml adds a field in the part group's order, replaces it, removes it and keeps CRLF", () => {
  const t = part("OBJ-00010", "SCR-1");
  let x = P.plmSetYaml(t, "level", "part"); x = P.plmSetYaml(x, "businessLine", "IPC"); x = P.plmSetYaml(x, "makeBuy", "buy");
  const keys = /^---\n([\s\S]*?)\n---/.exec(x)![1]!.split("\n").map((l) => l.split(":")[0]);
  assert.deepEqual(keys.slice(-4), ["level", "makeBuy", "businessLine"].length === 3 ? ["bomRole", "level", "makeBuy", "businessLine"] : [], "level, makeBuy, businessLine follow bomRole in the properties.json order");
  assert.match(P.plmSetYaml(x, "makeBuy", "make"), /^makeBuy: make$/m);
  assert.doesNotMatch(P.plmSetYaml(x, "makeBuy", null), /makeBuy/);
  const crlf = P.plmSetYaml(t.replace(/\n/g, "\r\n"), "level", "part");
  assert.ok(crlf.includes("level: part\r\n") && !/[^\r]\n/.test(crlf), "line endings kept");
  assert.equal(P.plmSetYaml("no front matter", "level", "part"), "no front matter");
});

test("planSetPartFields sets governed values on a part and refuses the rest", () => {
  const f = files(), ix = idx(f), scr = "BOM/Parts/Part/Fasteners/SCR-2.md";
  const ok = P.planSetPartFields(ix, f, scr, { level: "part", makeBuy: "buy", sourcing: "standard hardware", businessLine: "IPC" });
  assert.deepEqual(ok.problems, []);
  const after = ok.writes[0]!.after;
  assert.match(after, /^level: part$/m); assert.match(after, /^makeBuy: buy$/m); assert.match(after, /^sourcing: standard hardware$/m); assert.match(after, /^businessLine: IPC$/m);
  assert.match(P.planSetPartFields(ix, f, scr, { makeBuy: "bought" }).problems[0]!, /"bought" is not a makeBuy value/);
  assert.match(P.planSetPartFields(ix, f, "M/Power Module.md", { level: "part" }).problems[0]!, /belongs to a part/);
  assert.deepEqual(P.planSetPartFields(ix, f, "M/Power Module.md", { businessLine: "GSE" }).problems, [], "an element may carry businessLine (MOD-188)");
  assert.match(P.planSetPartFields(ix, f, "BOM/Parts/Part/Fasteners/SCR-1.md", { level: "part" }).problems[0]!, /Nothing changed/);
  const rm = P.planSetPartFields(ix, f, "BOM/Parts/Part/Fasteners/SCR-1.md", { level: "" });
  assert.doesNotMatch(rm.writes[0]!.after, /^level:/m);
});

test("implements: written on the part, sorted, one edge, the stored inverse is not a second edge (MOD-185, MOD-186)", () => {
  const f = files(), ix = idx(f), scr = "BOM/Parts/Part/Fasteners/SCR-1.md";
  const plan = P.planSetLinks(ix, f, scr, "implements", ["M/Power Module.md"]);
  assert.deepEqual(plan.problems, []);
  assert.match(plan.writes[0]!.after, /^implements: \["\[\[Power Module\|Power Module\]\]"\]$/m);
  f.set(scr, plan.writes[0]!.after);
  f.set("M/Power Module.md", P.plmSetYaml(elem, "implementedBy", '["[[SCR-1|Screw SCR-1]]"]'));
  const ix2 = idx(f), e = ix2.edges.filter((x) => x.kind === "implements" || x.kind === "implementedBy");
  assert.equal(e.length, 1, "the part's forward link counts once, even on a note with a SysML block (W14)");
  assert.equal(e[0]!.kind, "implements");
  assert.deepEqual(P.plmSources(ix2, ix2.notes.get("M/Power Module.md")!, "implements").map((n) => n.name), ["SCR-1"]);
  assert.deepEqual(P.plmTargets(ix2, ix2.notes.get(scr)!, "implements").map((n) => n.name), ["Power Module"]);
  const rm = P.planSetLinks(ix2, f, scr, "implements", []);
  assert.doesNotMatch(rm.writes[0]!.after, /implements/);
});

test("planSetLinks refuses what MOD-185 and the note's class do not allow", () => {
  const f = files(), ix = idx(f), scr = "BOM/Parts/Part/Fasteners/SCR-1.md";
  assert.match(P.planSetLinks(ix, f, scr, "implements", ["BOM/Parts/Part/Fasteners/SCR-2.md"]).problems[0]!, /is a part/);
  assert.match(P.planSetLinks(ix, f, scr, "implements", [scr]).problems[0]!, /itself/);
  assert.match(P.planSetLinks(ix, f, "M/Power Module.md", "implements", [scr]).problems[0]!, /Only a part/);
  assert.match(P.planSetLinks(ix, f, scr, "describes", ["M/Power Module.md"]).problems[0]!, /Only an Info/);
  f.set(scr, P.plmSetYaml(f.get(scr)!, "implements", '["[[Missing note|x]]"]'));
  assert.match(P.planSetLinks(idx(f), f, scr, "implements", ["M/Power Module.md"]).problems[0]!, /match no note/, "a link that matches nothing is never dropped silently");
  const d = P.planSetLinks(ix, f, "M/Wiring note.md", "describes", ["M/Power Module.md"]);
  assert.deepEqual(d.problems, []); assert.match(d.writes[0]!.after, /^describes: \["\[\[Power Module\|Power Module\]\]"\]$/m);
});

test("candidates for implements are elements, not parts or documents", () => {
  const ix = idx(files()), scr = ix.notes.get("BOM/Parts/Part/Fasteners/SCR-1.md")!;
  assert.deepEqual(P.plmCandidates(ix, scr, "implements", "").map((n) => n.name), ["Power Module"]);
  assert.deepEqual(P.plmCandidates(ix, scr, "implements", "nothing like it"), []);
});

test("revision chain: part number note first, revisions in BOM-018 order, placeholders lowest, and what changed (D-0129)", () => {
  assert.ok(P.plmRevRank("A01") < P.plmRevRank("B02") && P.plmRevRank("B02") < P.plmRevRank("B03") && P.plmRevRank("B03") < P.plmRevRank("C04"));
  for (const p of ["-099", "_99", "Z99", "", "B2"]) assert.equal(P.plmRevRank(p), -1, p);
  const rev = (id: string, r: string, desc: string, extra: Record<string, string>, body: string): string => note({ type: "Object", subtype: "part", id, uid: "u" + id, status: "Draft", partNumber: "ASM-1", revision: r, description: desc, ...extra }, "ASM-1 " + r.slice(0, 1), `package ${id.replace("-", "_")} {\n part def P_ASM_1_${r.slice(0, 1)} {\n${body}\n }\n}`);
  const f = new Map<string, string>([
    ["P/SCR-1.md", part("OBJ-00010", "SCR-1")], ["P/SCR-2.md", part("OBJ-00011", "SCR-2")],
    ["P/ASM-1.md", note({ type: "Object", subtype: "part", id: "OBJ-00020", uid: "u20", status: "Draft", partNumber: "ASM-1" }, "ASM-1")],
    ["P/ASM-1 C.md", rev("OBJ-00023", "C04", "Cover, black", { manufacturer1: "Acme" }, "  part s1 : P_SCR_1;\n  part s2 : P_SCR_2;")],
    ["P/ASM-1 A.md", rev("OBJ-00021", "A01", "Cover", {}, "  part s1 : P_SCR_1;")],
  ]);
  const ix = idx(f), c = P.plmRevisionChain(ix, ix.notes.get("P/ASM-1.md")!);
  assert.deepEqual(c.map((n) => n.name), ["ASM-1", "ASM-1 A", "ASM-1 C"], "no B note: none is invented");
  const d = P.plmRevDiff(ix, c[1]!, c[2]!);
  assert.deepEqual(d.props, [["description", "Cover", "Cover, black"], ["manufacturer1", "", "Acme"]]);
  assert.equal(d.added.length + d.removed.length + d.changed.length, d.added.length, "one structure line added, none removed");
  assert.equal(d.added.length, 1);
  assert.deepEqual(P.plmRevisionChain(ix, ix.notes.get("P/SCR-1.md")!).map((n) => n.name), ["SCR-1"]);
});
