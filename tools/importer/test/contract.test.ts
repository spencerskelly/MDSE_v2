/* Property contract (D-0065): every YAML key a tool writes is in governance/schemas/properties.json, in its order, and a BOM note is named by its part number. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildSyntheticQeax } from "../../../testing/fixtures/synthetic-ea/make_qeax.mjs";
import { runImport } from "../src/run.ts";
import { buildBom, parseDelimited } from "../src/bom.ts";
import { sqliteReader, defaultOptions, ROOT } from "./harness.ts";

const dict = JSON.parse(readFileSync(ROOT + "governance/schemas/properties.json", "utf8")) as { order: string[]; properties: Array<{ name: string; pattern?: string }> };
const known = (k: string): boolean => dict.properties.some((p) => (p.pattern ? new RegExp(p.pattern).test(k) : p.name === k));
const front = (text: string): Array<[string, string]> => { const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ""; return fm.split("\n").filter((l) => /^[A-Za-z]\w*:/.test(l)).map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]); };
const isLinkList = (v: string): boolean => /^\[("\[\[.*?\]\]"(, )?)+\]$/.test(v);
const check = (where: string, files: Array<{ path: string; content: string }>): number => {
  let n = 0;
  for (const f of files) {
    if (!f.path.endsWith(".md") || f.path.startsWith("99_System/") || !/^uid: /m.test(f.content)) continue;
    const kv = front(f.content); n++;
    for (const [k, v] of kv) assert.ok(known(k) || isLinkList(v), `${where}: ${f.path} has property "${k}", which is not in properties.json`);
    const pos = kv.map(([k]) => dict.order.indexOf(k)).filter((i) => i >= 0);
    assert.deepEqual(pos, [...pos].sort((a, b) => a - b), `${where}: ${f.path} has its properties out of order`);
  }
  return n;
};

const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tManufacturer\tManufacturer Part Number";
test("a BOM import writes only properties in the dictionary, in order, and names each note by its part number (MOD-170, MOD-173)", () => {
  const rows = ["A/1#[x]\tA\t01\tASSY\tmake\tR\t1\tB-200\tA\t01\tPART B\tbuy\tR\t\t\t\t\t\t2\tea\tACME\tAC-1", "A/1#[x]\tA\t01\tASSY\tmake\tR\t2\tC-300\tA\t01\tPART C\tbuy\tR\t\t\t\t\t\t1\tea\t\t"];
  const r = buildBom(parseDelimited([HEAD, ...rows].join("\n")), { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-20T10:00:00", authorCode: "x", classes: JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8")), existing: null, pending: [] } as any);
  assert.ok(check("BOM", r.files) >= 3);
  for (const f of r.files.filter((x) => x.path.startsWith("BOM/"))) {
    const pn = JSON.parse(front(f.content).find(([k]) => k === "partNumber")![1]) as string, base = f.path.split("/").pop()!.replace(/\.md$/, "");
    assert.equal(base, pn.replace(/\[/g, "(").replace(/\]/g, ")").replace(/#/g, "no.").replace(/\^/g, "").replace(/[\\/:*?"<>|]/g, "-"), `${f.path}: the file name is the part number made safe`);
  }
  assert.ok(r.files.some((f) => /partNumber: "B-200"/.test(f.content)));
});

test("an EA import writes only properties in the dictionary, in order", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mdse-contract-")), q = join(dir, "syn.qeax"); buildSyntheticQeax(q);
  const rd = sqliteReader(q); try { const res = await runImport(rd, defaultOptions()); assert.ok(check("EA", res.files) > 10); } finally { rd.close(); }
});
