/* XLSX reader for the BOM import. Runs in the browser (DecompressionStream) and in Node 22. No network, no library.
 * Reads: zip directory, workbook sheet names, shared strings WITH rich-text runs (so a struck-out value stays distinguishable),
 * inline strings, cell styles for whole-cell strike-through, cached formula values (formulas are counted, never evaluated).
 * Cell values are returned as the text stored in the file: a number is its stored text, never reformatted. */
"use strict";
(function (root) {
  const dec = new TextDecoder();
  const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

  async function inflateRaw(bytes) {
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  /** Map of entry name -> {method, csize, usize, local} from the central directory. */
  function zipDirectory(b) {
    let e = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error("Not an .xlsx file (no zip directory).");
    const count = u16(b, e + 10); let p = u32(b, e + 16); const out = new Map();
    for (let i = 0; i < count; i++) {
      if (u32(b, p) !== 0x02014b50) throw new Error("Damaged zip directory.");
      const method = u16(b, p + 10), csize = u32(b, p + 20), usize = u32(b, p + 24), n = u16(b, p + 28), m = u16(b, p + 30), k = u16(b, p + 32), local = u32(b, p + 42);
      out.set(dec.decode(b.subarray(p + 46, p + 46 + n)), { method, csize, usize, local }); p += 46 + n + m + k;
    }
    return out;
  }
  async function entryBytes(b, ent) {
    const o = ent.local; if (u32(b, o) !== 0x04034b50) throw new Error("Damaged zip entry.");
    const start = o + 30 + u16(b, o + 26) + u16(b, o + 28), raw = b.subarray(start, start + ent.csize);
    if (ent.method === 0) return raw;
    if (ent.method === 8) return inflateRaw(raw);
    throw new Error("Unsupported zip compression " + ent.method);
  }

  const unesc = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, g) => g[0] === "#" ? String.fromCodePoint(g[1] === "x" ? parseInt(g.slice(2), 16) : +g.slice(1)) : ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[g]);
  const strikeOn = (rpr) => /<strike\b(?![^>]*\bval="(?:0|false)")[^>]*\/?>/.test(rpr || "");
  const textOf = (xml) => { let s = ""; for (const m of xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) s += unesc(m[1]); return s; };
  /** <si> or <is> body -> {text, runs:[{t, strike}]}. Phonetic runs (<rPh>) are not part of the value. */
  function richText(xml) {
    const body = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
    const runs = [];
    for (const m of body.matchAll(/<r\b[^>]*>([\s\S]*?)<\/r>/g)) { const pr = /<rPr>([\s\S]*?)<\/rPr>/.exec(m[1]); runs.push({ t: textOf(m[1].replace(/<rPr>[\s\S]*?<\/rPr>/, "")), strike: strikeOn(pr && pr[1]) }); }
    if (!runs.length) return { text: textOf(body), runs: null };
    return { text: runs.map((r) => r.t).join(""), runs };
  }
  const colIndex = (ref) => { let n = 0; for (const ch of /^[A-Z]+/.exec(ref)[0]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const DATE_FMT = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
  const isoDate = (serial) => { const d = new Date(Math.round((serial - 25569) * 86400000)); return isNaN(d) ? String(serial) : d.toISOString().slice(0, 10); };

  /** Reads a workbook. Returns {sheets:[{name, rows:[[cell|null]]}], warnings}. cell = {v, runs, struck, kind}. */
  async function readXlsx(buffer) {
    const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer), dir = zipDirectory(b), warnings = [];
    const text = async (name) => { const e = dir.get(name); return e ? dec.decode(await entryBytes(b, e)) : null; };
    const wb = await text("xl/workbook.xml"); if (!wb) throw new Error("Not an .xlsx workbook (no xl/workbook.xml).");
    const rels = await text("xl/_rels/workbook.xml.rels") || "", target = new Map();
    for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) { const id = /\bId="([^"]*)"/.exec(m[1]), t = /\bTarget="([^"]*)"/.exec(m[1]); if (id && t) target.set(id[1], t[1]); }
    const shared = []; const sst = await text("xl/sharedStrings.xml");
    if (sst) for (const m of sst.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)) shared.push(richText(m[1] || ""));
    // styles: which cell formats use a struck font, which are dates
    const styles = await text("xl/styles.xml"), xfStrike = [], xfDate = [];
    if (styles) {
      const fonts = [...(/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/.exec(styles) || [0, ""])[1].matchAll(/<font\b[^>]*>([\s\S]*?)<\/font>|<font\b[^>]*\/>/g)].map((m) => strikeOn(m[1] || ""));
      const customDate = new Set([...styles.matchAll(/<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)].filter((m) => /[dmy]/i.test(m[2].replace(/"[^"]*"|\[[^\]]*\]|\\./g, "")) && !/[hs]/i.test(m[2].replace(/"[^"]*"/g, "")) ).map((m) => +m[1]));
      for (const m of (/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles) || [0, ""])[1].matchAll(/<xf\b([^>]*)\/?>/g)) {
        const f = /fontId="(\d+)"/.exec(m[1]), n = /numFmtId="(\d+)"/.exec(m[1]);
        xfStrike.push(!!(f && fonts[+f[1]])); xfDate.push(!!(n && (DATE_FMT.has(+n[1]) || customDate.has(+n[1]))));
      }
    }
    const sheets = []; let formulas = 0, hidden = 0;
    for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
      const name = unesc((/\bname="([^"]*)"/.exec(m[1]) || [0, ""])[1]), rid = (/\br:id="([^"]*)"/.exec(m[1]) || [0, ""])[1], t = target.get(rid);
      if (!t) continue;
      const xml = await text(t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, ""));
      if (!xml) continue;
      const rows = [];
      for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
        const rn = +((/\br="(\d+)"/.exec(rm[1]) || [0, rows.length + 1])[1]) - 1, isHidden = /\bhidden="(?:1|true)"/.test(rm[1]);
        if (isHidden) hidden++;
        const arr = []; arr.hidden = isHidden;
        for (const cm of (rm[2] || "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const attrs = cm[1], body = cm[2] || "", ref = /\br="([A-Z]+\d+)"/.exec(attrs); if (!ref) continue;
          const ty = (/\bt="(\w+)"/.exec(attrs) || [0, "n"])[1], si = +((/\bs="(\d+)"/.exec(attrs) || [0, -1])[1]);
          const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body); if (/<f\b/.test(body)) formulas++;
          let cell;
          if (ty === "s") { const s = shared[+(v ? v[1] : -1)]; cell = s ? { v: s.text, runs: s.runs, kind: "text" } : null; }
          else if (ty === "inlineStr") { const is = /<is>([\s\S]*?)<\/is>/.exec(body); const s = richText(is ? is[1] : ""); cell = { v: s.text, runs: s.runs, kind: "text" }; }
          else if (ty === "str" || ty === "e") cell = v ? { v: unesc(v[1]), runs: null, kind: ty === "e" ? "error" : "text" } : null;
          else if (ty === "b") cell = v ? { v: v[1] === "1" ? "TRUE" : "FALSE", runs: null, kind: "bool" } : null;
          else if (v && v[1] !== "") cell = xfDate[si] ? { v: isoDate(+v[1]), runs: null, kind: "date" } : { v: v[1], runs: null, kind: "number" };
          else cell = null;
          if (cell) { cell.struck = !!xfStrike[si] || (cell.runs ? cell.runs.length > 0 && cell.runs.every((r) => r.strike || r.t === "") && cell.runs.some((r) => r.strike) : false); arr[colIndex(ref[1])] = cell; }
        }
        rows[rn] = arr;
      }
      sheets.push({ name, rows: Array.from(rows, (r) => r || []) });
    }
    if (formulas) warnings.push(`${formulas} cell(s) hold formulas; the stored (cached) value was read and nothing was evaluated.`);
    if (hidden) warnings.push(`${hidden} hidden row(s) were read like any other row.`);
    return { sheets, warnings };
  }
  const api = { readXlsx, zipDirectory };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.XlsxReader = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
