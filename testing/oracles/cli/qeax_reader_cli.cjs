// Dump every row of a table through the browser SQLite reader, using a File-like shim. Test helper only.
const fs = require("fs"), path = require("path");
const { SQLiteReader } = require(path.join(__dirname, "../../../tools/importer/src/qeax_reader.js"));
(async () => {
  const [db, ...tables] = process.argv.slice(2), buf = fs.readFileSync(db);
  const file = { size: buf.length, slice: (a, b) => ({ arrayBuffer: async () => buf.buffer.slice(buf.byteOffset + a, buf.byteOffset + b) }) };
  const r = await SQLiteReader.open(file); await r.loadSchema();
  const out = {};
  for (const t of tables) { out[t] = []; for await (const row of r.scan(t)) out[t].push(row); }
  console.log(JSON.stringify(out, (k, v) => typeof v === "bigint" ? Number(v) : v));
})().catch((e) => { console.error(e.message); process.exit(1); });
