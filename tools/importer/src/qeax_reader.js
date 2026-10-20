/* Streaming read-only SQLite reader for .qeax. Extracted unchanged from the V1 importer v0.8.5 (sqlite.js section)
 * so V2 owns its source; tested by testing/oracles/test_qeax_reader.py. No SQL, no indexes, no writes. */
/* ===================================================================
   sqlite.js — read-only streaming SQLite reader.

   A .qeax is a SQLite database. Loading a 500 MB one through sql.js means
   holding the whole file in an ArrayBuffer and again in the WASM heap, which
   a browser tab will not survive. This reads B-tree pages on demand through
   File.slice() with a small LRU cache, so peak memory is the cache, not the
   file. It also means no CDN and no WASM: the page works offline.

   Only what a full table scan needs is implemented: table B-trees, the record
   format, and overflow chains. No SQL, no indexes, no writes.
   =================================================================== */

const SQLITE_MAGIC = "SQLite format 3\u0000";

class Blocks {
  constructor(file, chunkBits = 20, maxChunks = 192) {
    this.file = file;
    this.size = file.size;
    this.chunkBits = chunkBits;
    this.chunkSize = 1 << chunkBits;
    this.maxChunks = maxChunks;
    this.cache = new Map();
    this.bytesRead = 0;
  }
  async chunk(index) {
    const hit = this.cache.get(index);
    if (hit) {                       // refresh LRU position
      this.cache.delete(index);
      this.cache.set(index, hit);
      return hit;
    }
    const start = index * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.size);
    if (start >= this.size) return new Uint8Array(0);
    const buf = new Uint8Array(await this.file.slice(start, end).arrayBuffer());
    this.bytesRead += buf.length;
    this.cache.set(index, buf);
    if (this.cache.size > this.maxChunks) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return buf;
  }
  async read(offset, length) {
    const first = offset >> this.chunkBits;
    const last = (offset + length - 1) >> this.chunkBits;
    if (first === last) {
      const c = await this.chunk(first);
      const o = offset - (first << this.chunkBits);
      return c.subarray(o, o + length);
    }
    const out = new Uint8Array(length);
    let done = 0;
    for (let i = first; i <= last; i++) {
      const c = await this.chunk(i);
      const base = i << this.chunkBits;
      const from = Math.max(0, offset - base);
      const take = Math.min(c.length - from, length - done);
      if (take <= 0) break;
      out.set(c.subarray(from, from + take), done);
      done += take;
    }
    return out;
  }
}

const be16 = (b, o) => (b[o] << 8) | b[o + 1];
const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

function varint(b, o) {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    const byte = b[o + i];
    value = (value << 7n) | BigInt(byte & 0x7f);
    if (!(byte & 0x80)) return [value, i + 1];
  }
  value = (value << 8n) | BigInt(b[o + 8]);
  return [BigInt.asIntN(64, value), 9];
}
const varintNum = (b, o) => { const [v, n] = varint(b, o); return [Number(v), n]; };

class SQLiteReader {
  constructor(blocks) { this.blocks = blocks; }

  static async open(file) {
    const blocks = new Blocks(file);
    const head = await blocks.read(0, 100);
    let magic = "";
    for (let i = 0; i < 16; i++) magic += String.fromCharCode(head[i]);
    if (magic !== SQLITE_MAGIC) {
      throw new Error(
        "This file is not a SQLite database. Enterprise Architect .eap and " +
        ".eapx files are not — use Project Transfer in EA to produce a .qea " +
        "or .qeax first.");
    }
    const r = new SQLiteReader(blocks);
    r.pageSize = be16(head, 16) === 1 ? 65536 : be16(head, 16);
    r.reserved = head[20];
    r.usable = r.pageSize - r.reserved;
    r.encoding = be32(head, 56) || 1;
    r.pageCount = Math.floor(blocks.size / r.pageSize);
    r.writeVersion = head[18];
    r.walMode = head[18] === 2 || head[19] === 2;
    r.decoder = new TextDecoder(r.encoding === 2 ? "utf-16le"
      : r.encoding === 3 ? "utf-16be" : "utf-8", { fatal: false });
    r.maxLocal = r.usable - 35;
    r.minLocal = (((r.usable - 12) * 32 / 255) | 0) - 23;
    await r.loadSchema();
    return r;
  }

  page(n) { return this.blocks.read((n - 1) * this.pageSize, this.pageSize); }

  /* ---- record format ------------------------------------------------ */
  decodeRecord(payload, columns, want, rowid) {
    const [headerSize, hsLen] = varintNum(payload, 0);
    const serials = [];
    let p = hsLen;
    while (p < headerSize) {
      const [s, n] = varintNum(payload, p);
      serials.push(s);
      p += n;
    }
    const out = {};
    let body = headerSize;
    for (let i = 0; i < serials.length; i++) {
      const s = serials[i];
      const name = columns[i];
      let size = 0;
      if (s === 0 || s === 8 || s === 9) size = 0;
      else if (s <= 4) size = s;
      else if (s === 5) size = 6;
      else if (s === 6 || s === 7) size = 8;
      else size = ((s - (s % 2 === 0 ? 12 : 13)) / 2) | 0;

      if (name && (!want || want.has(name))) {
        out[name] = this.decodeValue(s, payload, body, size);
      }
      body += size;
    }
    // An INTEGER PRIMARY KEY column is stored as NULL; its value is the rowid.
    const alias = this.rowidAlias;
    if (alias && rowid !== undefined && (out[alias] === null || out[alias] === undefined)
        && (!want || want.has(alias))) {
      out[alias] = rowid;
    }
    return out;
  }

  decodeValue(serial, b, o, size) {
    switch (serial) {
      case 0: return null;
      case 8: return 0;
      case 9: return 1;
      case 7: return new DataView(b.buffer, b.byteOffset + o, 8).getFloat64(0);
      default: break;
    }
    if (serial >= 1 && serial <= 6) {
      let v = 0n;
      for (let i = 0; i < size; i++) v = (v << 8n) | BigInt(b[o + i]);
      v = BigInt.asIntN(size * 8, v);
      const n = Number(v);
      return Number.isSafeInteger(n) ? n : v.toString();
    }
    const slice = b.subarray(o, o + size);
    if (serial % 2 === 1) return this.decoder.decode(slice);   // text
    return slice;                                              // blob
  }

  /* ---- payload assembly, following overflow chains ------------------ */
  async payload(pageBytes, cellOffset) {
    let p = cellOffset;
    const [total, n1] = varintNum(pageBytes, p); p += n1;
    const [rowid, n2] = varintNum(pageBytes, p); p += n2;

    let local = total;
    if (total > this.maxLocal) {
      const k = this.minLocal + ((total - this.minLocal) % (this.usable - 4));
      local = k <= this.maxLocal ? k : this.minLocal;
    }
    if (local === total) {
      return [pageBytes.subarray(p, p + local), rowid];
    }
    const buf = new Uint8Array(total);
    buf.set(pageBytes.subarray(p, p + local), 0);
    let filled = local;
    let next = be32(pageBytes, p + local);
    let guard = 0;
    while (next && filled < total && guard++ < 1e6) {
      const ov = await this.page(next);
      const take = Math.min(this.usable - 4, total - filled);
      buf.set(ov.subarray(4, 4 + take), filled);
      filled += take;
      next = be32(ov, 0);
    }
    return [buf, rowid];
  }

  /* ---- B-tree walk --------------------------------------------------- */
  async *walk(rootPage, columns, want, onPage) {
    const stack = [rootPage];
    const seen = new Set();
    while (stack.length) {
      const pageNo = stack.pop();
      if (!pageNo || pageNo > this.pageCount || seen.has(pageNo)) continue;
      seen.add(pageNo);
      const b = await this.page(pageNo);
      if (onPage) onPage(seen.size);
      const base = pageNo === 1 ? 100 : 0;
      const type = b[base];
      const cells = be16(b, base + 3);
      if (type === 5) {                                   // interior table
        const rightmost = be32(b, base + 8);
        const ptrs = base + 12;
        for (let i = 0; i < cells; i++) {
          const off = be16(b, ptrs + i * 2);
          stack.push(be32(b, off));
        }
        stack.push(rightmost);
      } else if (type === 13) {                           // leaf table
        const ptrs = base + 8;
        for (let i = 0; i < cells; i++) {
          const off = be16(b, ptrs + i * 2);
          if (!off || off >= b.length) continue;
          const [payload, rowid] = await this.payload(b, off);
          yield this.decodeRecord(payload, columns, want, rowid);
        }
      }
      // index pages (2/10) never appear in a table B-tree walk
    }
  }

  /* ---- schema -------------------------------------------------------- */
  async loadSchema() {
    const cols = ["type", "name", "tbl_name", "rootpage", "sql"];
    this.tables = new Map();
    for await (const row of this.walk(1, cols, new Set(cols))) {
      if (row.type !== "table" || !row.name) continue;
      const parsed = parseColumns(row.sql || "");
      this.tables.set(String(row.name).toLowerCase(), {
        name: row.name, rootpage: Number(row.rootpage) || 0,
        columns: parsed.columns, rowidAlias: parsed.rowidAlias, sql: row.sql || "",
      });
    }
  }

  has(table) { return this.tables.has(table.toLowerCase()); }

  /**
   * Full scan of one table, yielding a plain object per row with every
   * column present. `want` no longer filters what gets decoded — an earlier
   * version selected a column subset as a memory optimisation, but that is
   * exactly the kind of logic that can go quietly wrong for one particular
   * real-world column combination without ever failing a synthetic test.
   * Decoding every column costs a little more time and memory and removes
   * an entire class of risk in exchange, which is the right trade here.
   */
  async *scan(table, want, onProgress) {
    const t = this.tables.get(table.toLowerCase());
    if (!t || !t.rootpage) return;
    this.rowidAlias = t.rowidAlias;
    yield* this.walk(t.rootpage, t.columns, null, onProgress);
  }

  /**
   * Row count and true column list per table, from structure alone. Nothing
   * here decodes a record or follows an overflow chain, so it is safe and
   * fast to run against the whole file before committing to a full import.
   */
  async diagnose(tableNames, onTable) {
    const out = [];
    for (const name of tableNames) {
      const t = this.tables.get(name.toLowerCase());
      if (!t) { out.push({ name, present: false }); continue; }
      let rows = 0, leafPages = 0, interiorPages = 0, maxDepthSeen = 0, error = null;
      const stack = [[t.rootpage, 1]];
      const seen = new Set();
      try {
        while (stack.length) {
          const [pageNo, depth] = stack.pop();
          if (!pageNo || pageNo > this.pageCount || seen.has(pageNo)) continue;
          seen.add(pageNo);
          if (depth > maxDepthSeen) maxDepthSeen = depth;
          const b = await this.page(pageNo);
          const base = pageNo === 1 ? 100 : 0;
          const type = b[base];
          const cells = be16(b, base + 3);
          if (type === 5) {
            interiorPages++;
            const rightmost = be32(b, base + 8);
            const ptrs = base + 12;
            for (let i = 0; i < cells; i++) stack.push([be32(b, be16(b, ptrs + i * 2)), depth + 1]);
            stack.push([rightmost, depth + 1]);
          } else if (type === 13) {
            leafPages++;
            rows += cells;
          } else if (type !== 2 && type !== 10) {
            error = `page ${pageNo} has an unrecognised type byte (${type}) — file may not be a plain rowid table`;
            break;
          }
        }
      } catch (e) { error = e.message; }
      out.push({ name: t.name, present: true, rootpage: t.rootpage, rows, leafPages,
        interiorPages, depth: maxDepthSeen, columns: t.columns, rowidAlias: t.rowidAlias, error,
        sql: t.sql });
      if (onTable) onTable(t.name, rows);
    }
    return out;
  }

  stats() {
    return { pageSize: this.pageSize, pages: this.pageCount,
             bytesRead: this.blocks.bytesRead, wal: this.walMode,
             tables: this.tables.size };
  }
}

/**
 * Column names from a CREATE TABLE statement, in declaration order, plus the
 * INTEGER PRIMARY KEY column if there is one — SQLite stores that column as
 * NULL in the record and its real value is the rowid.
 */
function stripSqlComments(sql) {
  // Strip -- line comments and /* block */ comments outside quoted strings.
  // EA's generated schema documents columns this way, and a comment sitting
  // between a comma and the next column keyword otherwise breaks the
  // identifier match for that next column, silently nulling its name.
  let out = "", quote = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote && sql[i + 1] === quote) { out += sql[++i]; }
      else if (ch === quote) { quote = null; }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`" || ch === "[") {
      quote = ch === "[" ? "]" : ch;
      out += ch;
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      const nl = sql.indexOf("\n", i);
      out += " ";                       // preserve the split point, drop the text
      i = nl < 0 ? sql.length : nl - 1;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      out += " ";
      i = end < 0 ? sql.length : end + 1;
      continue;
    }
    out += ch;
  }
  return out;
}

function parseColumns(rawSql) {
  const sql = stripSqlComments(rawSql);
  const open = sql.indexOf("(");
  const close = sql.lastIndexOf(")");
  if (open < 0 || close < open) return { columns: [], rowidAlias: null };
  const body = sql.slice(open + 1, close);
  const parts = [];
  let depth = 0, cur = "", quote = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      cur += ch;
      // doubled quote char is an escaped quote, not the closing one
      if (ch === quote && body[i + 1] === quote) { cur += body[++i]; }
      else if (ch === quote) { quote = null; }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`" || ch === "[") {
      quote = ch === "[" ? "]" : ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; }
    else cur += ch;
  }
  parts.push(cur);
  const skip = /^\s*(constraint|primary|unique|foreign|check)\b/i;
  const typeOf = {};
  const out = [];
  let rowidAlias = null;
  const tableLevelPk = [];   // resolved after the loop, once every type is known
  for (const p of parts) {
    if (skip.test(p)) {
      // A single-column PRIMARY KEY declared as its own constraint — inline
      // ("Constraint pk primary key" on the column) or trailing
      // ("CONSTRAINT pk PRIMARY KEY (Object_ID)") — makes that column a
      // rowid alias exactly like "col INTEGER PRIMARY KEY" does. Missing
      // this case leaves the column NULL in every decoded row, because
      // SQLite always stores it that way once it qualifies, regardless of
      // which syntax declared it.
      const pk = /\bprimary\s+key\s*\(([^)]+)\)/i.exec(p);
      if (pk) {
        const cols = pk[1].split(",").map(s => s.replace(/["'`[\]]/g, "").trim()).filter(Boolean);
        if (cols.length === 1) tableLevelPk.push(cols[0]);
      }
      continue;
    }
    const m = /^\s*(?:\[([^\]]+)\]|"([^"]+)"|`([^`]+)`|([A-Za-z_][\w$]*))/.exec(p);
    const name = m ? (m[1] || m[2] || m[3] || m[4]) : null;
    out.push(name);
    if (name) {
      typeOf[name.toLowerCase()] = p;
      // "col INTEGER PRIMARY KEY" makes col a rowid alias — but real DDL
      // routinely puts other constraints between the type and PRIMARY KEY
      // ("INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT" is exactly EA's own
      // schema), so the type and the PRIMARY KEY phrase must be checked
      // independently rather than requiring them adjacent. "PRIMARY KEY DESC"
      // is the one documented SQLite exception that does NOT alias the rowid.
      const afterName = p.slice(m[0].length);
      const isIntegerType = /^\s+integer\b(?!\w)/i.test(afterName);
      const pk = /\bprimary\s+key\b(\s+(asc|desc))?/i.exec(p);
      if (isIntegerType && pk && !/desc/i.test(pk[2] || "")) rowidAlias = name;
    }
  }
  if (!rowidAlias) {
    for (const colName of tableLevelPk) {
      const def = typeOf[colName.toLowerCase()];
      // Only bare INTEGER qualifies for rowid aliasing; INTEGER(n), TEXT,
      // etc. do not, so check the type token directly rather than assuming.
      if (def && /^\s*(?:\[[^\]]+\]|"[^"]+"|`[^`]+`|[A-Za-z_][\w$]*)\s+integer\b(?!\w)/i.test(def)) {
        const real = out.find(c => c && c.toLowerCase() === colName.toLowerCase());
        if (real) { rowidAlias = real; break; }
      }
    }
  }
  return { columns: out, rowidAlias };
}

if (typeof module !== "undefined") module.exports = { SQLiteReader, Blocks };
