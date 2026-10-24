/* Builds a vault from the importer on the synthetic QEAX, so the Workbench is tested on real importer output. */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSyntheticQeax } from "../../../testing/fixtures/synthetic-ea/make_qeax.mjs";
import { runImport } from "../../importer/src/run.ts";
import { sqliteReader, defaultOptions } from "../../importer/test/harness.ts";
import { safeName } from "../../importer/src/naming.ts";
import classes from "../../core/src/classes.json" with { type: "json" };

export { classes };
export async function importedVault(scale = 0): Promise<Map<string, string>> {
  const dir = mkdtempSync(join(tmpdir(), "mdse-wb-")), f = join(dir, "syn.qeax");
  buildSyntheticQeax(f, { scale });
  const r = sqliteReader(f);
  try {
    const res = await runImport(r, defaultOptions());
    return titleNamed(new Map(res.files.filter((x) => !x.bytes).map((x) => [x.path, x.content])));
  } finally { r.close(); }
}

/** The importer names a note's file by its id (D-0068). Most Workbench tests were written for files named by title, so this renames them back and rewrites the `[[ID|Name]]` links; the id-named layout itself is covered by the importer and display tests. */
function titleNamed(v: Map<string, string>): Map<string, string> {
  const nameOf = (c: string): string => { const m = /^name: (.*)$/m.exec(c.split("\n---")[0] ?? ""); if (!m) return ""; const t = m[1]!.trim(); return t.startsWith('"') ? (JSON.parse(t) as string) : t; };
  const uidOf = (c: string): string => /^uid: (.*)$/m.exec(c)?.[1] ?? "";
  const items = [...v].filter(([p, c]) => !p.startsWith("99_System/") && p.endsWith(".md") && nameOf(c)).sort((a, b) => (uidOf(a[1]) < uidOf(b[1]) ? -1 : 1));
  const taken = new Set([...v.keys()].filter((p) => !items.some((i) => i[0] === p)).map((p) => p.split("/").pop()!.replace(/\.md$/, "").toLowerCase())), ren = new Map<string, string>(), byId = new Map<string, string>();
  for (const [p, c] of items) {
    const base = safeName(nameOf(c)); let n = 1, name = base; while (taken.has(name.toLowerCase())) { n++; name = `${base}~${n}`; } taken.add(name.toLowerCase());
    ren.set(p, p.slice(0, p.lastIndexOf("/") + 1) + name + ".md"); byId.set(p.split("/").pop()!.replace(/\.md$/, ""), name);
  }
  const out = new Map<string, string>();
  for (const [p, c] of v) out.set(ren.get(p) ?? p, c.replace(/\[\[([A-Z]+-\d{5})\|[^\]]*\]\]/g, (m, id: string) => (byId.has(id) ? `[[${byId.get(id)}]]` : m)));
  return out;
}
