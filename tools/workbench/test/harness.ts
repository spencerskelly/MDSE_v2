/* Builds a vault from the importer on the synthetic QEAX, so the Workbench is tested on real importer output. */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSyntheticQeax } from "../../../testing/fixtures/synthetic-ea/make_qeax.mjs";
import { runImport } from "../../importer/src/run.ts";
import { sqliteReader, defaultOptions } from "../../importer/test/harness.ts";
import classes from "../../core/src/classes.json" with { type: "json" };

export { classes };
export async function importedVault(scale = 0): Promise<Map<string, string>> {
  const dir = mkdtempSync(join(tmpdir(), "mdse-wb-")), f = join(dir, "syn.qeax");
  buildSyntheticQeax(f, { scale });
  const r = sqliteReader(f);
  try {
    const res = await runImport(r, defaultOptions());
    return new Map(res.files.filter((x) => !x.bytes).map((x) => [x.path, x.content]));
  } finally { r.close(); }
}
