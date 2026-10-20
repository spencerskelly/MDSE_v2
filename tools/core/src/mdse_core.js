/* MDSE v2 importer core. Pure functions, no DOM, no network, no dependencies.
 * Inlined into mdse_v2_importer.html by build_importer_html.mjs and unit-tested under node.
 * The note rules mirror testing/oracles/mdse_note_format.py (ADR-V2-06); CI cross-checks the two. */
const MDSE = (() => {
  const SYSML_HEADING = "## SysML v2", SOURCE_HEADING = "## Source: EA";
  const SYSML_HINT = "> **Authoritative SysML v2 text.** Write your notes above this section. " +
    "Change the model through Workbench, or edit this block and re-run the parser check.";
  const UID = /^\d{17}[a-z-]{13}$/, ID = /^([A-Z]+)-(\d{5})$/;
  const FIXTURE_ID_MIN = 99000;
  const PROPERTY_ORDER = ["type", "subtype", "id", "uid", "status", "eaType", "tags"];
  const FENCE_OPEN = /^```sysml[ \t]*$/;
  const COMMENT_ONLY = /^\s*(<!--[\s\S]*?-->\s*)*$/;
  // Keys the importer owns on rerun. Everything else in frontmatter belongs to people.
  const EA_OWNED_KEYS = ["subtype", "eaType", "sourceRole", "primarySymbol"];

  const scalar = (raw) => { raw = raw.trim(); if (raw.length >= 2 && raw[0] === raw[raw.length - 1] && "\"'".includes(raw[0])) raw = raw.slice(1, -1); return raw; };

  function parse(text) {
    const norm = text.replace(/\r\n/g, "\n");
    if (!norm.startsWith("---\n")) throw new Error("MISSING_FRONTMATTER");
    let end = norm.indexOf("\n---\n", 3);
    const tailEnd = norm.length;
    if (end === -1) {
      const t = norm.replace(/\n+$/, "");
      if (t.endsWith("\n---")) end = t.lastIndexOf("\n---"); else throw new Error("MISSING_FRONTMATTER");
    }
    const keys = [], meta = {};
    for (const line of norm.slice(4, end).split("\n")) {
      const m = /^([A-Za-z][\w-]*):(.*)$/.exec(line);
      if (m) { keys.push(m[1]); meta[m[1]] = scalar(m[2]); }
    }
    const fmEnd = Math.min(end + 5, tailEnd);
    const h2 = []; let inFence = false, pos = 0;
    for (const line of norm.split("\n")) {
      if (line.trimStart().startsWith("```")) inFence = !inFence;
      else if (!inFence && line.startsWith("## ") && pos >= fmEnd) h2.push([pos, line.trimEnd()]);
      pos += line.length + 1;
    }
    return { text: norm, keys, meta, fmEnd, h2, fmBlockEnd: end };
  }
  const sectionOffsets = (n, heading) => n.h2.map(([off, h], i) => [i, off, h]).filter((x) => x[2] === heading).map((x) => [x[0], x[1]]);
  function sectionText(n, heading) {
    const hits = sectionOffsets(n, heading); if (!hits.length) return null;
    const [i, off] = hits[0]; const stop = i + 1 < n.h2.length ? n.h2[i + 1][0] : n.text.length;
    return n.text.slice(off, stop);
  }
  function fences(section) {
    const out = [], lines = section.split("\n"); let i = 0;
    while (i < lines.length) {
      if (FENCE_OPEN.test(lines[i])) {
        let j = i + 1; while (j < lines.length && lines[j].trimEnd() !== "```") j++;
        const body = lines.slice(i + 1, j).join("\n") + "\n";
        let k = j + 1; while (k < lines.length && !FENCE_OPEN.test(lines[k])) k++;
        out.push([body, lines.slice(j + 1, k).join("\n")]);
        i = Math.max(k, j + 1);
      } else i++;
    }
    return out;
  }
  function qualifiedNames(sysml) {
    const src = sysml.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const tok = /\{|\}|;|\bpackage\s+(\w+)|\b(?:\w+\s+)*?def\s+(\w+)/g;
    const stack = [], names = new Set(); let pending = null, m;
    while ((m = tok.exec(src))) {
      const t = m[0];
      if (t === "{") { stack.push(pending); pending = null; }
      else if (t === "}") { if (stack.length) stack.pop(); pending = null; }
      else if (t === ";") pending = null;
      else { const name = m[1] || m[2]; names.add([...stack.filter(Boolean), name].join("::")); pending = name; }
    }
    return names;
  }
  function extractSysml(text) {
    const sec = sectionText(parse(text), SYSML_HEADING); if (sec === null) return null;
    const f = fences(sec); return f.length === 1 ? f[0][0] : null;
  }

  function validate(text, classes) {
    let n; try { n = parse(text); } catch (e) { return [{ code: e.message, message: "note has no YAML frontmatter" }]; }
    const out = [], m = n.meta, add = (code, message) => out.push({ code, message });
    const present = PROPERTY_ORDER.filter((k) => n.keys.includes(k));
    if (JSON.stringify(n.keys.slice(0, present.length)) !== JSON.stringify(present)) add("PROPERTY_ORDER", `leading keys must be ${present}`);
    for (const req of ["type", "id", "uid", "status", "tags"]) if (!n.keys.includes(req)) add("MISSING_PROPERTY", `\`${req}\` is required`);
    const cls = classes[m.type || ""];
    if ("type" in m && !cls) add("UNKNOWN_TYPE", `type \`${m.type}\` is not a class`);
    if (cls) {
      const subs = cls.subtype || [], sub = m.subtype || "";
      if (subs.length && !subs.includes(sub)) add("BAD_SUBTYPE", `subtype \`${sub}\` not allowed for ${m.type}`);
      if (!subs.length && sub) add("BAD_SUBTYPE", `${m.type} has no subtypes but subtype is \`${sub}\``);
    }
    if ("id" in m) {
      const idm = ID.exec(m.id);
      if (!idm) add("BAD_ID", `id \`${m.id}\` malformed`);
      else if (cls) {
        const want = (cls.prefixBySubtype && cls.prefixBySubtype[m.subtype || ""]) || cls.prefix;
        if (idm[1] !== want) add("ID_PREFIX", `id prefix \`${idm[1]}\` is not \`${want}\``);
      }
      if (m.fixture === "true" && idm && +idm[2] < FIXTURE_ID_MIN) add("FIXTURE_ID_RANGE", "fixture ids are 99000-99999");
      if (m.fixture !== "true" && idm && +idm[2] >= FIXTURE_ID_MIN) add("FIXTURE_ID_RANGE", "ids 99000-99999 are reserved for fixtures");
    }
    if ("uid" in m && !UID.test(m.uid)) add("BAD_UID", `uid \`${m.uid}\` malformed`);
    const sysHits = sectionOffsets(n, SYSML_HEADING), srcHits = sectionOffsets(n, SOURCE_HEADING);
    if (sysHits.length > 1) add("SYSML_SECTION_COUNT", `${sysHits.length} SysML sections`);
    if (srcHits.length && sysHits.length && srcHits[0][1] > sysHits[0][1]) add("SOURCE_AFTER_SYSML", "Source: EA must precede SysML v2");
    let block = null;
    if (sysHits.length) {
      if (sysHits[0][0] !== n.h2.length - 1) add("SYSML_NOT_LAST", `SysML v2 must be last; found \`${n.h2[n.h2.length - 1][1]}\` after it`);
      const f = fences(sectionText(n, SYSML_HEADING));
      if (f.length !== 1) add("SYSML_FENCE_COUNT", `expected one sysml block; found ${f.length}`);
      else { block = f[0][0]; if (!COMMENT_ONLY.test(f[0][1])) add("SYSML_TRAILING_CONTENT", "text after the sysml block"); }
    }
    const upto = sysHits.length ? sysHits[0][1] : n.text.length;
    const stray = fences(n.text.slice(n.fmEnd, upto)).length;
    if (stray) add("SYSML_OUTSIDE_FOOTER", `${stray} sysml block(s) above the SysML section`);
    const role = m.sourceRole, symbol = m.primarySymbol;
    if (role !== undefined && role !== "authoritative-model") add("BAD_SOURCE_ROLE", `sourceRole \`${role}\``);
    if ((role || symbol) && block === null) add("MISSING_SYSML_BLOCK", "sourceRole/primarySymbol set without a valid block");
    if (role === "authoritative-model" && !symbol) add("MISSING_PRIMARY_SYMBOL", "needs primarySymbol");
    if (symbol && block !== null && !qualifiedNames(block).has(symbol)) add("SYMBOL_NOT_DECLARED", `primarySymbol \`${symbol}\` not declared`);
    return out;
  }

  const renderSysmlSection = (sysml, nl = "\n") =>
    [SYSML_HEADING, "", SYSML_HINT, "", "```sysml", ...sysml.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n"), "```"].join(nl) + nl;
  function replaceSysmlBlock(text, sysml) {
    const nl = text.includes("\r\n") ? "\r\n" : "\n", n = parse(text), hits = sectionOffsets(n, SYSML_HEADING);
    const section = renderSysmlSection(sysml, nl);
    if (hits.length) {
      const normOff = hits[0][1];
      const cut = normOff + (nl === "\r\n" ? (n.text.slice(0, normOff).match(/\n/g) || []).length : 0);
      return text.slice(0, cut) + section;
    }
    const hasFooter = n.h2.some(([, h]) => h === SOURCE_HEADING);
    return text.replace(/[\r\n]+$/, "") + nl.repeat(hasFooter ? 2 : 4) + section;
  }

  /* ---- rerun / add-onto-existing -------------------------------------------------
   * Ruleset 16.4: EA-owned content refreshes, human content is preserved.
   *   user zone       everything before the first managed heading: kept byte-for-byte
   *   frontmatter     id and uid never change; EA_OWNED_KEYS refresh; all other keys kept
   *   Source: EA      replaced
   *   SysML v2        replaced
   * A different `type` for the same uid is a CONFLICT and nothing is written. */
  function managedStart(n) {
    const hits = n.h2.filter(([, h]) => h === SOURCE_HEADING || h === SYSML_HEADING);
    return hits.length ? hits[0][0] : n.text.length;
  }
  function splitNote(text) {
    const n = parse(text), cut = managedStart(n);
    const head = n.text.slice(0, cut), footer = n.text.slice(cut);
    const srcHits = sectionOffsets(n, SOURCE_HEADING), sysHits = sectionOffsets(n, SYSML_HEADING);
    const srcText = sectionText(n, SOURCE_HEADING);
    return { n, head, footer, source: srcText ? srcText.replace(/\n+$/, "") : null, hasSysml: sysHits.length > 0, srcHits };
  }
  function patchFrontmatter(head, generatedMeta, generatedKeys) {
    const lines = head.split("\n"), log = [];
    const fmIdx = (key) => { const close = lines.indexOf("---", 1); for (let i = 1; i < close; i++) if (lines[i].startsWith(key + ":")) return i; return -1; };
    for (const key of EA_OWNED_KEYS) {
      if (!(key in generatedMeta)) continue;
      const line = `${key}: ${generatedMeta[key]}`, i = fmIdx(key);
      if (i >= 0) {
        if (lines[i] !== line) { log.push(`${key}: ${lines[i].slice(key.length + 2)} -> ${generatedMeta[key]}`); lines[i] = line; }
      } else {
        let at = lines.indexOf("---", 1);               // default: just before the closing fence
        for (let g = generatedKeys.indexOf(key) - 1; g >= 0; g--) { const j = fmIdx(generatedKeys[g]); if (j >= 0) { at = j + 1; break; } }
        lines.splice(at, 0, line); log.push(`${key}: (added) ${generatedMeta[key]}`);
      }
    }
    return { text: lines.join("\n"), log };
  }
  function mergeNote(existing, generated) {
    const nlE = existing.includes("\r\n") ? "\r\n" : "\n";
    const E = splitNote(existing), G = splitNote(generated);
    if (E.n.meta.uid !== G.n.meta.uid) return { action: "conflict", reason: "UID_MISMATCH", text: existing, log: [] };
    if (E.n.meta.type !== G.n.meta.type) return { action: "conflict", reason: `TYPE_CHANGED ${E.n.meta.type} -> ${G.n.meta.type}`, text: existing, log: [] };
    const patched = patchFrontmatter(E.head, G.n.meta, G.n.keys);
    const head = patched.text, log = patched.log;
    // Rebuild the footer from the generated note, in the existing note's line endings.
    const gFooterSrc = G.source, gSysml = extractSysml(generated);
    let out = head.replace(/\n+$/, "") ;
    const gap = "\n\n\n\n";
    if (gFooterSrc) out += gap + gFooterSrc + "\n\n" + renderSysmlSection(gSysml, "\n").replace(/\n$/, "") + "\n";
    else if (gSysml !== null) out += gap + renderSysmlSection(gSysml, "\n");
    else out += "\n";
    if (nlE === "\r\n") out = out.replace(/\n/g, "\r\n");
    return { action: out === existing ? "unchanged" : "merge", text: out, log };
  }
  const indexByUid = (files) => { const m = new Map(); for (const [path, text] of files) { try { const u = parse(text).meta.uid; if (u) m.set(u, path); } catch (_) {} } return m; };

  /* ---- ZIP (stored, no compression) ------------------------------------------- */
  let CRC = null;
  const crc32 = (b) => { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  /* ---- Narrow, human-initiated edits used by the Workbench Review (D-0025). They touch the frontmatter value or one flag
   * callout in the user zone, never `## Source: EA` or `## SysML v2`, and return the new text; the caller writes it. ---- */
  const FLAG_RE = /^> \[!(flag\w+)\] (.*)\n((?:>.*(?:\n|$))*)/gm;
  const crlf = (orig, text) => (orig.includes("\r\n") ? text.replace(/\n/g, "\r\n") : text);
  function setFrontmatterField(text, key, value) {
    const n = parse(text);
    if (!/^[A-Za-z][\w-]*$/.test(key)) return { text, changed: false, reason: "BAD_KEY" };
    const v = String(value).trim();
    if (/[\n\r]/.test(v)) return { text, changed: false, reason: "BAD_VALUE" };
    const quoted = v === "" ? "" : /^[\s'"]|[:#]\s|\s$|^[-?!&*|>%@`]/.test(v) ? JSON.stringify(v) : v;
    const fm = n.text.slice(4, n.fmBlockEnd), re = new RegExp(`^${key}:.*$`, "m");
    if (!re.test(fm)) return { text, changed: false, reason: "FIELD_MISSING" };
    const out = n.text.slice(0, 4) + fm.replace(re, quoted === "" ? `${key}:` : `${key}: ${quoted}`) + n.text.slice(n.fmBlockEnd);
    return { text: crlf(text, out), changed: out !== n.text, reason: "" };
  }
  function removeFlag(text, type, title, nth = 0) {
    const n = parse(text), zoneEnd = managedStart(n), zoneStart = n.fmEnd, zone = n.text.slice(zoneStart, zoneEnd);
    let i = 0, hit = null;
    for (const m of zone.matchAll(FLAG_RE)) { if (m[1] === type && m[2].trim() === String(title).trim()) { if (i === nth) { hit = m; break; } i++; } }
    if (!hit) return { text, removed: false, reason: "FLAG_NOT_FOUND" };
    let start = zoneStart + hit.index, end = start + hit[0].length;
    if (n.text.slice(end, end + 1) === "\n" && (start === 0 || n.text.slice(start - 1, start) === "\n")) end++;      // keep one blank line, not two
    const out = n.text.slice(0, start) + n.text.slice(end);
    return { text: crlf(text, out), removed: true, reason: "" };
  }

  function zip(entries) { // entries: [[path, Uint8Array]]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    for (const [path, data] of entries) {
      const name = enc.encode(path), crc = crc32(data);
      const local = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)]);
      parts.push(local, name, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += local.length + name.length + data.length;
    }
    const cdSize = central.reduce((s, x) => s + x.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(entries.length), ...u16(entries.length), ...u32(cdSize), ...u32(off), 0, 0]);
    const all = [...parts, ...central, end], total = all.reduce((s, x) => s + x.length, 0), out = new Uint8Array(total); let p = 0;
    for (const x of all) { out.set(x, p); p += x.length; } return out;
  }
  return { SYSML_HEADING, SOURCE_HEADING, EA_OWNED_KEYS, parse, extractSysml, qualifiedNames, validate, renderSysmlSection, replaceSysmlBlock, mergeNote, indexByUid, crc32, zip, setFrontmatterField, removeFlag };
})();
if (typeof module !== "undefined") module.exports = MDSE;
