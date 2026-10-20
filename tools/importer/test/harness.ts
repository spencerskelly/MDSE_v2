/* Test harness: node:sqlite reader that satisfies ReaderLike, default options, and file helpers. */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { ReaderLike, RawRow } from "../src/ea_source.ts";
import type { ImportOptions } from "../src/run.ts";
import { buildBaseVault } from "../../base-vault/src/base_vault.ts";

export function sqliteReader(file: string): ReaderLike & { close(): void } {
  const db = new DatabaseSync(file, { readOnly: true });
  const tables = new Set((db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>).map((r) => r.name));
  return {
    has: (t) => tables.has(t),
    async *scan(t): AsyncGenerator<RawRow> { for (const r of db.prepare(`SELECT * FROM ${t}`).iterate()) yield r as RawRow; },
    close: () => db.close(),
  };
}
const json = (p: string): any => JSON.parse(readFileSync(new URL(`../../../${p}`, import.meta.url), "utf8"));
export const ROOT = new URL("../../../", import.meta.url).pathname;

export function defaultOptions(over: Partial<ImportOptions> = {}): ImportOptions {
  const classes = json("tools/core/src/classes.json");
  return {
    sourceName: "synthetic.qeax", fingerprint: "0".repeat(64), runDate: "2026-10-19T12:00:00", lineage: "SYN-1",
    authors: { authorMap: {}, fallbackCode: "skellyspencer", unmappedNames: ["", "7.1.0-2"] },
    omitRootPackages: ["Model", "IPC !"], vaultName: "Test Vault", releaseVersion: "0.0.0-dev", classes,
    mapping: json("governance/schemas/ea-family-mapping.json"),
    baseFiles: buildBaseVault({ root: ROOT, release: "0.0.0-dev", classes }),
    existing: null, preApproved: [], emitNative: true, ...over,
  };
}
