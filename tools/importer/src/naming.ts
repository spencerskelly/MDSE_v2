/* File and folder names (MOD-097/098/102/110/111) and SysML identifiers. */

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3])$/i;
/** Characters a browser or Windows refuses in a name: controls, bidi marks, line and paragraph separators, specials, lone surrogates. */
// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufff9-\uffff]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;
const MAX_COMPONENT = 150;
/** The folder part of a path stays within this many characters, so the whole path extracts on Windows (260 limit) from a typical download folder. */

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
  const id = sysmlIdent(raw, fallback);
  const s = /^[A-Z]{2}/.test(id) ? id : lowerFirst(id);                       // an acronym keeps its case: `CAN0`, `USBC`, not `cAN0`, `uSBC` (IMP-112)
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

