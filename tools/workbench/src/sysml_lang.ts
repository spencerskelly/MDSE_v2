/* Recognizes the SysML v2 textual notation by the language catalog (governance/language/catalog.json): which construct a
 * statement is, from its leading keywords. Not a parser: it classifies a statement head so nothing valid is reported as
 * unknown. Conformance is the pinned parser's job. Ids are the catalog's ids. */

const KINDS: Array<[string, string]> = [["part", "part"], ["attribute", "attribute"], ["item", "item"], ["port", "port"], ["connection", "connection"], ["interface", "interface"], ["allocation", "allocation"], ["flow", "flow"], ["occurrence", "occurrence"], ["individual", "individual"], ["action", "action"], ["state", "state"], ["constraint", "constraint"], ["requirement", "requirement"], ["concern", "concern"], ["calc", "calc"], ["case", "case"], ["analysis", "analysis"], ["verification", "verification"], ["use case", "use-case"], ["viewpoint", "viewpoint"], ["view", "view"], ["rendering", "rendering"], ["metadata", "metadata"], ["enum", "enum"]];
const KIND_RE = KINDS.map(([k]) => k).sort((a, b) => b.length - a.length).join("|");
const KIND_ID = new Map(KINDS);

const DEF_RE = new RegExp(`^(${KIND_RE})\\s+def\\b`);
const USAGE_RE = new RegExp(`^(${KIND_RE})\\b`);
const MOD_WORDS = /^(public|private|protected|abstract|variation|variant|readonly|derived|constant|ordered|nonunique|end|all)\b\s*/;

/** Construct ids a statement head belongs to (a head can be several: `abstract part def A :> B[1]` is a part-def, modifiers, specialization, multiplicity). */
export function classify(head: string): string[] {
  const ids: string[] = [];
  const add = (id: string): void => { if (!ids.includes(id)) ids.push(id); };
  let h = head.trim();
  if (!h) return ids;
  let m: RegExpExecArray | null;
  // prefix metadata, then visibility and modifiers
  while ((m = /^#[A-Za-z_][\w:]*\s*/.exec(h))) { add("prefix-metadata"); h = h.slice(m[0].length); }
  while ((m = MOD_WORDS.exec(h))) {
    if (/^(public|private|protected)$/.test(m[1]!)) add("visibility"); else if (m[1] === "variation" || m[1] === "variant") add("variation"); else add("modifiers");
    h = h.slice(m[0].length);
  }
  if (/^@[A-Za-z_]/.test(h)) { add("metadata-feature"); return ids; }
  if ((m = /^(import)\s+(.+)$/.exec(h))) { add(/::\*{1,2}$/.test(m[2]!) ? "import-namespace" : "import-membership"); return ids; }
  if (/^alias\b/.test(h)) { add("alias"); return ids; }
  if (/^filter\b/.test(h)) { add("filter"); return ids; }
  if (/^comment\b/.test(h) || /^\/\*/.test(h)) { add("comment"); return ids; }
  if (/^doc\b/.test(h)) { add("documentation"); return ids; }
  if (/^rep\b/.test(h) || /^language\b/.test(h)) { add("textual-representation"); return ids; }
  if ((m = /^(library\s+)?package\b/.exec(h))) { add(m[1] ? "library-package" : "package"); return ids; }
  if (/^dependency\b/.test(h)) { add("dependency"); return ids; }
  if (/^expose\b/.test(h)) { add("expose"); return ids; }
  if (/^render\b/.test(h)) { add("render"); return ids; }
  if (/^frame\b/.test(h)) { add("framed-concern-usage"); return ids; }
  if (/^perform\b/.test(h)) { add("perform-action-usage"); return ids; }
  if (/^exhibit\b/.test(h)) { add("exhibit-state-usage"); return ids; }
  if (/^include\b/.test(h)) { add("include-use-case-usage"); return ids; }
  if (/^satisfy\b/.test(h)) { add("satisfy-requirement-usage"); return ids; }
  if (/^verify\b/.test(h)) { add("verify-requirement-usage"); return ids; }
  if (/^assert\b/.test(h)) { add("assert-constraint-usage"); return ids; }
  if (/^(assume|require)\b/.test(h)) { add("require-constraint-usage"); return ids; }
  if (/^allocate\b/.test(h)) { add("allocation-usage"); return ids; }
  if (/^connect\b/.test(h)) { add("connection-usage"); return ids; }
  if (/^bind\b/.test(h)) { add("bind"); return ids; }
  if (/^succession\s+flow\b/.test(h)) { add("succession-flow-usage"); return ids; }
  if (/^succession\b|^first\b/.test(h)) { add("succession"); return ids; }
  if (/^transition\b|^then\b|^accept\b.*\bthen\b/.test(h)) { if (/^transition\b/.test(h)) add("transition-usage"); else add("succession"); return ids; }
  if (/^message\b/.test(h)) { add("message"); return ids; }
  if (/^accept\b/.test(h)) { add("accept-action-usage"); return ids; }
  if (/^send\b/.test(h)) { add("send-action-usage"); return ids; }
  if (/^assign\b/.test(h)) { add("assign-action-usage"); return ids; }
  if (/^(decide|merge|fork|join)\b/.test(h)) { add("decision-node"); return ids; }
  if (/^if\b/.test(h)) { add("if-action-usage"); return ids; }
  if (/^(while|loop|for)\b/.test(h)) { add("loop-action-usage"); return ids; }
  if (/^terminate\b/.test(h)) { add("terminate-action-usage"); return ids; }
  if (/^(entry|do|exit)\b/.test(h)) { add("state-action"); return ids; }
  if (/^return\b/.test(h)) { add("return"); relations(h, add); return ids; }
  if (/^objective\b/.test(h)) { add("objective-usage"); return ids; }
  if (/^subject\b/.test(h)) { add("subject-usage"); relations(h, add); return ids; }
  if (/^actor\b/.test(h)) { add("actor-usage"); relations(h, add); return ids; }
  if (/^stakeholder\b/.test(h)) { add("stakeholder-usage"); relations(h, add); return ids; }
  if (/^event\b/.test(h)) { add("event-occurrence-usage"); return ids; }
  if (/^snapshot\b/.test(h)) { add("snapshot-usage"); relations(h, add); return ids; }
  if (/^timeslice\b/.test(h)) { add("timeslice-usage"); relations(h, add); return ids; }
  let dir = false;
  if ((m = /^(in|out|inout)\b\s*/.exec(h))) { add("parameter"); dir = true; h = h.slice(m[0].length); }
  if ((m = /^ref\b\s*/.exec(h))) { h = h.slice(m[0].length); if (!USAGE_RE.test(h)) { add("reference-usage"); relations(h, add); return ids; } add("reference-usage"); }
  if ((m = DEF_RE.exec(h))) { add(`${KIND_ID.get(m[1]!)!}-def`); relations(h, add, true); return ids; }
  if ((m = USAGE_RE.exec(h))) { add(`${KIND_ID.get(m[1]!)!}-usage`); relations(h, add); return ids; }
  if (dir) { relations(h, add); return ids; }
  if (/^(end\s+)?[A-Za-z_]\w*\s*(:|:>|:>>|::>|=|\[)/.test(h)) { relations(h, add); return ids; }   // a usage with no keyword: redefinition or short form
  if (/<=|>=|==|!=|&&|\|\||[-+*\/?<>]|\b(not|and|or|xor|implies)\b|\[[^\]]*\]|[A-Za-z_]\w*\.[A-Za-z_]/.test(h)) { add("expression"); return ids; }
  return ids;
}

/** The relationship, multiplicity and value forms inside a declaration. */
function relations(h: string, add: (id: string) => void, isDef = false): void {
  if (/:>>|\bredefines\b/.test(h)) add("redefinition");
  if (/::>|\breferences\b/.test(h)) add("reference-subsetting");
  if (/(^|[^:>]):>(?![>:])|\bspecializes\b|\bsubsets\b/.test(h)) add(isDef ? "specialization" : "subsetting");
  if (/\bcrosses\b/.test(h)) add("cross-subsetting");
  if (/:\s*~/.test(h)) add("conjugation");
  if (/(^|[^:>]):(?![>:=])\s*[A-Za-z_~]|\bdefined by\b/.test(h) && !isDef) add("feature-typing");
  if (/\[[^\]]*\]/.test(h)) add("multiplicity");
  if (/(^|[^:<>=!])(:=|=)(?!=)/.test(h)) add("value");
}
