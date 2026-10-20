/* A recognizer for the SysML v2 subset the vault uses. It is NOT a SysML parser: it finds definitions, usages and the
 * statements the importer writes, and keeps anything else as `raw` so nothing is silently dropped. Conformance is the
 * pinned parser's job (the parser gate), not this file's. */

/** Properties written inside a usage or statement body: a doc comment and `attribute name = value;` members (D-0031). */
export interface Prop { name: string; value: string }
export interface Usage { kind: string; name: string; type?: string; mult?: string; dir?: string; /** the declaration as written, whitespace collapsed */ head: string; /** `ordered` / `nonunique` modifiers */ mods?: string[]; props?: Prop[]; doc?: string }
export interface Stmt { kind: string; a?: string; b?: string; name?: string; tag?: string; /** transition / guarded succession: names of the helper usages (IMP-098) */ trigger?: string; guard?: string; effect?: string; props?: Prop[]; doc?: string; text: string }
export interface Definition { keyword: string; pkg: string; name: string; symbol: string; specializes: string[]; usages: Usage[]; stmts: Stmt[]; raw: string[]; /** text of the definition own doc comment (requirement wording) */ doc?: string; /** wording of helper usages by name (guard constraints, trigger items, effect actions) */ notes: Record<string, string>; /** catalog ids of every construct seen inside (governance/language/catalog.json) */ langs: string[] }
export interface ScanResult { defs: Definition[]; warnings: string[]; /** catalog ids of every construct in the block */ langs: string[] }
import { classify } from "./sysml_lang.ts";

interface Item { head: string; body: Item[] | null; tag: string }

function stripComments(src: string): string {
  // `// word` after a semicolon is a kind tag (the importer's dependency kinds); other comments are dropped.
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").split("\n").map((l) => {
    const m = /^(.*?[;}])\s*\/\/\s*([A-Za-z]+)\s*$/.exec(l);
    if (m) return `${m[1]} @${m[2]}`;
    const i = l.indexOf("//");
    return i >= 0 ? l.slice(0, i) : l;
  }).join("\n");
}

function parseItems(s: string, start: number, close: boolean): { items: Item[]; end: number } {
  const items: Item[] = [];
  let i = start, head = "";
  const flush = (body: Item[] | null, endsWithSemi: boolean): void => {
    const h = head.replace(/\s+/g, " ").trim();
    let tag = "";
    const m = /^\s*@([A-Za-z]+)/.exec(s.slice(i));
    if (m && (endsWithSemi || body)) { tag = m[1]!; i += m[0].length; }
    if (h || body) items.push({ head: h, body, tag });
    head = "";
  };
  while (i < s.length) {
    const c = s[i]!;
    if (c === "}") { if (close) { if (head.trim()) flush(null, false); return { items, end: i + 1 }; } i++; continue; }
    if (c === ";") { i++; flush(null, true); continue; }
    if (c === "{") { const inner = parseItems(s, i + 1, true); i = inner.end; flush(inner.items, false); continue; }
    head += c; i++;
  }
  if (head.trim()) flush(null, false);
  return { items, end: i };
}

const DEF = /^(?:(?:abstract|variation|public|private|protected)\s+)*(part|port|action|state|item|attribute|requirement|use case|verification|constraint|occurrence|interface|connection|allocation|enum|calc|analysis|view|viewpoint|concern|metadata|flow|rendering|individual|case)\s+def\s+([A-Za-z_]\w*)\s*(?::>\s*(.+))?$/;
const USAGE = /^(?:(in|out|inout)\s+)?(part|port|action|state|item|attribute|fork|join|ref part|ref item)\s+([A-Za-z_]\w*)\s*(?::\s*([A-Za-z_][\w:]*))?\s*(\[[^\]]*\])?((?:\s+(?:ordered|nonunique))*)$/;
const QN = "([A-Za-z_][\\w:.]*)";

function interpret(it: Item, d: Definition): void {
  const nu = d.usages.length, ns = d.stmts.length;
  const handled = interpretOne(it, d);
  if (!handled) { if (it.head) d.raw.push(it.head); return; }
  const rec: { props?: Prop[]; doc?: string } | undefined = d.usages.length > nu ? d.usages[d.usages.length - 1] : d.stmts.length > ns ? d.stmts[d.stmts.length - 1] : undefined;
  if (it.body && !/^objective\b/.test(it.head)) for (const c of it.body) {
    if (rec) {                                                                         // properties of a usage or statement are kept on it, not as usages of the definition (D-0031)
      const dm = /^doc ~D(\d+)$/.exec(c.head);
      if (dm) { rec.doc = docText(c.head); for (const i of classify("doc")) if (!d.langs.includes(i)) d.langs.push(i); continue; }
      const am = /^attribute\s+([A-Za-z_]\w*)\s*(?:=\s*(.*))?$/.exec(c.head);
      if (am) {
        const sub = c.body?.find((x) => /^doc ~D\d+$/.test(x.head)), raw = (am[2] ?? "").trim();
        (rec.props ??= []).push({ name: am[1]!, value: sub ? docText(sub.head) : raw.replace(/^"(.*)"$/, "$1") });
        for (const i of classify("attribute x")) if (!d.langs.includes(i)) d.langs.push(i);
        continue;
      }
    }
    interpret(c, d);                                                                   // nested members of any construct
  }
}

/** The statements the importer writes get their own record; returns false only for a head nothing recognizes. */
let DOCS: string[] = [];
const docText = (head: string): string => (DOCS[Number(/\d+$/.exec(head)![0])] ?? "").replace(/^\s*\*?\s?/gm, "").trim();
function interpretOne(it: Item, d: Definition): boolean {
  const h = it.head;
  if (/^doc ~D\d+$/.test(h)) { for (const i of classify("doc")) if (!d.langs.includes(i)) d.langs.push(i); return true; }
  { const hm = /^(?:constraint|action|state|item|attribute)\s+([A-Za-z_]\w*)\b/.exec(h); const dc = hm && it.body?.find((c) => /^doc ~D\d+$/.test(c.head)); if (dc) d.notes[hm![1]!] = docText(dc.head); }
  for (const i of classify(h)) if (!d.langs.includes(i)) d.langs.push(i);
  let m: RegExpExecArray | null;
  const st = (s: Stmt): void => { d.stmts.push(s); };
  if (it.body && /^objective\b/.test(h)) {
    for (const c of it.body) { const v = new RegExp(`^verify\\s+(?:requirement\\s+)?${QN}$`).exec(c.head); if (v) { st({ kind: "verify", a: v[1]!, text: c.head }); if (!d.langs.includes("verify-requirement-usage")) d.langs.push("verify-requirement-usage"); } else { for (const i of classify(c.head)) if (!d.langs.includes(i)) d.langs.push(i); if (!classify(c.head).length) d.raw.push(c.head); } }
    return true;
  }
  if ((m = USAGE.exec(h))) { d.usages.push({ kind: m[2]!.replace("ref ", ""), name: m[3]!, ...(m[4] ? { type: m[4] } : {}), ...(m[5] ? { mult: m[5] } : {}), ...(m[1] ? { dir: m[1] } : {}), head: h, ...(m[6]?.trim() ? { mods: m[6].trim().split(/\s+/) } : {}) }); return true; }
  if ((m = new RegExp(`^satisfy\\s+(?:requirement\\s+)?${QN}(?:\\s+by\\s+${QN})?$`).exec(h))) { st({ kind: "satisfy", a: m[1]!, ...(m[2] ? { b: m[2] } : {}), text: h }); return true; }
  if ((m = new RegExp(`^allocate\\s+${QN}\\s+to\\s+${QN}$`).exec(h))) { st({ kind: "allocate", a: m[1]!, b: m[2]!, text: h }); return true; }
  if ((m = new RegExp(`^perform\\s+action\\s+([A-Za-z_]\\w*)\\s*:\\s*${QN}$`).exec(h))) { st({ kind: "perform", name: m[1]!, b: m[2]!, text: h }); return true; }
  if ((m = new RegExp(`^dependency\\s+from\\s+${QN}\\s+to\\s+${QN}$`).exec(h))) { st({ kind: "dependency", a: m[1]!, b: m[2]!, tag: it.tag || "dependsOn", text: h }); return true; }
  if ((m = /^succession\s+first\s+([\w.]+)(?:\s+if\s+([\w.]+))?\s+then\s+([\w.]+)$/.exec(h))) { st({ kind: "succession", a: m[1]!, b: m[3]!, ...(m[2] ? { guard: m[2] } : {}), text: h }); return true; }
  if ((m = /^transition\s+first\s+([\w.]+)(?:\s+accept\s+([\w.]+))?(?:\s+if\s+([\w.]+))?(?:\s+do\s+([\w.]+))?\s+then\s+([\w.]+)$/.exec(h))) { st({ kind: "transition", a: m[1]!, b: m[5]!, ...(m[2] ? { trigger: m[2] } : {}), ...(m[3] ? { guard: m[3] } : {}), ...(m[4] ? { effect: m[4] } : {}), text: h }); return true; }
  if ((m = /^connect\s+([\w.]+)\s+to\s+([\w.]+)$/.exec(h))) { st({ kind: "connect", a: m[1]!, b: m[2]!, text: h }); return true; }
  if ((m = new RegExp(`^include\\s+use case\\s+([A-Za-z_]\\w*)\\s*:\\s*${QN}$`).exec(h))) { st({ kind: "include", name: m[1]!, b: m[2]!, text: h }); return true; }
  if ((m = new RegExp(`^use case\\s+([A-Za-z_]\\w*)\\s*:\\s*${QN}\\s*(\\[[^\\]]*\\])?$`).exec(h))) { st({ kind: "optionalUseCase", name: m[1]!, b: m[2]!, tag: m[3] ?? "", text: h }); return true; }
  return classify(h).length > 0;
}

export function scanSysml(block: string): ScanResult {
  const warnings: string[] = [];
  const defs: Definition[] = [];
  DOCS = [];
  const pre = block.replace(/\bdoc\s*\/\*([\s\S]*?)\*\//g, (_m, t: string) => { DOCS.push(t); return `doc ~D${DOCS.length - 1};`; });
  const { items } = parseItems(stripComments(pre), 0, false);
  const langs: string[] = [];
  const note = (ids: string[]): void => { for (const i of ids) if (!langs.includes(i)) langs.push(i); };
  const walkPkg = (pkg: string, kids: Item[]): void => {
    for (const k of kids) {
      const m = DEF.exec(k.head);
      if (!m) {
        const p = /^(?:library\s+)?(?:standard\s+)?package\s+([A-Za-z_]\w*)$/.exec(k.head);
        if (p && k.body) { note(classify(k.head)); walkPkg(pkg ? `${pkg}::${p[1]}` : p[1]!, k.body); continue; }
        const ids = classify(k.head);
        if (ids.length) {                                            // a valid construct the vault has no view for yet: classified, kept, not reported
          note(ids);
          if (k.body) { const holder: Definition = { keyword: "", pkg, name: "", symbol: "", specializes: [], usages: [], stmts: [], raw: [], notes: {}, langs: [] }; for (const c of k.body) interpret(c, holder); note(holder.langs); for (const r of holder.raw) warnings.push(`not recognized: ${r.slice(0, 80)}`); }
          continue;
        }
        if (k.head) warnings.push(`not recognized: ${k.head.slice(0, 80)}`);
        continue;
      }
      const d: Definition = { keyword: `${m[1]} def`, pkg, name: m[2]!, symbol: pkg ? `${pkg}::${m[2]}` : m[2]!, specializes: m[3] ? m[3].split(",").map((x) => x.trim()).filter(Boolean) : [], usages: [], stmts: [], raw: [], notes: {}, langs: classify(k.head) };
      for (const c of k.body ?? []) { if (/^doc ~D\d+$/.test(c.head) && d.doc === undefined) d.doc = docText(c.head); interpret(c, d); }
      for (const r of d.raw) warnings.push(`${d.symbol}: not recognized: ${r.slice(0, 80)}`);
      note(d.langs);
      defs.push(d);
    }
  };
  walkPkg("", items);
  return { defs, warnings, langs };
}
