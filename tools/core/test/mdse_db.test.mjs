import test from "node:test";
import assert from "node:assert/strict";
import { MdseDb } from "../src/mdse_db.ts";
import { loadSqlJsNode } from "../src/sqljs_node.ts";

const SQL = await loadSqlJsNode();
const v1 = { name: "t", version: 1, tables: [
  { name: "items", columns: ["id TEXT PRIMARY KEY", "label TEXT"] },
  { name: "drafts", kept: true, columns: ["id TEXT PRIMARY KEY", "json TEXT", "gone TEXT"] }] };
const v2 = { name: "t", version: 2, tables: [
  { name: "items", columns: ["id TEXT PRIMARY KEY", "label TEXT", "extra TEXT"] },
  { name: "drafts", kept: true, columns: ["id TEXT PRIMARY KEY", "json TEXT", "saved_at TEXT"] }] };

test("a new file has the schema and round-trips through its bytes", () => {
  const db = new MdseDb(SQL, v1);
  assert.equal(db.opened, "new");
  db.put("items", { id: "a", label: "A" });
  const bytes = db.export();
  assert.equal(db.dirty, false);
  const again = new MdseDb(SQL, v1, bytes);
  assert.equal(again.opened, "opened");
  assert.deepEqual(again.all("SELECT * FROM items"), [{ id: "a", label: "A" }]);
  assert.equal(again.meta("schema_version"), "1");
});

test("a new schema version keeps the kept rows for the columns that still exist and drops derived rows", () => {
  const db = new MdseDb(SQL, v1);
  db.put("items", { id: "a", label: "A" });
  db.put("drafts", { id: "d1", json: "{}", gone: "x" });
  const m = new MdseDb(SQL, v2, db.export());
  assert.equal(m.opened, "migrated");
  assert.deepEqual(m.all("SELECT * FROM items"), []);
  assert.deepEqual(m.all("SELECT * FROM drafts"), [{ id: "d1", json: "{}", saved_at: null }]);
  assert.equal(m.meta("schema_version"), "2");
});

test("an unreadable file is replaced, not trusted", () => {
  const db = new MdseDb(SQL, v1, new TextEncoder().encode("not a database"));
  assert.equal(db.opened, "reset");
  assert.deepEqual(db.all("SELECT * FROM items"), []);
});

test("transactions roll back as a whole; clearDerived leaves kept tables alone", () => {
  const db = new MdseDb(SQL, v1);
  db.put("drafts", { id: "d", json: "{}" });
  assert.throws(() => db.tx(() => { db.put("items", { id: "x", label: "X" }); throw new Error("stop"); }));
  assert.deepEqual(db.all("SELECT * FROM items"), []);
  db.put("items", { id: "y", label: "Y" });
  db.clearDerived();
  assert.equal(db.all("SELECT * FROM items").length, 0);
  assert.equal(db.all("SELECT * FROM drafts").length, 1);
});
