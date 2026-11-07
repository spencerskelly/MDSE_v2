/* D-0137, BOM-066: many BOMs, each adds data and removes none. Rehearsal: a first BOM builds the vault, a second BOM goes on top through the update scan. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBom, parseDelimited } from "../src/bom.ts";
import { scanBomUpdate, applyBomUpdate } from "../src/bom_update.ts";
import { ROOT } from "./harness.ts";

const classes = JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8"));
const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2";
type R = { p: string; pc1: string; pc2: string; pn?: string; line: string; c: string; cc1: string; cc2: string; cn: string; q?: string };
const row = (r: R): string => [r.p, r.pc1, r.pc2, r.pn ?? "ASM " + r.p, "make", "P", r.line, r.c, r.cc1, r.cc2, r.cn, "buy", "P", "", "", "", "", "", r.q ?? "1", "ea", "x"].join("\t");
const bomText = (rows: R[]): string => [HEAD, ...rows.map(row)].join("\n");
const o = (existing: Map<string, string> | null, extra: object = {}) => ({ sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-01T10:00:00", authorCode: "skellyspencer", classes, existing: existing ? { hasVault: true, files: existing } : null, pending: [] as Array<[string, string]>, revisionNotes: true, ...extra });
const vaultFrom = (rows: R[]): Map<string, string> => new Map(buildBom(parseDelimited(bomText(rows)), o(null) as never).files.filter((f) => f.path.startsWith("BOM/")).map((f) => [f.path, f.content]));
const find = (v: Map<string, string>, name: string): string => v.get([...v.keys()].find((k) => k.endsWith("/" + name + ".md"))!)!;
const FIRST: R[] = [
  { p: "ASM-1", pc1: "A", pc2: "01", line: "1", c: "SCR-1", cc1: "A", cc2: "01", cn: "SCREW M3", q: "4" },
  { p: "ASM-1", pc1: "A", pc2: "01", line: "2", c: "NUT-1", cc1: "A", cc2: "01", cn: "NUT M3", q: "4" },
];
const apply = (v: Map<string, string>, rows: R[], pick: (i: { kind: string }) => boolean = (i) => i.kind === "add") => {
  const s = scanBomUpdate(parseDelimited(bomText(rows)), o(v, { sourceName: "bom2.tsv", runDate: "2026-11-02T09:00:00" }) as never);
  const r = applyBomUpdate(s, { approved: new Set(s.items.filter(pick).map((i) => i.id)), sourceName: "bom2.tsv", runDate: "2026-11-02T09:00:00" });
  const next = new Map(v); for (const w of r.writes) if (w.path.startsWith("BOM/")) next.set(w.path, w.content);
  return { s, r, next };
};

test("the same BOM again finds nothing to change", () => {
  const v = vaultFrom(FIRST), s = scanBomUpdate(parseDelimited(bomText(FIRST)), o(v) as never);
  assert.deepEqual(s.items.map((i) => `${i.category} ${i.summary}`), []);
});

test("a new CL2 value for a CL1 the vault has is added to that note, with a section for each value; nothing is lost (BOM-066)", () => {
  const v = vaultFrom(FIRST), second: R[] = [
    { p: "ASM-1", pc1: "A", pc2: "02", line: "1", c: "SCR-1", cc1: "A", cc2: "01", cn: "SCREW M3", q: "4" },
    { p: "ASM-1", pc1: "A", pc2: "02", line: "2", c: "NUT-1", cc1: "A", cc2: "01", cn: "NUT M3", q: "4" },
    { p: "ASM-1", pc1: "A", pc2: "02", line: "3", c: "WSH-1", cc1: "A", cc2: "01", cn: "WASHER 3", q: "8" },
  ];
  const { s, next } = apply(v, second);
  assert.ok(s.items.some((i) => i.category === "NEW_CL2" && /02/.test(i.summary)), "the CL2 value is offered");
  assert.ok(s.items.some((i) => i.category === "NEW_PART" && /WSH-1/.test(i.summary)), "the new washer part is offered");
  const note = find(next, "ASM-1 A");
  assert.match(note, /^### CL2 01$/m); assert.match(note, /^### CL2 02$/m);
  assert.match(note, /^revision: "?A02"?$/m, "the revision becomes the highest label");
  assert.match(note, /line = 3;/, "the new line is added");
  assert.match(note, /line = 1;/); assert.match(note, /line = 2;/);
  assert.match(find(next, "WSH-1"), /partNumber: "WSH-1"/);
  const again = scanBomUpdate(parseDelimited(bomText(second)), o(next, { sourceName: "bom2.tsv", runDate: "2026-11-03T09:00:00" }) as never);
  assert.deepEqual(again.items.filter((i) => i.kind === "add").map((i) => i.summary), [], "after applying, the same BOM adds nothing more");
  const third = scanBomUpdate(parseDelimited(bomText(FIRST)), o(next, { runDate: "2026-11-04T09:00:00" }) as never);
  assert.ok(third.items.every((i) => i.kind !== "add" || i.category === "NEW_PART"), "the first BOM again adds no lines or values back");
});

test("a new CL1 for an existing part number gets its own note; the part number note stays; ids are not reused", () => {
  const v = vaultFrom(FIRST), second: R[] = [{ p: "ASM-1", pc1: "B", pc2: "01", line: "1", c: "SCR-1", cc1: "A", cc2: "01", cn: "SCREW M3", q: "6" }];
  const { s, next } = apply(v, second);
  assert.ok(s.items.some((i) => i.category === "NEW_REVISION" && /ASM-1 B/.test(i.summary)));
  assert.ok(find(next, "ASM-1 B").includes("- BOM revision of: ASM-1"));
  assert.equal(find(next, "ASM-1 A"), find(v, "ASM-1 A"), "the A note is untouched");
  const ids = [...next.values()].map((t) => /^id: (\S+)$/m.exec(t)?.[1]).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, "every note has its own id");
});

test("a value that differs and a line no longer listed are offered, unticked, and never applied by default (D-0137)", () => {
  const v = vaultFrom(FIRST), second: R[] = [{ p: "ASM-1", pc1: "A", pc2: "01", line: "1", c: "SCR-1", cc1: "A", cc2: "01", cn: "SCREW M3", q: "9" }];
  const { s, next } = apply(v, second);
  assert.ok(s.items.some((i) => i.kind === "change" && i.category === "LINE_CHANGED"), "the quantity change is listed");
  assert.ok(s.items.some((i) => i.kind === "remove" && i.category === "LINE_REMOVED"), "the missing line is listed");
  assert.equal(find(next, "ASM-1 A"), find(v, "ASM-1 A"), "only additions were applied, so nothing changed");
});

test("a description the vault lacks is added; the rest of the note stays (BOM-022, BOM-026)", () => {
  const v = vaultFrom(FIRST), key = [...v.keys()].find((k) => k.endsWith("/SCR-1 A.md"))!;
  const stripped = new Map(v); stripped.set(key, v.get(key)!.replace(/^description: .*\n/m, ""));
  const { s, next } = apply(stripped, FIRST);
  assert.ok(s.items.some((i) => i.category === "DESCRIPTION" && i.kind === "add"), "the description is offered");
  assert.match(next.get(key)!, /^description: SCREW M3$/m);
  assert.equal(find(next, "SCR-1"), find(v, "SCR-1"), "the part number note is untouched");
});
