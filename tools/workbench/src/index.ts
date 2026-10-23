/* The vault index: a disposable, in-memory picture built from the notes. It holds no model meaning of its own;
 * delete it and rebuild it from the files at any time. Relationships come from the SysML v2 text (and the few
 * MDSE-only YAML links); nothing here is read from a second store. */
import MDSE from "../../core/src/mdse_core.js";
import { scanSysml } from "./sysml_scan.ts";
import type { Definition } from "./sysml_scan.ts";

export interface Flag { type: string; title: string; detail: string }
export interface Note {
  path: string; name: string; folder: string; meta: Record<string, string>; type: string; subtype: string; id: string; uid: string; status: string;
  title: string; eaType: string; body: string; flags: Flag[]; sourceLines: string[]; guid: string; block: string | null; def: Definition | null; warnings: string[];
  links: Array<{ field: string; target: string }>; issues: string[];
}
/** `reverse` marks an edge whose SOURCE could not be resolved: `from` is the resolved end (the target), `toSymbol` is the unresolved source. */
/** Where an edge is written, so it can be changed or removed (D-0031): the note that holds the SysML text and the member inside it. */
export interface EdgeRef { owner: string; kind: "member" | "specializes" | "verify"; key: string }
export interface Edge { from: string; to: string | null; toSymbol: string; kind: string; label: string; via: "sysml" | "yaml"; detail: string; reverse?: boolean; ref?: EdgeRef }
export type ParserStatus = "not-run" | "passed" | "failed";

export interface ModelIndex {
  notes: Map<string, Note>; byId: Map<string, string>; bySymbol: Map<string, string>; byName: Map<string, string>;
  edges: Edge[]; out: Map<string, Edge[]>; inn: Map<string, Edge[]>;
  parser: ParserStatus; parserText: string; skipped: number; duplicates: string[]; builtMs: number;
}

export interface BuildOptions { classes?: Record<string, { prefix: string; subtype: string[] }>; parserReport?: string; yieldEvery?: number; yieldFn?: () => Promise<void> }

const CORE_KEYS = new Set(["type", "subtype", "id", "uid", "status", "eaType", "tags", "sourceRole", "primarySymbol", "aliases", "fixture"]);
const FLAG = /^> \[!(flag\w+)\] (.*)\n((?:>.*(?:\n|$))*)/gm;
export const baseName = (path: string): string => path.split("/").pop()!.replace(/\.md$/i, "");
const SYSML_TO_KIND: Record<string, string> = { part: "hasPart", port: "hasPort", action: "hasAction", state: "hasState", item: "hasFlow", requirement: "hasRequirement", verification: "hasVerification" };
const DEP_KIND: Record<string, string> = { derivedFrom: "derivedFrom", refines: "refines", trace: "trace", dependsOn: "dependsOn", uses: "uses" };

function readNote(path: string, text: string, o: BuildOptions): Note | null {
  let n: ReturnType<typeof MDSE.parse>;
  try { n = MDSE.parse(text); } catch { return null; }
  const m: Record<string, string> = n.meta;
  if (!m.type || !m.uid) return null;                                 // not a governed note
  const managed = n.h2.find(([, h]: [number, string]) => h === "## Source: EA" || h === "## SysML v2");
  const zone = n.text.slice(n.fmEnd, managed ? managed[0] : n.text.length);
  const flags: Flag[] = [];
  for (const f of zone.matchAll(FLAG)) flags.push({ type: f[1]!, title: f[2]!.trim(), detail: f[3]!.split("\n").map((l: string) => l.replace(/^>\s?/, "")).join("\n").trim() });
  const body = zone.replace(FLAG, "").replace(/^# .*\n?/m, "").trim();
  const title = /^# (.+)$/m.exec(zone)?.[1]?.trim() ?? baseName(path);
  const src = MDSE.extractSysml(text) as string | null;
  const srcText = n.text.slice((n.h2.find(([, h]: [number, string]) => h === "## Source: EA") ?? [n.text.length])[0]);
  const sourceLines = srcText.startsWith("## Source: EA") ? srcText.split("\n").slice(1).filter((l: string) => l.startsWith("- ")) : [];
  const guid = sourceLines.map((l: string) => /^- EA GUID: (.+)$/.exec(l)?.[1]).find(Boolean)?.trim() ?? "";
  const links: Note["links"] = [];
  for (const [k, v] of Object.entries(m)) if (!CORE_KEYS.has(k)) for (const x of String(v).matchAll(/\[\[([^\]|#]+)/g)) links.push({ field: k, target: x[1]!.trim() });
  let def: Definition | null = null, warnings: string[] = [];
  if (src) { const sc = scanSysml(src); def = sc.defs[0] ?? null; warnings = sc.warnings; if (sc.defs.length > 1) warnings.push(`${sc.defs.length} definitions in one note`); }
  const issues = o.classes ? (MDSE.validate(text, o.classes) as Array<{ code: string }>).map((i) => i.code) : [];
  return { path, name: baseName(path), folder: path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "", meta: m, type: m.type, subtype: m.subtype ?? "", id: m.id ?? "", uid: m.uid, status: m.status ?? "",
    title, eaType: m.eaType ?? "", body, flags, sourceLines, guid, block: src, def, warnings, links, issues };
}

function link(ix: ModelIndex, e: Edge): void {
  ix.edges.push(e);
  (ix.out.get(e.from) ?? ix.out.set(e.from, []).get(e.from)!).push(e);
  if (e.to) (ix.inn.get(e.to) ?? ix.inn.set(e.to, []).get(e.to)!).push(e);
}

function resolveAll(ix: ModelIndex): void {
  const sym = (s: string): string | null => ix.bySymbol.get(s) ?? null;
  for (const n of ix.notes.values()) {
    const d = n.def;
    if (d) {
      // A note owns one definition, but its nested usages can be the endpoints of
      // allocations, verification objectives and performed actions. Resolve local
      // usage names through their typed definitions so the canvas draws real notes
      // instead of orphaned "importer" / "repeatImport" ghost cards.
      const local = new Map(d.usages.filter((u) => u.type).map((u) => [u.name, u.type!] as const));
      const endpoint = (name: string): string | null =>
        sym(name) ?? (name === d.name || name === d.symbol ? n.path : null) ??
        (local.has(name) ? sym(local.get(name)!) : null);
      let ref: EdgeRef | undefined;
      const E = (kind: string, target: string | null, symbol: string, label = "", detail = "", from = n.path): void =>
        link(ix, { from, to: target, toSymbol: symbol, kind, label, via: "sysml", detail, ...(ref ? { ref } : {}) });
      for (const s of d.specializes) { ref = { owner: n.path, kind: "specializes", key: s }; E("specializes", sym(s), s); }
      for (const u of d.usages) if (u.type) { ref = { owner: n.path, kind: "member", key: u.head }; E(SYSML_TO_KIND[u.kind] ?? "has", sym(u.type), u.type, `${u.dir ? u.dir + " " : ""}${u.name}${u.mult ?? ""}`, (u.props ?? []).map((q) => `${q.name}=${q.value.replace(/^"|"$/g, "")}`).join("; ")); }
      for (const s of d.stmts) {
        ref = { owner: n.path, kind: s.kind === "verify" ? "verify" : "member", key: s.kind === "verify" ? s.a! : s.text };
        if (s.kind === "satisfy") E("satisfies", endpoint(s.a!), s.a!);
        else if (s.kind === "verify") E("verifies", endpoint(s.a!), s.a!, "", "", (s.context && endpoint(s.context)) || n.path);
        else if (s.kind === "perform") E("performs", endpoint(s.b!), s.b!, s.name ?? "", "", (s.context && endpoint(s.context)) || n.path);
        else if (s.kind === "include") E("includes", sym(s.b!), s.b!, s.name ?? "");
        else if (s.kind === "optionalUseCase") E("extendedBy", sym(s.b!), s.b!, s.name ?? "", s.tag ?? "");
        else if (s.kind === "nestedUseCase") E("has", sym(s.b!), s.b!, s.name ?? "", s.tag ?? "");
        else if (s.kind === "allocate" || s.kind === "dependency") {
          const kind = s.kind === "allocate" ? "allocatedTo" : DEP_KIND[s.tag ?? ""] ?? "dependsOn", a = endpoint(s.a!), b = endpoint(s.b!);
          if (a) E(kind, b, s.b!, "", "", a);                                              // source known: normal edge, target may dangle
          else if (b) link(ix, { from: b, to: null, toSymbol: s.a!, kind, label: "", via: "sysml", detail: "", reverse: true, ref });   // source missing: never a self-loop
          else E(kind, null, s.b!, "", "", n.path);
        }
      }
    }
    // A YAML link that repeats what the SysML block already says (the BOM importer lists hasPart in both) is one relationship, not two; counting both doubles every quantity in the rolled-up parts list.
    const said = new Set((ix.out.get(n.path) ?? []).filter((e) => e.via === "sysml" && e.to).map((e) => e.kind + "\u0000" + e.to));
    for (const l of n.links) {
      const t = ix.byName.get(l.target.toLowerCase()) ?? null;
      if (t && said.has(l.field + "\u0000" + t)) continue;
      link(ix, { from: n.path, to: t, toSymbol: l.target, kind: l.field, label: "", via: "yaml", detail: "" });
    }
  }
}

function newIndex(): ModelIndex {
  return { notes: new Map(), byId: new Map(), bySymbol: new Map(), byName: new Map(), edges: [], out: new Map(), inn: new Map(), parser: "not-run", parserText: "", skipped: 0, duplicates: [], builtMs: 0 };
}

function register(ix: ModelIndex, n: Note): void {
  ix.notes.set(n.path, n);
  if (n.id) { if (ix.byId.has(n.id)) ix.duplicates.push(`id ${n.id}: ${ix.byId.get(n.id)} and ${n.path}`); else ix.byId.set(n.id, n.path); }
  ix.byName.set(n.name.toLowerCase(), n.path);
  if (n.def) ix.bySymbol.set(n.def.symbol, n.path);
  if (n.meta.primarySymbol) ix.bySymbol.set(n.meta.primarySymbol, n.path);
}

function finish(ix: ModelIndex, o: BuildOptions, t0: number): ModelIndex {
  resolveAll(ix);
  const st = /Status:\s*\*\*([A-Z -]+)\*\*/.exec(o.parserReport ?? "")?.[1]?.trim().toLowerCase();
  ix.parser = st === "passed" || st === "pass" ? "passed" : st === "failed" || st === "fail" ? "failed" : "not-run";
  ix.parserText = o.parserReport ?? "";
  ix.builtMs = Date.now() - t0;
  return ix;
}

const isNote = (p: string): boolean => /\.md$/i.test(p) && !/(^|\/)\.obsidian\//.test(p) && !/^99_System\//.test(p);

export function buildIndex(files: Map<string, string>, o: BuildOptions = {}): ModelIndex {
  const t0 = Date.now(), ix = newIndex();
  for (const [p, t] of files) { if (!isNote(p)) continue; const n = readNote(p, t, o); if (n) register(ix, n); else ix.skipped++; }
  return finish(ix, o, t0);
}

/** Same result, built in slices so a large vault never freezes the window (staged startup, carried from V1). */
export async function buildIndexAsync(files: Map<string, string>, o: BuildOptions = {}, onProgress?: (done: number, total: number) => void): Promise<ModelIndex> {
  const t0 = Date.now(), ix = newIndex(), every = o.yieldEvery ?? 200, total = files.size;
  let i = 0;
  for (const [p, t] of files) {
    i++;
    if (isNote(p)) { const n = readNote(p, t, o); if (n) register(ix, n); else ix.skipped++; }
    if (i % every === 0) { onProgress?.(i, total); if (o.yieldFn) await o.yieldFn(); }
  }
  return finish(ix, o, t0);
}

export const outgoing = (ix: ModelIndex, path: string): Edge[] => ix.out.get(path) ?? [];
export const incoming = (ix: ModelIndex, path: string): Edge[] => ix.inn.get(path) ?? [];
