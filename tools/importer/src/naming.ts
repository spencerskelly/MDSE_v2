/* File and folder names (MOD-097/098/102/110/111) and SysML identifiers. */

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3])$/i;
/** Characters a browser or Windows refuses in a name: controls, bidi marks, line and paragraph separators, specials, lone surrogates. */
// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufff9-\uffff]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
const MAX_COMPONENT = 100;
/** The folder part of a path stays within this many characters, so the whole path extracts on Windows (260 limit) from a typical download folder. */
export const DIR_BUDGET = 150;

/** One path component safe on Windows and macOS. Replacement order follows MOD-097/098. */
export function safeName(raw: string, fallback = "Unnamed"): string {
  let s = raw.replace(/\r?\n/g, " ")
    .replace(/\//g, "-").replace(/:/g, " -").replace(/[?*]/g, "").replace(/"/g, "''")
    .replace(/[<>|\\]/g, "-").replace(/\[/g, "(").replace(/\]/g, ")").replace(/#/g, "no.").replace(/\^/g, "")
    .replace(ILLEGAL_CHARS, "")
    .replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
  if (!s) s = fallback;
  if (s.length > MAX_COMPONENT) s = s.slice(0, MAX_COMPONENT).replace(/[\ud800-\udbff]$/, "").trim().replace(/[. ]+$/, "") + "~a";   // forced alteration marker (MOD-102)
  const dot = s.indexOf("."), stem = dot < 0 ? s : s.slice(0, dot);
  if (WINDOWS_RESERVED.test(stem)) s = stem + "_" + s.slice(stem.length);            // a device name is reserved with any extension: Con.pdf
  return s;
}

/** Case-insensitive uniqueness across the vault. A repeat takes ~2, ~3 (MOD-102, MOD-111). */
export class NameRegistry {
  private seen = new Set<string>();
  constructor(initial: Iterable<string> = []) { for (const p of initial) this.seen.add(p.toLowerCase()); }
  claim(dir: string, base: string, ext: string): string {
    let n = 1, name = base;
    for (;;) {
      const path = (dir ? dir + "/" : "") + name + ext;
      if (!this.seen.has(path.toLowerCase())) { this.seen.add(path.toLowerCase()); return path; }
      n++; name = `${base}~${n}`;
    }
  }
}

const SYSML_KEYWORDS = new Set(["about", "abstract", "accept", "action", "actor", "after", "alias", "all", "allocate", "allocation", "analysis", "and", "as", "assert", "assign", "assume", "at", "attribute", "bind", "binding", "by", "calc", "case", "comment", "concern", "connect", "connection", "constant", "constraint", "crosses", "decide", "def", "default", "defined", "dependency", "derived", "do", "doc", "else", "end", "entry", "enum", "event", "exhibit", "exit", "expose", "false", "filter", "first", "flow", "for", "fork", "frame", "from", "hastype", "if", "implies", "import", "in", "include", "individual", "inout", "interface", "istype", "item", "join", "language", "loop", "merge", "message", "meta", "metadata", "nonunique", "not", "null", "objective", "occurrence", "of", "or", "ordered", "out", "package", "parallel", "part", "perform", "port", "private", "protected", "public", "redefines", "ref", "references", "render", "rendering", "rep", "require", "requirement", "return", "satisfy", "send", "snapshot", "specializes", "stakeholder", "standard", "state", "subject", "subsets", "succession", "then", "timeslice", "to", "transition", "true", "until", "use", "variant", "variation", "verification", "verify", "via", "view", "viewpoint", "when", "while", "xor"]);

/** A plain SysML identifier (letters, digits, underscore). The engineering name stays in the note title. */
export function sysmlIdent(raw: string, fallback = "Unnamed"): string {
  let s = raw.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim()
    .split(" ").filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");
  if (!s) s = fallback;
  if (/^[0-9]/.test(s)) s = "_" + s;
  return SYSML_KEYWORDS.has(s) ? s + "_" : s;
}

export const lowerFirst = (s: string): string => (s ? s[0]!.toLowerCase() + s.slice(1) : s);

/** Identifier for a usage (part, port, action ...): camelCase, never a SysML keyword. */
export function usageIdent(raw: string, fallback = "unnamed"): string {
  const s = lowerFirst(sysmlIdent(raw, fallback));
  return SYSML_KEYWORDS.has(s) ? s + "_" : s;
}

/** Unique usage names inside one owner. */
export class IdentScope {
  private used = new Set<string>();
  take(want: string): string {
    let n = 1, name = want;
    while (this.used.has(name)) { n++; name = `${want}_${n}`; }
    this.used.add(name);
    return name;
  }
}

/** IMP-103: shortens folder names so the deepest note path stays inside the budget, WITHOUT giving one folder two spellings.
 *  A folder's shortened name depends only on its own name, its ancestors' (already shortened) names and the height of the
 *  folder tree below it, so every note under a folder sees the same ancestors. Trees that fit keep every name whole; a deep
 *  chain shares what is left of the budget equally among the levels still to come, and only names longer than their share are cut. */
export function folderSqueezer(chains: string[][], budget = DIR_BUDGET): (parts: string[]) => string[] {
  type Node = { kids: Map<string, Node>; height: number; out: Map<string, string> };
  const mk = (): Node => ({ kids: new Map(), height: 0, out: new Map() });
  const root = mk();
  for (const c of chains) { let n = root; c.forEach((seg, i) => { let k = n.kids.get(seg); if (!k) { k = mk(); n.kids.set(seg, k); } k.height = Math.max(k.height, c.length - i - 1); n = k; }); }
  const hash = (t: string): string => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h.toString(36).padStart(3, "0").slice(0, 3); };
  const memo = new Map<string, string[]>();
  return (parts: string[]): string[] => {
    const key = parts.join("\u0000"); const hit = memo.get(key); if (hit) return hit;
    const res: string[] = []; let node: Node | undefined = root; let used = 0;
    for (const seg of parts) {
      node = node?.kids.get(seg);
      const levels = (node ? node.height : 0) + 1;                                  // this folder and the deepest folder below it
      const share = Math.max(10, Math.floor((budget - used) / levels) - 1);
      const name = seg.length > share ? seg.slice(0, share - 4).replace(/[. ]+$/, "") + "~" + hash(seg) : seg;
      res.push(name); used += name.length + 1;
    }
    memo.set(key, res); return res;
  };
}
