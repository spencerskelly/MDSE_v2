import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBaseVault, allPayloads } from "../../base-vault/src/base_vault.ts";
import { ROOT } from "./harness.ts";

const json = (p: string): any => JSON.parse(readFileSync(`${ROOT}${p}`, "utf8"));
const ROLES = ["director", "manager", "lead", "mechanical", "electrical", "design", "project", "product", "purchasing", "quality", "regulatory", "manufacturing"];

test("MOD-190 / D-0164: the ECO template has every ECO property in schema order, the sections, and the approver and signing-date properties", () => {
  const classes = json("tools/core/src/classes.json"), props = json("governance/schemas/properties.json");
  const files = buildBaseVault({ root: ROOT, release: "0.0.0-dev", classes, plugins: allPayloads(ROOT) });
  const t = files["99_System/05_Templates/Template - ECO.md"]!;
  assert.ok(t, "the template is in the base vault");
  const yaml = /^---\n([\s\S]*?)\n---/.exec(t)![1]!.split("\n"), keys = yaml.map((l) => l.split(":")[0]!);
  assert.deepEqual(keys.slice(0, 7), ["type", "subtype", "id", "uid", "status", "eaType", "tags"]);
  assert.match(t, /^subtype: change$/m);
  const known = new Set<string>(props.properties.map((p: { name: string }) => p.name));
  for (const k of keys.filter((k) => !["type", "subtype", "id", "uid", "status", "eaType", "tags", "drives"].includes(k))) assert.ok(known.has(k), `${k} is a listed property`);
  for (const r of ROLES) { assert.ok(keys.includes(`${r}Approver`) && keys.includes(`${r}ApprovedOn`), `${r} has an approver and a signing date`); assert.ok(!keys.includes(r), "no bare role name"); }
  const order: string[] = props.order, at = keys.filter((k) => order.includes(k)).map((k) => order.indexOf(k));
  assert.deepEqual(at, [...at].sort((a, b) => a - b), "properties keep the order of properties.json");
  for (const k of ["reason", "owner", "ecrDate", "jiraKey", "jiraUrl", "branch", "issuedDate", "approvedOn"]) assert.ok(keys.includes(k), k);
  const heads = [...t.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(heads, ["Description", "Items", "Affected products", "Approvers", "Notes", "Former ids"]);
  assert.match(t, /\| Item \| Action \| From \| To \| Class \| Responsible \| Change description \|/);
  assert.ok(t.endsWith("## Former ids\n"), "ends with Notes and Former ids (MOD-031)");
  for (const r of ROLES) for (const k of [`${r}Approver`, `${r}ApprovedOn`]) assert.ok(known.has(k), `${k} is in properties.json`);
});

test("MOD-189, MOD-191 / D-0165: the base vault has an ECO folder with one example ECO note, fictional and linking nothing", () => {
  const classes = json("tools/core/src/classes.json"), props = json("governance/schemas/properties.json");
  const files = buildBaseVault({ root: ROOT, release: "0.0.0-dev", classes, plugins: allPayloads(ROOT) });
  const ecos = Object.keys(files).filter((p) => p.startsWith("ECO/"));
  assert.deepEqual(ecos, ["ECO/ECO-00001.md"], "one note, named by its id (MOD-170)");
  const t = files["ECO/ECO-00001.md"]!, yaml = /^---\n([\s\S]*?)\n---/.exec(t)![1]!, get = (k: string): string => new RegExp(`^${k}: ?(.*)$`, "m").exec(yaml)?.[1]?.replace(/^"|"$/g, "") ?? "";
  assert.equal(get("type"), "Info"); assert.equal(get("subtype"), "change"); assert.equal(get("id"), "ECO-00001"); assert.match(get("uid"), /^\d{17}[a-z-]{13}$/); assert.equal(get("tags"), "[example]");
  assert.match(t, /Example with fictional data/); assert.ok(!t.includes("[[") && !/^drives:/m.test(t), "no wikilink and no empty drives line, so no unresolved reference");
  assert.match(get("jiraUrl"), /^https:\/\/example\.com\//, "a reserved example domain");
  const known = new Set<string>(props.properties.map((p: { name: string }) => p.name));
  for (const k of yaml.split("\n").map((l) => l.split(":")[0]!).filter((k) => !["type", "subtype", "id", "uid", "status", "eaType", "tags", "drives"].includes(k))) assert.ok(known.has(k), `${k} is a listed property`);
  for (const k of ["owner", "managerApprover", "mechanicalApprover", "qualityApprover"]) assert.match(get(k), /^[a-z]+-+$/, `${k} is a 13-character author code`), assert.equal(get(k).length, 13);
  for (const r of ROLES) { const a = get(`${r}Approver`), d = get(`${r}ApprovedOn`); assert.equal(!!a, !!d, `${r}: a signing date goes with an approver`); if (d) assert.match(d, /^\d{4}-\d{2}-\d{2}$/); }
  assert.ok(files["99_System/05_Templates/Template - ECO.md"], "the template stays beside it");
});
