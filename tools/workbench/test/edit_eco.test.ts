import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import * as E from "../src/edit_eco.ts";
import { classes } from "./harness.ts";

const fm = (o: Record<string, string>): string => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const note = (o: Record<string, string>, title: string, sysml = ""): string => `---\n${fm(o)}\n---\n# ${title}\n${sysml ? `\n## SysML v2\n\n\`\`\`sysml\n${sysml}\n\`\`\`\n` : ""}`;
const part = (id: string, pn: string, body = "", extra: Record<string, string> = {}): string => note({ type: "Object", subtype: "part", id, uid: "u" + id, status: "Draft", partNumber: pn, revision: "A01", sourceRole: "authoritative-model", primarySymbol: `${id.replace("-", "_")}::P_${pn.replace("-", "_")}`, ...extra }, pn, `package ${id.replace("-", "_")} {\n part def ${"P_" + pn.replace("-", "_")} {\n${body}\n }\n}`);
const elem = note({ type: "Object", subtype: "part", id: "OBJ-00001", uid: "u1", status: "Draft", name: "Power Module" }, "Power Module");
const files = (extra: [string, string][] = []): Map<string, string> => new Map<string, string>([
  ["P/SCR-1.md", part("OBJ-00010", "SCR-1", "", { implements: '["[[Power Module|Power Module]]"]' })],
  ["P/ASM-1.md", part("OBJ-00011", "ASM-1", "  part s : OBJ_00010::P_SCR_1;")],
  ["P/TOP-1.md", part("OBJ-00012", "TOP-1", "  part a : OBJ_00011::P_ASM_1;")],
  ["M/Power Module.md", elem], ...extra]);
const idx = (f: Map<string, string>) => buildIndex(f, { classes });
const input = (o: Partial<E.EcoInput> = {}): E.EcoInput => ({ reason: "Screw too short", description: "Change SCR-1 to a longer screw.\nCheck torque.", owner: "SKY", ecrDate: "2026-11-05", jiraUrl: "https://example.atlassian.net/browse/ENG-42", items: [{ path: "P/SCR-1.md", action: "alter-cl1", to: "B02", person: "SKY" }], folder: "Changes", author: "SKY", now: new Date("2026-11-05T12:00:00Z"), ...o });

test("impact: every assembly above the items, once, shallowest depth first, with the items under it", () => {
  const r = E.ecoImpact(idx(files()), ["P/SCR-1.md"]);
  assert.deepEqual(r.map((x) => [x.partNumber, x.depth, x.via]), [["ASM-1", 1, ["P/SCR-1.md"]], ["TOP-1", 2, ["P/SCR-1.md"]]]);
});

test("the ECO note holds the six fields, a sorted drives list, and a table naming the responsible person (D-0131)", () => {
  const f = files(), plan = E.planCreateEco(idx(f), classes, input());
  assert.deepEqual(plan.problems, []);
  const w = plan.writes[0]!;
  assert.equal(w.before, null);
  assert.match(w.path, /^Changes\/ECO-00001\.md$/);
  for (const re of [/^type: Info$/m, /^subtype: change$/m, /^reason: Screw too short$/m, /^owner: SKY$/m, /^ecrDate: 2026-11-05$/m, /^jiraKey: ENG-42$/m, /^jiraUrl: "https:\/\/example\.atlassian\.net\/browse\/ENG-42"$/m, /^drives: \["\[\[SCR-1\|SCR-1\]\]"\]$/m, /^## Description$/m, /Check torque\./, /\| \[\[SCR-1\|SCR-1\]\] \| Alter \(CL1\) \| A01 \| B02 \| SKY \|/])
    assert.match(w.after, re, String(re));
  f.set(w.path, w.after);
  const ix = idx(f), eco = ix.notes.get(w.path)!;
  assert.deepEqual(E.ecoDrives(ix, eco).map((n) => n.path), ["P/SCR-1.md"], "the index reads drives back");
});

test("refusals: missing fields, bad date or link, no key, no item, no person, a note that is not a part, a duplicate", () => {
  const ix = idx(files()), p = (o: Partial<E.EcoInput>): string => E.planCreateEco(ix, classes, input(o)).problems.join(" | ");
  assert.match(p({ reason: " " }), /reason is required/);
  assert.match(p({ description: "" }), /description is required/);
  assert.match(p({ owner: "S K" }), /author code/);
  assert.match(p({ ecrDate: "05/11/2026" }), /YYYY-MM-dd/);
  assert.match(p({ jiraUrl: "ENG-42" }), /must start with http/);
  assert.match(p({ jiraUrl: "https://example.com/x" }), /No Jira key/);
  assert.equal(E.planCreateEco(ix, classes, input({ jiraUrl: "https://example.com/x", jiraKey: "ENG-7" })).problems.length, 0);
  assert.match(p({ items: [] }), /at least one/);
  assert.match(p({ items: [{ path: "P/SCR-1.md", action: "alter-cl1", person: "" }] }), /No responsible person/);
  assert.match(p({ items: [{ path: "M/Power Module.md", action: "alter-cl1", person: "SKY" }] }), /no part number/);
  assert.match(p({ items: [{ path: "P/SCR-1.md", action: "alter-cl1", person: "SKY" }, { path: "P/SCR-1.md", action: "alter-cl2", person: "SKY" }] }), /Listed twice/);
  assert.match(p({ author: "" }), /No author code/);
});

test("GOV-031 in this tree: a part already driven by an unapproved ECO is refused; an approved one is not; no element is a warning", () => {
  const f = files();
  const first = E.planCreateEco(idx(f), classes, input()).writes[0]!;
  f.set(first.path, first.after);
  const ix = idx(f), item = input().items;
  assert.match(E.ecoChecks(ix, item).map((c) => c.text).join("|"), /Already driven by .*ECO-00001.*GOV-031/);
  assert.match(E.planCreateEco(ix, classes, input()).problems.join("|"), /Already driven/);
  f.set(first.path, first.after.replace(/^(jiraUrl: .*)$/m, "$1\napprover: SKY\napprovedOn: 2026-11-06"));
  assert.equal(E.ecoChecks(idx(f), item).filter((c) => c.level === "error").length, 0, "approved = released");
  const noEl = E.ecoChecks(idx(f), [{ path: "P/ASM-1.md", action: "adjust-usage", person: "SKY" }]);
  assert.deepEqual(noEl.map((c) => [c.level, c.text.slice(0, 18)]), [["warn", "Implements no elem"]]);
});
