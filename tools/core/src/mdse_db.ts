/* The local operational database shared by the MDSE tools (D-0170). SQLite compiled to WebAssembly (sql.js 1.17.0,
 * vendored in tools/core/vendor/sqljs), one file per tool per user, never committed and never shared.
 *
 * The vault stays the record (D-0003, D-0169): every table a tool declares `derived` is rebuilt from vault files and can
 * be thrown away; only the tables it declares `kept` (local drafts and similar) hold anything the vault does not. A
 * changed schema version keeps the `kept` rows whose columns still exist and recreates everything else.
 *
 * No UI, no file access: the host gives this module the sql.js engine and the file's bytes, and writes back what
 * `export()` returns. Portable SQL only (TEXT, INTEGER, REAL), so the same tables can move to a server later. */

/** The part of the sql.js API this module uses. */
export interface SqlStatement { run(params?: SqlValue[]): unknown; free(): unknown }
export interface SqlDatabase {
  run(sql: string, params?: SqlValue[]): unknown;
  prepare?(sql: string): SqlStatement;
  exec(sql: string, params?: SqlValue[]): Array<{ columns: string[]; values: SqlValue[][] }>;
  export(): Uint8Array;
  close(): void;
}
export type SqlValue = string | number | null | Uint8Array;
export interface SqlStatic { Database: new (data?: Uint8Array | ArrayLike<number> | null) => SqlDatabase }

export interface DbTable { name: string; columns: string[]; /** column definitions after the names, e.g. "PRIMARY KEY (guid, key)" */ constraints?: string[]; kept?: boolean }
export interface DbSchema { name: string; version: number; tables: DbTable[]; indexes?: string[] }

const colName = (c: string): string => c.trim().split(/\s+/)[0]!;

export class MdseDb {
  private db: SqlDatabase;
  private SQL: SqlStatic;
  readonly schema: DbSchema;
  /** prepared INSERT OR REPLACE statements, reused by put(); freed before export and close (sql.js frees them on export) */
  private stmts = new Map<string, SqlStatement>();
  /** true when the contents changed since the last export */
  dirty = false;
  /** what happened when the file was opened: new, opened, migrated (kept rows carried over), or reset (unreadable file) */
  readonly opened: "new" | "opened" | "migrated" | "reset";

  constructor(SQL: SqlStatic, schema: DbSchema, bytes?: Uint8Array | null) {
    this.SQL = SQL; this.schema = schema;
    let db: SqlDatabase | null = null, opened: MdseDb["opened"] = "new";
    if (bytes && bytes.length) {
      try { db = new SQL.Database(bytes); db.exec("SELECT count(*) FROM sqlite_master"); opened = "opened"; }
      catch { db = null; opened = "reset"; }
    }
    if (db && opened === "opened") {
      const v = MdseDb.metaOf(db, "schema_version"), n = MdseDb.metaOf(db, "schema_name");
      if (n !== schema.name || Number(v) !== schema.version) { db = this.migrate(db); opened = "migrated"; }
    }
    if (!db) { db = new SQL.Database(); this.create(db); this.dirty = true; }
    this.db = db;
    this.opened = opened;
  }

  private static metaOf(db: SqlDatabase, key: string): string | null {
    try { const r = db.exec("SELECT value FROM meta WHERE key = ?", [key]); return (r[0]?.values[0]?.[0] as string | undefined) ?? null; }
    catch { return null; }
  }
  private create(db: SqlDatabase): void {
    db.run("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)");
    for (const t of this.schema.tables) db.run(`CREATE TABLE IF NOT EXISTS ${t.name} (${[...t.columns, ...(t.constraints ?? [])].join(", ")})`);
    for (const i of this.schema.indexes ?? []) db.run(i);
    db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_name', ?), ('schema_version', ?)", [this.schema.name, String(this.schema.version)]);
  }
  /** New file with the current schema; rows of `kept` tables are copied for the columns both versions have. */
  private migrate(old: SqlDatabase): SqlDatabase {
    const fresh = new this.SQL.Database(); this.create(fresh);
    for (const t of this.schema.tables.filter((x) => x.kept)) {
      let r: Array<{ columns: string[]; values: SqlValue[][] }>;
      try { r = old.exec(`SELECT * FROM ${t.name}`); } catch { continue; }
      if (!r[0]) continue;
      const want = t.columns.map(colName), cols = r[0].columns.filter((c) => want.includes(c));
      if (!cols.length) continue;
      const idx = cols.map((c) => r[0]!.columns.indexOf(c));
      for (const row of r[0].values) fresh.run(`INSERT OR REPLACE INTO ${t.name} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, idx.map((i) => row[i] ?? null));
    }
    old.close(); this.dirty = true;
    return fresh;
  }

  /** Rows as objects. */
  all<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []): T[] {
    const r = this.db.exec(sql, params); if (!r[0]) return [];
    const { columns, values } = r[0];
    return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i] ?? null])) as T);
  }
  one<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []): T | null { return this.all<T>(sql, params)[0] ?? null; }
  run(sql: string, params: SqlValue[] = []): void { this.db.run(sql, params); this.dirty = true; }
  /** Insert or replace one row from an object whose keys are column names. */
  put(table: string, row: Record<string, SqlValue | undefined>): void {
    const keys = Object.keys(row).filter((k) => row[k] !== undefined);
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`, params = keys.map((k) => row[k] as SqlValue);
    let st = this.stmts.get(sql);
    if (!st && this.db.prepare) { st = this.db.prepare(sql); this.stmts.set(sql, st); }
    if (st) st.run(params); else this.db.run(sql, params);
    this.dirty = true;
  }
  /** All-or-nothing. */
  tx<T>(fn: () => T): T {
    this.db.run("BEGIN");
    try { const r = fn(); this.db.run("COMMIT"); this.dirty = true; return r; }
    catch (e) { this.db.run("ROLLBACK"); throw e; }
  }
  /** Empty every derived table (before a rebuild from the vault). */
  clearDerived(): void { for (const t of this.schema.tables.filter((x) => !x.kept)) this.db.run(`DELETE FROM ${t.name}`); this.dirty = true; }
  setMeta(key: string, value: string): void { this.put("meta", { key, value }); }
  meta(key: string): string | null { return MdseDb.metaOf(this.db, key); }
  /** The file's bytes, to be written by the host. Clears `dirty`. */
  export(): Uint8Array { this.freeStatements(); const b = this.db.export(); this.dirty = false; return b; }
  close(): void { this.freeStatements(); this.db.close(); }
  private freeStatements(): void { for (const s of this.stmts.values()) { try { s.free(); } catch { /* already freed */ } } this.stmts.clear(); }
}

/** Decode base64 (the WebAssembly binary is embedded in the plugin as text). */
export function base64Bytes(b64: string): Uint8Array {
  const bin = atob(b64); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
