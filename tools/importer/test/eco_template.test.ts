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
  assert.deepEqual(keys.slice(0, 8), ["type", "subtype", "id", "uid", "status", "eaType", "tags"].concat(keys[7]!));
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
