import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scanSysml } from "../src/sysml_scan.ts";
import { classify } from "../src/sysml_lang.ts";

const catalog = JSON.parse(readFileSync(new URL("../../../governance/language/catalog.json", import.meta.url), "utf8")) as Array<{ id: string; name: string; kind: string; keyword: string; tier: string; example: string; wrap: string; similar: string; description: string; difference: string; from: string[]; to: string[]; category: string; library?: string; recognizedAs?: string[] }>;
const ids = new Set(catalog.map((c) => c.id));

test("catalog: ids are unique, every entry is complete and every 'similar' resolves", () => {
  assert.equal(ids.size, catalog.length);
  for (const c of catalog) {
    assert.ok(c.description.length > 30 && c.difference.length > 20 && c.example && c.keyword, c.id);
    assert.ok(c.from.length && c.to.length, `${c.id}: eligible from/to`);
    assert.ok(ids.has(c.similar) && c.similar !== c.id, `${c.id}: similar ${c.similar}`);
    assert.ok(["core", "common", "occasional", "rare"].includes(c.tier), c.id);
    assert.ok(["language", "library", "pattern"].includes(c.category), `${c.id}: category`);
    assert.equal(c.category === "library", !!c.library, `${c.id}: library field only on library entries`);
    assert.equal(c.category === "pattern", !!c.recognizedAs?.length, `${c.id}: recognizedAs only on pattern entries`);
  }
});

test("the scanner recognizes every example in the catalog as that construct, with no warnings", () => {
  const bad: string[] = [];
  for (const c of catalog) {
    const body = /[;}]\s*$/.test(c.example) ? c.example : c.example + ";";
    const src = c.wrap === "pkg" ? `package P { ${body} }` : `package P { part def Ctx { ${body} } }`;
    const r = scanSysml(src);
    if (r.warnings.length) bad.push(`${c.id}: warnings ${r.warnings.join("; ")}`);
    else if (c.recognizedAs ? !c.recognizedAs.every((id) => r.langs.includes(id) && ids.has(id)) : !r.langs.includes(c.id)) bad.push(`${c.id}: got ${r.langs.join(", ")} for ${c.example}`);
  }
  assert.deepEqual(bad, []);
});

test("classify names the relationship and structure forms inside a declaration", () => {
  assert.deepEqual(classify("abstract part def A :> B"), ["modifiers", "part-def", "specialization"]);
  assert.deepEqual(classify("part x : T[3]"), ["part-usage", "feature-typing", "multiplicity"]);
  assert.ok(classify("attribute :>> p = 30 [kW]").includes("redefinition"));
  assert.ok(classify("port p : ~PowerPort").includes("conjugation"));
});

test("every keyword the SysML v2 grammar defines for a definition is a catalog kind", () => {
  for (const k of ["part", "attribute", "item", "port", "connection", "interface", "allocation", "flow", "occurrence", "individual", "action", "state", "constraint", "requirement", "concern", "calc", "case", "analysis", "verification", "use-case", "view", "viewpoint", "rendering", "metadata", "enum"]) {
    assert.ok(ids.has(`${k}-def`) && ids.has(`${k}-usage`), k);
  }
});

test("a requirement def's doc comment is captured as its text (IMP-097)", () => {
  const r = scanSysml("package P {\n    requirement def R {\n        doc /* The charger shall stop at 80 %.\n           Second line. */\n    }\n}\n");
  assert.equal(r.warnings.length, 0);
  assert.equal(r.defs[0]!.doc, "The charger shall stop at 80 %.\nSecond line.");
});

test("transition trigger, guard and effect are read from SysML v2 syntax (IMP-098)", () => {
  const r = scanSysml("package P {\n    state def S {\n        state a;\n        state b;\n        item trig { doc /* Start pressed */ }\n        constraint ok { doc /* voltage ok */ }\n        action fx { doc /* close it */ }\n        transition first a accept trig if ok do fx then b;\n        succession first a if ok then b;\n    }\n}\n");
  assert.deepEqual(r.warnings, []);
  const d = r.defs[0]!, t = d.stmts.find((s) => s.kind === "transition")!;
  assert.deepEqual([t.trigger, t.guard, t.effect], ["trig", "ok", "fx"]);
  assert.equal(d.notes["ok"], "voltage ok");
  assert.equal(d.stmts.find((s) => s.kind === "succession")!.guard, "ok");
});

test("a conditional succession is told apart from a simple one, and library concepts are named by their tag", () => {
  assert.deepEqual(classify("succession first a then b"), ["succession"]);
  assert.deepEqual(classify("succession first a if ok then b"), ["conditional-succession"]);
  assert.ok(classify("#derivation connection d").includes("derivation-connection"));
  assert.ok(classify("#causation connection c").includes("causation-connection"));
  assert.ok(classify("@Rationale { text = \"x\"; }").includes("rationale-metadata"));
  assert.ok(classify("attribute p : ISQ::PowerValue = 30 [SI::kW]").includes("quantity-unit"));
  assert.ok(classify("return verdict : VerdictKind").includes("verdict-kind"));
});
