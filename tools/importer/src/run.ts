/* The import run: QEAX source graph -> notes, SysML v2 blocks, ledger, run record, changelog (IMP section; SPEC.md).
 * Pure: takes a reader and options, returns files. No DOM, no file-system access, no network.
 *
 * Provisional choices (D-0016, built to find where the rules break):
 *  - OD-01 split: native emission is limited to definitions, owned part/port/action/state usages, specialization and
 *    aggregation. Every other connector family is a flagLink with a ledger row, never a guessed relationship.
 *  - `emission_enabled: false` in ea-family-mapping.json is overridden by options.emitNative (default true). The
 *    pinned parser gate does not run in the page, so every block is reported "not checked" (MOD-139).
 *  - Unreviewed MOD/IMP rules are followed as written; each defaulted decision is recorded as ledger evidence. */
import MDSE from "../../core/src/mdse_core.js";
import { readSourceGraph } from "./ea_source.ts";
import type { ReaderLike, EaObject, EaConnector, SourceGraph } from "./ea_source.ts";
import { buildResolver, classify, isUsageEntry, connectorKey, DEFINITION_KINDS } from "./ea_mapping.ts";
import type { FamilyMapping, ElementEntry } from "./ea_mapping.ts";
import { allocateUids, allocateIds } from "./identity.ts";
import type { AuthorOptions } from "./identity.ts";
import { safeName, sysmlIdent, spellOut, usageIdent, identLosesName, IdentScope } from "./naming.ts";
import { renderBlock, parseMultiplicity } from "./sysml.ts";
import type { UsageDecl } from "./sysml.ts";
import { renderNote, flagCallout } from "./notes.ts";
import type { NoteModel } from "./notes.ts";
import { csv } from "./csv.ts";
import { renderTranslationDoc } from "./translation.ts";
import { planMerge } from "./merge.ts";
import type { ExistingVault, OutFile, ChangeEntry } from "./merge.ts";

export type { ExistingVault, OutFile, ChangeEntry } from "./merge.ts";

export interface ClassTable { [type: string]: { prefix: string; subtype: string[]; prefixBySubtype?: Record<string, string> } }

export interface TagTable { tags: Array<{ tag: string; disposition: string; decision?: string }> }
/** Placeholders EA writes when a tag has no real value (W-29). */
export const isPlaceholder = (v: string): boolean => { const t = v.trim().toLowerCase(); return t === "" || t === "unassigned" || t === "<memo>"; };

export interface ImportOptions {
  sourceName: string;
  fingerprint: string;
  runDate: string;                                 // local time, "YYYY-MM-DDTHH:MM:SS"
  lineage: string;                                 // source lineage label, MOD-018 (EA8647)
  authors: AuthorOptions;
  omitRootPackages: string[];                      // package names that are not folders (MOD-096)
  /** MOD-174 / D-0067: model folders go at most this deep (default 6; 0 = no cap). A deeper note sits in its ancestor at the cap and keeps its package path in a `Package:` line. */
  folderCap?: number;
  /** The person running the import; a new vault also gets their note in 99_System/04_People (BOO-003). */
  person?: { name: string; timezone: string };
  vaultName: string;
  releaseVersion: string;
  classes: ClassTable;
  mapping: FamilyMapping;
  tags: TagTable;                                  // EA tag dispositions, ea-tag-dispositions.json (IMP-003, IMP-005)
  baseFiles: Record<string, string> | null;        // Base Vault payload; written only when the output holds no vault
  existing: ExistingVault | null;
  preApproved: string[];                           // fields whose change is approved for the whole run (IMP-081, IMP-082)
  emitNative: boolean;
}

export interface LedgerRow {
  source_system: string; fixture_hash: string; source_table: string; source_pk: string; ea_guid: string; ea_type: string; ea_stereotype: string;
  source_package_id: string; rule_id: string; rule_version: string; disposition: string; target_semantic_kind: string; target_stable_id: string;
  target_file: string; evidence: string; diagnostic_code: string; confidence: string; operator_action: string;
}
const LEDGER_COLUMNS: Array<keyof LedgerRow> = ["source_system", "fixture_hash", "source_table", "source_pk", "ea_guid", "ea_type", "ea_stereotype", "source_package_id", "rule_id", "rule_version", "disposition", "target_semantic_kind", "target_stable_id", "target_file", "evidence", "diagnostic_code", "confidence", "operator_action"];

export interface ImportSummary {
  elements: number; connectors: number; packages: number; notes: number;
  dispositions: Record<string, number>; flags: number; sysmlBlocks: number; baseVaultIncluded: boolean;
  created: number; unchanged: number; updated: number; conflicts: number; errors: number;
}
export interface ErrorRecord { stage: string; table: string; pk: string; guid: string; name: string; message: string; stack: string }

/** A failure that stops the run. Carries the stage so the report says where it broke. */
export class ImportFailure extends Error {
  stage: string; detail: Record<string, unknown>;
  constructor(stage: string, message: string, detail: Record<string, unknown>, stack?: string) { super(message); this.name = "ImportFailure"; this.stage = stage; this.detail = detail; if (stack) this.stack = stack; }
}

export interface ImportResult {
  status: "WRITE_READY" | "NO_CHANGES" | "FAILED";
  files: OutFile[];
  ledger: LedgerRow[];
  changes: ChangeEntry[];
  summary: ImportSummary;
  problems: string[];
  /** Things to look at that do not stop the write, such as an EA tag with no disposition yet. */
  warnings: string[];
  errors: ErrorRecord[];
}

interface UsageRef { kind: UsageDecl["kind"]; name: string; typeDraft: Draft | null; mult?: string; objGuid: string; typedBy: string; dir?: "in" | "out" | "inout"; conj?: boolean; conn?: boolean; isRef?: boolean }
interface Draft {
  key: string; o: EaObject; family: string; entry: ElementEntry; type: string; subtype: string; evidence: string[];
  title: string; uid: string; id: string; baseName: string; path: string; ownDir: string | null; parent: Draft | null; children: Draft[];
  keyword: string | null; pkg: string; ident: string; symbol: string; specializes: Draft[]; usages: UsageRef[];
  flags: string[]; sourceLines: string[]; describes: string[]; links: Array<[string, Draft]>; existingPath?: string; pkgPath: string[]; members: string[]; verifies: string[];
}

const LEDGER_ORDER = ["t_package", "t_object", "t_connector"];
const RESERVED_NAME = /^(Template - |Rule - |README_|BASE_|CANVAS_)/;
const SYSTEM_DIR = "99_System/11_Import";
const MAX_ATTACH = 25 * 1024 * 1024;
const MAGIC: Array<[number[], string]> = [[[0x89, 0x50, 0x4e, 0x47], ".png"], [[0xff, 0xd8, 0xff], ".jpg"], [[0x47, 0x49, 0x46, 0x38], ".gif"], [[0x25, 0x50, 0x44, 0x46], ".pdf"], [[0x50, 0x4b, 3, 4], ".zip"], [[0x7b, 0x5c, 0x72, 0x74, 0x66], ".rtf"]];
const extOf = (name: string, bytes: Uint8Array): string => /\.[A-Za-z0-9]{1,5}$/.test(name) ? "" : (MAGIC.find(([m]) => m.every((b, i) => bytes[i] === b))?.[1] ?? ".bin");

const stampOf = (iso: string): string => iso.replace(/[-:T]/g, "").slice(0, 14) + "000";
/** The base vault with this vault's identity filled in: vault_uid, vault_name and author in .vault.yaml, and the person note for the
 * author (MOD-010, BOO-003) when `person` is given. */
export function initVaultFiles(base: Record<string, string>, o: { runDate: string; vaultName: string; code: string; release: string; person?: { name: string; timezone: string } }): OutFile[] {
  const vaultUid = `${stampOf(o.runDate)}${o.code}`;
  const out: OutFile[] = Object.entries(base).map(([path, text]) => ({ path, content: path === ".vault.yaml"
    ? text.replace(/^vault_uid:.*$/m, `vault_uid: ${vaultUid}`).replace(/^vault_name:.*$/m, `vault_name: ${o.vaultName}`).replace(/^author:.*$/m, `author: ${o.code}`).replace(/^mdse_release:.*$/m, `mdse_release: ${o.release}`) : text }));
  if (o.person) {
    const n = o.person.name.trim();
    out.push({ path: `99_System/04_People/${n.replace(/[\\/:*?"<>|]/g, "-")}.md`, content: `---\nname: ${JSON.stringify(n)}\nauthorCode: ${o.code}\ntimezone: ${o.person.timezone}\npreviousCodes: []\neaNames: []\ntags: [person]\n---\n# ${n}\n` });
  }
  return out;
}
const labelOf = (iso: string): string => iso.slice(0, 16).replace("T", " ").replace(":", ".");

export async function runImport(reader: ReaderLike, o: ImportOptions): Promise<ImportResult> {
  const track = { stage: "preflight" };
  try { return await runImportInner(reader, o, track); }
  catch (err) {
    if (err instanceof ImportFailure) throw err;
    const e = err as Error;
    throw new ImportFailure(track.stage, e?.message ?? String(err), { sourceName: o.sourceName, fingerprint: o.fingerprint, lineage: o.lineage }, e?.stack);
  }
}

async function runImportInner(reader: ReaderLike, o: ImportOptions, track: { stage: string }): Promise<ImportResult> {
  const problems: string[] = [];
  const errors: ErrorRecord[] = [];
  const guard = (stage: string, table: string, r: { id: number; guid: string; name?: string }, fn: () => void): void => {
    try { fn(); } catch (err) {
      const e = err as Error;
      errors.push({ stage, table, pk: String(r.id), guid: r.guid, name: r.name ?? "", message: e?.message ?? String(err), stack: (e?.stack ?? "").split("\n").slice(0, 8).join("\n") });
      for (const l of ledger) if (l.source_table === table && l.source_pk === String(r.id)) { l.disposition = "error"; l.diagnostic_code = "EXCEPTION"; l.evidence = (e?.message ?? "").slice(0, 200); }
    }
  };
  if (reader.walMode) throw new Error("SQLITE_WAL_MODE: close the model in EA or checkpoint it first; the WAL is not read (IMP-053)");
  track.stage = "read source";
  const g = await readSourceGraph(reader);
  track.stage = "classify elements";
  const resolver = buildResolver(o.mapping);
  const existing = o.existing && o.existing.hasVault ? o.existing : null;
  const idx = existing ? MDSE_INDEX(existing) : null;
  const runLabel = labelOf(o.runDate);
  const sourceLink = `[[${existing ? "Changelog" : "Import Run"} ${runLabel}]]`;

  // ---- package paths ---------------------------------------------------------------------------------------------
  const pathMemo = new Map<number, string[]>();
  const pkgPath = (id: number): string[] => {
    const hit = pathMemo.get(id); if (hit) return hit;
    const chain: string[] = [], seen = new Set<number>();
    for (let p = g.packages.get(id); p && !seen.has(p.id); p = g.packages.get(p.parentId)) { seen.add(p.id); chain.unshift(p.name); }
    while (chain.length && o.omitRootPackages.includes(chain[0]!)) chain.shift();
    const out = chain.map((n) => safeName(n, "Package"));
    pathMemo.set(id, out); return out;
  };

  // ---- ledger scaffolding ------------------------------------------------------------------------------------------
  const ledger: LedgerRow[] = [];
  const row = (table: string, pk: number, guid: string, type: string, stereo: string, pkgId: number, rule: string): LedgerRow => {
    const r: LedgerRow = { source_system: o.lineage, fixture_hash: o.fingerprint, source_table: table, source_pk: String(pk), ea_guid: guid, ea_type: type, ea_stereotype: stereo, source_package_id: String(pkgId), rule_id: rule, rule_version: resolver.version, disposition: "", target_semantic_kind: "", target_stable_id: "", target_file: "", evidence: "", diagnostic_code: "", confidence: "mapped", operator_action: "", };
    ledger.push(r); return r;
  };
  const set = (r: LedgerRow, disposition: string, kind: string, diag = "", action = ""): void => { r.disposition = disposition; r.target_semantic_kind = kind; r.diagnostic_code = diag; r.operator_action = action; };

  for (const p of g.packages.values()) { const r = row("t_package", p.id, p.guid, "Package", "", p.parentId, "folder_only"); set(r, "native", "Folder"); r.target_file = ((c) => (c > 0 ? pkgPath(p.id).slice(0, c) : pkgPath(p.id)))(o.folderCap ?? 6).join("/"); }

  // ---- elements: family -> disposition --------------------------------------------------------------------------
  const drafts: Draft[] = [], byObj = new Map<number, Draft>();
  const usageObjs: Array<{ o: EaObject; entry: ElementEntry; row: LedgerRow }> = [];
  const boundaries: Array<{ o: EaObject; row: LedgerRow }> = [];
  const triggerObjs: Array<{ o: EaObject; row: LedgerRow }> = [];
  const objRow = new Map<number, LedgerRow>();
  for (const e of g.objects) guard("classify", "t_object", e, () => {
    const key = e.stereotype ? `${e.type}:${e.stereotype}` : e.type;
    const r = row("t_object", e.id, e.guid, e.type, e.stereotype, e.packageId, "family:" + key); objRow.set(e.id, r);
    if (e.type === "Package") { set(r, "native", "Folder"); r.rule_id = "folder_only"; return; }
    const hit = resolver.element(e.type, e.stereotype);
    if (!hit) { set(r, "deferred_review", "", "UNKNOWN_FAMILY", "Map this family or confirm it is out of scope"); r.confidence = "unmapped"; return; }
    const en = hit.entry;
    if (isUsageEntry(en)) { usageObjs.push({ o: e, entry: en, row: r }); return; }
    if (en.family === "Synchronization") { usageObjs.push({ o: e, entry: en, row: r }); return; }
    if (en.family === "Trigger") { triggerObjs.push({ o: e, row: r }); return; }
    if (en.disposition === "native_candidate" && en.native_kind && DEFINITION_KINDS[en.native_kind] || en.disposition === "mdse_note" || en.disposition === "attachment_link") {
      const cls = classify(en, e, pkgPath(e.packageId));
      if (!cls || !o.classes[cls.type]) { set(r, "error", "", "NO_CLASS_FOR_FAMILY"); problems.push(`element ${e.id} ${key}: no MDSE class`); return; }
      const kw = en.native_kind ? (en.native_kind === "InterfaceDefinition" ? "port def" : DEFINITION_KINDS[en.native_kind] ?? null) : null;   // IMP-104: an EA interface Class is what ports are typed by, so it is a port def
      const title = e.name.trim() || e.alias.trim() || `Unnamed ${e.id}`;
      const d: Draft = { key: `o:${e.id}`, o: e, family: key, entry: en, type: cls.type, subtype: cls.subtype, evidence: cls.evidence, title, uid: "", id: "", baseName: "", path: "", ownDir: null, parent: null, children: [], keyword: kw && o.emitNative ? kw : null, pkg: "", ident: sysmlIdent(spellOut(title)), symbol: "", specializes: [], usages: [], flags: [], sourceLines: [], describes: [], links: [], pkgPath: pkgPath(e.packageId), members: [], verifies: [] };
      for (const c of en.conditional_evidence) d.evidence.push("REVIEW:" + c);
      drafts.push(d); byObj.set(e.id, d); return;
    }
    if (en.disposition === "reference_only") { set(r, "evidence_only", "", "REFERENCE_ONLY"); return; }
    if (en.disposition === "aggregate_boundary_note") { boundaries.push({ o: e, row: r }); return; }
    if (en.disposition === "conditional_review") { set(r, "deferred_review", "", en.conditional_evidence[0] ?? "CONDITIONAL_REVIEW", "Needs the evidence named in the diagnostic"); return; }
    set(r, "deferred_review", "", "UNHANDLED_DISPOSITION_" + en.disposition);
  });

  // IMP-111 (V1 W-135, EXC "Object classifier = specialization"): an EA Object points at the Class it is a kind of through Classifier; the part def specializes it (never typing).
  for (const d of drafts) if (d.o.type === "Object" && d.keyword === "part def") { const t = byObj.get(d.o.classifier); if (t && t !== d && t.keyword === "part def" && !d.specializes.includes(t)) d.specializes.push(t); }

  track.stage = "identity";
  // ---- identity ------------------------------------------------------------------------------------------------------
  const taken = new Set<string>(idx ? idx.uids : []);
  const fresh = drafts.filter((d) => !idx?.byGuid.has(d.o.guid));
  const aggregate = boundaries.length ? { created: boundaries.map((b) => b.o.created).sort()[0] ?? "", guid: "boundary-aggregate" } : null;
  const uidReqs = fresh.map((d) => ({ key: d.key, created: d.o.created, guid: d.o.guid, author: d.o.author }));
  if (aggregate && !idx?.byGuid.has(aggregate.guid)) uidReqs.push({ key: "boundary", created: aggregate.created, guid: aggregate.guid, author: "" });
  const uids = allocateUids(uidReqs, o.authors, taken, "20000101000000000");
  const highest = idx ? new Map(idx.highest) : new Map<string, number>();
  const prefixOf = (type: string, subtype: string): string => { const c = o.classes[type]!; return c.prefixBySubtype?.[subtype] ?? c.prefix; };
  const idReqs = fresh.map((d) => ({ key: d.key, prefix: prefixOf(d.type, d.subtype), created: d.o.created, guid: d.o.guid }));
  if (uids.has("boundary")) idReqs.push({ key: "boundary", prefix: prefixOf("modelCheck", "Boundary"), created: aggregate!.created, guid: aggregate!.guid });
  const ids = allocateIds(idReqs, highest);
  for (const d of drafts) {
    const known = idx?.byGuid.get(d.o.guid);
    if (known) { d.uid = known.uid; d.id = known.id; d.existingPath = known.path; }
    else { d.uid = uids.get(d.key)!.uid; d.id = ids.get(d.key)!; for (const ev of uids.get(d.key)!.evidence) d.evidence.push(ev); }
    d.pkg = d.id.replace("-", "_"); d.symbol = `${d.pkg}::${d.ident}`;
  }

  track.stage = "placement";
  // ---- placement: folders, file names -----------------------------------------------------------------------------
  for (const d of drafts) { const p = byObj.get(d.o.parentId); if (p && p !== d) { d.parent = p; p.children.push(d); } }
  const claimed = new Set<string>(idx ? idx.baseNames : []);
  const claim = (want: string): string => {
    let base = want; if (RESERVED_NAME.test(base)) { problems.push(`reserved name collision: ${base}`); base = "EA " + base; }
    let n = 1, name = base;
    while (claimed.has(name.toLowerCase())) { n++; name = `${base}~${n}`; }
    claimed.add(name.toLowerCase()); return name;
  };
  const order = [...drafts].sort((a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  for (const d of order) d.baseName = d.existingPath ? d.existingPath.split("/").pop()!.replace(/\.md$/, "") : claim(d.id);   // MOD-170 (D-0068): a model note's file is its id; the name is the `name` property
  const cap = o.folderCap ?? 6, atCap = (parts: string[]): string[] => (cap > 0 ? parts.slice(0, cap) : parts);
  const dirParts = (d: Draft): string[] => atCap(d.parent ? [...dirParts(d.parent), d.parent.baseName] : d.pkgPath);
  const dirOf = (d: Draft): string => dirParts(d).join("/");
  const ownDirOf = (d: Draft): string => [...dirParts(d), d.baseName].join("/");
  const lkRaw = (d: Draft): string => `${d.baseName}|${d.title.replace(/[|\[\]#^\n]/g, " ").replace(/\s+/g, " ").trim()}`;
  const lk = (d: Draft): string => `[[${lkRaw(d)}]]`;   // a link in a Source line shows the name (D-0068); links in properties stay `[[file]]`
  for (const d of drafts) {
    if (d.existingPath) { d.path = d.existingPath; continue; }
    const dir = dirOf(d);
    d.path = d.children.length && (cap <= 0 || dirParts(d).length < cap) ? `${ownDirOf(d)}/${d.baseName}.md` : `${dir ? dir + "/" : ""}${d.baseName}.md`;
  }

  track.stage = "usages";
  // ---- usages owned by definitions -----------------------------------------------------------------------------------
  const scopes = new Map<Draft, IdentScope>();
  const scopeOf = (d: Draft): IdentScope => scopes.get(d) ?? (scopes.set(d, new IdentScope()), scopes.get(d)!);
  const flagLink = (d: Draft, title: string, detail: string[]): void => { d.flags.push(flagCallout("flagLink", title, sourceLink, detail)); };
  const ownerKeyword: Record<string, string[]> = { PartUsage: ["part def"], PortUsage: ["part def"], ActionUsage: ["action def", "verification def", "state def"], StateUsage: ["state def"], SyncNode: ["action def", "verification def", "state def"] };   // a verification case is an action; a state owns actions (entry, do, exit)
  // IMP-105: PDATA1/2/3 hold the GUID of another element ({...}); a plain number is accepted too.
  const byGuid = new Map<string, EaObject>(g.objects.map((x) => [x.guid.toLowerCase(), x] as const));
  const refObj = (s: string): EaObject | undefined => { const t = s.trim(); if (!t) return undefined; return t.startsWith("{") ? byGuid.get(t.toLowerCase()) : /^\d+$/.test(t) ? g.objectsById.get(Number(t)) : undefined; };
  const refDraft = (s: string): Draft | null => { const x = refObj(s); return x ? byObj.get(x.id) ?? null : null; };
  const isInstancePort = (e: EaObject): boolean => e.type === "Port" && g.objectsById.get(e.parentId)?.type === "Part";
  const phase = (u: { o: EaObject; entry: ElementEntry }): number => (u.entry.native_kind === "ItemUsage" ? 3 : u.entry.native_kind === "PortUsage" ? (isInstancePort(u.o) ? 2 : 1) : 0);
  usageObjs.sort((a, b) => phase(a) - phase(b) || a.o.id - b.o.id);
  const usageByObj = new Map<number, { owner: Draft; ref: UsageRef }>();
  const tagDispOf = new Map(o.tags.tags.map((t) => [t.tag, t.disposition] as const));
  const carrierOf = new Map<number, number>();                      // instance port (EA Port under a Part) -> that Part
  const partIndex = new Map<string, number>();
  const addedPorts = new Map<string, UsageRef>();                   // block + port name -> the port added from assemblies
  const flowIn = new Map<number, number>(), flowOut = new Map<number, number>();
  for (const c of g.connectors) if (connectorKey(c) === "ControlFlow") { flowOut.set(c.sourceId, (flowOut.get(c.sourceId) ?? 0) + 1); flowIn.set(c.destId, (flowIn.get(c.destId) ?? 0) + 1); }
  const flowItem = (u: { o: EaObject; entry: ElementEntry; row: LedgerRow }): void => {
    const e = u.o;
    let ownerDef = byObj.get(e.parentId) ?? null;
    if (!ownerDef) { const po = g.objectsById.get(e.parentId); if (po && po.type === "Port") ownerDef = usageByObj.get(po.id)?.ref.typeDraft ?? refDraft(po.pdata1); }   // flow item under a port usage: its port def owns it
    if (!ownerDef || ownerDef.keyword !== "port def") { set(u.row, "deferred_review", "ItemUsage", "FLOW_OWNER_NOT_PORT_DEF", "Move the flow item under its port definition"); return; }
    const tag = ((g.tags.get(e.id) ?? []).find(([k]) => /^(flow ?)?direction$/i.test(k.trim()))?.[1] ?? "").trim().toLowerCase();
    const dir = tag === "in" || tag === "out" || tag === "inout" ? tag : tag === "in/out" || tag === "bidirectional" ? "inout" : null;
    if (!dir) { set(u.row, "deferred_review", "ItemUsage", "DIRECTION_EVIDENCE_MISSING", "Set the flow direction (in, out, inout)"); return; }
    const t = refDraft(e.pdata1) ?? byObj.get(e.classifier), typed = t && (t.keyword === "item def" || t.keyword === "attribute def") ? t : null;
    const name = scopeOf(ownerDef).take(usageIdent(e.name || e.alias, `flow${e.id}`));
    const ref: UsageRef = { kind: "item", dir, name, typeDraft: typed, objGuid: e.guid, typedBy: typed?.title ?? "" };
    ownerDef.usages.push(ref); usageByObj.set(e.id, { owner: ownerDef, ref });
    set(u.row, "native", "ItemUsage", typed ? "" : "UNRESOLVED_FLOW_TYPE", typed ? "" : "Set the PDATA1 type to the Signal this flow carries");
    u.row.target_stable_id = ownerDef.id; u.row.target_file = ownerDef.path;
    if (!typed) flagLink(ownerDef, `Untyped flow item \`${name}\``, [`The EA FlowProperty \`${e.name}\` has no Signal as its type. It is written without a type.`]);
  };
  // IMP-106 (V1 W-114): a Port under a Part is the Part's block's own port. Merge it by PDATA3, else by a unique same name, else add it to the block.
  const instancePort = (u: { o: EaObject; entry: ElementEntry; row: LedgerRow }): void => {
    const e = u.o, carrier = g.objectsById.get(e.parentId)!;
    const block = refDraft(carrier.pdata1);
    if (!block || block.keyword !== "part def") { set(u.row, "deferred_review", "PortUsage", "USAGE_WITHOUT_NOTE_OWNER", "The Part this port sits on has no block in PDATA1"); return; }
    const typeOf = refDraft(e.pdata1), typePort = typeOf?.keyword === "port def" ? typeOf : null;
    const eaName = (e.name || e.alias).trim();
    const named = refObj(e.pdata3);
    let ref: UsageRef | undefined = named && named.type === "Port" && named.parentId === block.o.id ? usageByObj.get(named.id)?.ref : undefined, how = ref ? "PDATA3" : "";
    if (!ref && eaName) {
      const same = block.usages.filter((x) => x.kind === "port" && (g.objects.find((q) => q.guid === x.objGuid)?.name ?? "").trim() === eaName);
      if (same.length === 1) { ref = same[0]; how = "SAME_NAME"; }
    }
    let added = false;
    if (!ref) {
      const key = `${block.o.id}|${eaName}`;
      ref = eaName ? addedPorts.get(key) : undefined;
      if (ref) how = "SAME_NAME_ADDED";
      else {
        const name = scopeOf(block).take(usageIdent(/^\d+$/.test(eaName) && typePort ? `${typePort.title} ${eaName}` : eaName || typePort?.title || "", `port${e.id}`), typePort?.title ?? "");
        ref = { kind: "port", name, typeDraft: null, objGuid: e.guid, typedBy: "" };
        block.usages.push(ref); if (eaName) addedPorts.set(key, ref); added = true; how = "ADDED";
        flagLink(block, `Port \`${name}\` added from an assembly`, [`The EA Port \`${eaName || "(unnamed)"}\` sits on a Part of this block and no port on the block matches it (no PDATA3 target, no unique same name). It is written on the block as its own port. Review it.`]);
      }
    }
    if (typePort) { if (!ref.typeDraft) { ref.typeDraft = typePort; ref.typedBy = typePort.title; } else if (ref.typeDraft !== typePort) block.sourceLines.push(`- Port ${ref.name} is also typed ${lk(typePort)} on a Part`); }
    if (!ref.mult) { const m = parseMultiplicity(e.multiplicity); if (m.text) ref.mult = m.text; }
    usageByObj.set(e.id, { owner: block, ref }); carrierOf.set(e.id, carrier.id);
    set(u.row, "native", "PortUsage", added ? "PORT_ADDED_TO_BLOCK" : "MERGED_INTO_BLOCK_PORT", added ? "Review: port added to the block from an assembly" : "");
    u.row.evidence = `merged into ${block.title}.${ref.name} by ${how}`; u.row.target_stable_id = block.id; u.row.target_file = block.path;
  };
  for (const u of usageObjs) guard("usage", "t_object", u.o, () => {
    const e = u.o;
    let kind = u.entry.native_kind ?? "SyncNode";
    if (kind === "ItemUsage") { flowItem(u); return; }
    if (kind === "PortUsage" && isInstancePort(e)) { instancePort(u); return; }
    const owner = byObj.get(e.parentId);
    if (!owner || !owner.keyword) { set(u.row, "deferred_review", kind, "USAGE_WITHOUT_NOTE_OWNER", "Owner is not a definition note"); return; }
    // IMP-107 (V1 W-137): a Part inside an action or state definition that points at another action or state is that action or state used there
    const partTarget = kind === "PartUsage" ? refDraft(e.pdata1) : null;
    if (kind === "PartUsage" && owner.keyword === "action def" && partTarget?.keyword === "action def") kind = "ActionUsage";
    else if (kind === "PartUsage" && owner.keyword === "state def" && partTarget?.keyword === "state def") kind = "StateUsage";
    if (!ownerKeyword[kind]?.includes(owner.keyword)) { set(u.row, "deferred_review", kind, "USAGE_OWNER_KIND_MISMATCH", `${kind} inside ${owner.keyword}`); return; }
    if (kind === "SyncNode") {                                      // fork or join, decided by how many control flows meet it
      const nIn = flowIn.get(e.id) ?? 0, nOut = flowOut.get(e.id) ?? 0;
      const word = nOut > 1 && nIn <= 1 ? "fork" : nIn > 1 && nOut <= 1 ? "join" : null;
      if (!word) { set(u.row, "deferred_review", "SyncNode", "FORK_JOIN_AMBIGUOUS", `${nIn} in, ${nOut} out: neither a fork nor a join`); return; }
      const nm = scopeOf(owner).take(usageIdent(e.name || e.alias, `${word}${e.id}`));
      const sref: UsageRef = { kind: word, name: nm, typeDraft: null, objGuid: e.guid, typedBy: "" };
      owner.usages.push(sref); usageByObj.set(e.id, { owner, ref: sref });
      set(u.row, "native", word === "fork" ? "ForkNode" : "JoinNode"); u.row.target_stable_id = owner.id; u.row.target_file = owner.path;
      return;
    }
    const ref: UsageRef = { kind: kind === "PartUsage" ? "part" : kind === "PortUsage" ? "port" : kind === "ActionUsage" ? "action" : "state", name: "", typeDraft: null, objGuid: e.guid, typedBy: "" };
    let diag = "";
    if (kind === "PartUsage" || kind === "PortUsage" || kind === "ActionUsage" || (kind === "StateUsage" && partTarget)) {
      const target = kind === "ActionUsage" && !partTarget ? byObj.get(e.classifier) : kind === "PortUsage" ? refDraft(e.pdata1) : partTarget ?? (kind === "PartUsage" ? null : byObj.get(e.classifier));
      const want = kind === "PartUsage" ? (e.pdata1.trim() ? 1 : 0) : kind === "PortUsage" ? (e.pdata1.trim() ? 1 : 0) : e.classifier;
      const okKind = kind === "PartUsage" ? "part def" : kind === "PortUsage" ? "port def" : kind === "StateUsage" ? "state def" : "action def";
      if (target && target.keyword === okKind) { ref.typeDraft = target; ref.typedBy = target.title; }
      else if (kind === "ActionUsage" && !want) { /* a plain step in an activity has no type; that is not a gap */ }
      else if (kind === "PortUsage" && !want) { diag = "UNRESOLVED_PORT_TYPE"; }
      else if (kind === "PortUsage" && target) {                                          // W-127: a Port typed by something that is not a port definition (a connector, a signal)
        diag = `UNRESOLVED_PORT_TYPE:TARGET_IS_${(target.keyword ?? "NOTE").replace(" ", "_").toUpperCase()}`; owner.sourceLines.push(`- Port ${e.name || e.alias || e.id} is typed by ${lk(target)}`);
      }
      else { diag = kind === "PartUsage" ? "UNRESOLVED_PART_TYPE" : kind === "PortUsage" ? "UNRESOLVED_PORT_TYPE" : "UNRESOLVED_ACTION_TYPE"; if (target) diag += `:TARGET_IS_${(target.keyword ?? "NOTE").replace(" ", "_").toUpperCase()}`; }
    }
    // IMP-110: a usage with no name of its own takes the name of its typed element (EA created these when the element was added as a part)
    const rawName = (e.name || e.alias || "").trim(), wantRaw = /^\d+$/.test(rawName) && ref.typeDraft ? `${ref.typeDraft.title} ${rawName}` : rawName || ref.typeDraft?.title || "";   // IMP-124: a bare number is named after its type (`wire1`), not `_1`
    let wantId = usageIdent(wantRaw, `${kind.replace("Usage", "").toLowerCase()}${e.id}`);
    if (kind === "PartUsage" && !rawName && ref.typeDraft) { const key = `${owner.key}|${ref.typeDraft.key}`, n = (partIndex.get(key) ?? 0) + 1; partIndex.set(key, n); wantId = usageIdent(ref.typeDraft.title, "part") + n; }   // IMP-127: a part with no role name of its own is its type and an index: `wire1`, `wire2`
    const name = scopeOf(owner).take(wantId, ref.typeDraft?.title ?? "");
    ref.name = name;
    if (rawName && !/^\d+$/.test(rawName) && identLosesName(rawName, wantId)) owner.sourceLines.push(`- ${ref.kind === "port" ? "Port" : "Part"} ${name} is named "${rawName}" in EA`);   // IMP-124: the EA name, where the identifier cannot hold it
    if (kind === "PartUsage" && (g.tags.get(e.id) ?? []).some(([k, v]) => /^isReference$/i.test(k.trim()) && /^(true|yes|1|-1)$/i.test(v.trim()))) ref.isRef = true;   // IMP-121: a reference part (REG-293)
    if ((kind === "PortUsage" || kind === "PartUsage") && e.pdata2.trim()) { const rd = refObj(e.pdata2); if (rd) owner.sourceLines.push(`- ${ref.kind === "port" ? "Port" : "Part"} ${name} is a redefinition of ${rd.name || rd.alias || rd.id} in EA (PDATA2); not applied, redefinition is never inferred (REG-189)`); }
    if (kind === "PortUsage" && ref.typeDraft && (g.tags.get(e.id) ?? []).some(([k, v]) => /^(is)?conjugat(ed|e)$/i.test(k.trim()) && /^(true|yes|1|-1)$/i.test(v.trim()))) ref.conj = true;   // port conjugation, from an isConjugated tag (EA stores -1 for true)
    if (kind === "PartUsage" || kind === "PortUsage") { const m = parseMultiplicity(e.multiplicity); if (m.text) ref.mult = m.text; if (!m.ok) diag = (diag ? diag + ";" : "") + "MULTIPLICITY_UNPARSED"; }
    owner.usages.push(ref); usageByObj.set(e.id, { owner, ref });
    // IMP-119 (V1 W-136, REG-142): what the EA says about this use of the part (PN, Piece Cost, Style...) belongs to the assembly, as a line on the owner's note
    if (kind === "PartUsage") {
      const onUse = (g.tags.get(e.id) ?? []).filter(([k, v]) => !isPlaceholder(v) && tagDispOf.get(k) === "body");
      if (onUse.length) owner.sourceLines.push(`- On ${ref.kind} ${name}: ${onUse.map(([k, v]) => `${k}: ${v.replace(/\s*\n\s*/g, " ")}`).join("; ")}`);
    }
    set(u.row, "native", kind, diag.split(";").find((x) => x.startsWith("UNRESOLVED")) ?? diag, diag ? "Review: usage written without a type" : "");
    u.row.target_stable_id = owner.id; u.row.target_file = owner.path; if (diag) u.row.evidence = diag;
    if (diag.startsWith("UNRESOLVED")) flagLink(owner, `Untyped ${ref.kind} usage \`${name}\``, [`The EA ${u.o.type} \`${e.name}\` has no resolvable definition of the right kind (${diag}). It is written without a type.`]);
  });

  for (const t of triggerObjs) guard("trigger", "t_object", t.o, () => {
    const owner = byObj.get(t.o.parentId);
    if (owner?.keyword === "state def") {
      owner.sourceLines.push(`- Trigger: ${t.o.name || "(unnamed)"}`);
      set(t.row, "evidence_only", "TriggerLine", "TRIGGER_RECORDED_ON_OWNER"); t.row.target_stable_id = owner.id; t.row.target_file = owner.path; return;
    }
    set(t.row, "deferred_review", "", "LEGAL_TRANSITION_CONTEXT", "Trigger is not inside a state definition");
  });
  // IMP-114 (approved: nested states, activities, requirements): an element nested under one of its own kind is a usage of it in the owner.
  // No folder or note changes; the nested element keeps its own note and the owner gains `action x : X;` / `state x : X;` / `requirement x : X;`.
  const nestedRef = new Map<string, UsageRef>();                     // `${owner id}|${child id}`
  const NESTED: Array<[string, string[], UsageRef["kind"]]> = [["action def", ["action def", "verification def", "state def"], "action"], ["state def", ["state def"], "state"], ["requirement def", ["requirement def"], "requirement"]];
  for (const d of order) {
    const p = d.parent; if (!p || !d.keyword || !p.keyword) continue;
    const rule = NESTED.find(([ck, owners]) => ck === d.keyword && owners.includes(p.keyword!)); if (!rule) continue;
    const ref: UsageRef = { kind: rule[2], name: scopeOf(p).take(usageIdent(d.title, `${rule[2]}${d.o.id}`)), typeDraft: d, objGuid: d.o.guid, typedBy: d.title };
    p.usages.push(ref); nestedRef.set(`${p.o.id}|${d.o.id}`, ref);
  }
  track.stage = "connectors";
  // ---- connectors ---------------------------------------------------------------------------------------------------
  // IMP-108 (V1 W-136/REG-113): a Part is a carrier for the block it points at (PDATA1); a connector on a Part acts on that block, not on the usage.
  const endDraft = (id: number): Draft | undefined => {
    const d = byObj.get(id); if (d) return d;
    const x = g.objectsById.get(id); return x && x.type === "Part" ? refDraft(x.pdata1) ?? undefined : undefined;
  };
  const deferredLinks: Array<{ c: EaConnector; code: string; family: string }> = [];
  const hostlessLinks: Array<{ c: EaConnector; code: string; family: string; row: LedgerRow }> = [];
  // IMP-096: what the SysML block says is not repeated in Source: EA. `line` is kept only where it carries something SysML does not (a guard or trigger text).
  const addStmt = (d: Draft, text: string, line = ""): void => { if (!d.members.includes(text)) d.members.push(text); if (/^- (Succession|Transition) /.test(line) && !d.sourceLines.includes(line)) d.sourceLines.push(line); };
  const DEP_WORD: Record<string, string> = { "Dependency:refine": "refines", "Abstraction:Refine": "refines", "Realisation:refine": "refines", "Dependency:trace": "trace", "Abstraction:trace": "trace", Dependency: "dependsOn", Usage: "uses" };
  const DERIVE = new Set(["Realisation:deriveReqt", "Dependency:deriveReqt", "Dependency:RecoveryRequirement", "Abstraction:Derive"]);
  const ALLOCATE = new Set(["Abstraction:allocate", "Usage:Responsibility"]);
  // IMP-113 (Test_Vault_ approved aggregation docs): the child of an Aggregation is a usage in the whole, of the kind its definitions are.
  const AGG: Record<string, UsageRef["kind"] | "use case"> = { "part def|part def": "part", "action def|action def": "action", "verification def|action def": "action", "state def|state def": "state", "item def|item def": "item", "use case def|use case def": "use case", "requirement def|requirement def": "requirement", "part def|port def": "port" };
  const KIND_NAME: Record<string, string> = { part: "TypedOwnedUsage", action: "ActionUsage", state: "StateUsage", item: "ItemUsage", requirement: "RequirementUsage", port: "PortUsage", "use case": "NestedUseCaseUsage" };
  interface AggEnds { whole: Draft | undefined; part: Draft | undefined; card: string; role: string }
  const aggEnds = (c: EaConnector): AggEnds | { code: string } => {
    const sw = c.sourceIsAggregate === 1 || c.sourceIsAggregate === 2, dw = c.destIsAggregate === 1 || c.destIsAggregate === 2;
    if (sw === dw) return { code: sw ? "AGGREGATION_BOTH_ENDS_AGGREGATE" : "AGGREGATION_WHOLE_NOT_EVIDENCED" };
    return sw ? { whole: endDraft(c.sourceId), part: endDraft(c.destId), card: c.destCard, role: c.destRole } : { whole: endDraft(c.destId), part: endDraft(c.sourceId), card: c.sourceCard, role: c.sourceRole };
  };
  // Ownership cycles (approved): an aggregation whose whole and part sit in one cycle of ownership is left out, with its source evidence. Existing usages count as edges.
  const aggCycle = new Set<number>();
  {
    const edges = new Map<Draft, Draft[]>(), add = (a: Draft, b: Draft): void => { (edges.get(a) ?? edges.set(a, []).get(a)!).push(b); };
    for (const d of drafts) for (const u of d.usages) if (u.typeDraft && u.kind !== "port") add(d, u.typeDraft);
    const cand: Array<{ c: EaConnector; w: Draft; p: Draft }> = [];
    for (const c of g.connectors) if (connectorKey(c) === "Aggregation") { const e = aggEnds(c); if ("code" in e || !e.whole || !e.part || !AGG[`${e.whole.keyword}|${e.part.keyword}`]) continue; cand.push({ c, w: e.whole, p: e.part }); add(e.whole, e.part); }
    const index = new Map<Draft, number>(), low = new Map<Draft, number>(), onStack = new Set<Draft>(), stack: Draft[] = [], comp = new Map<Draft, number>(); let counter = 0, comps = 0;
    for (const root of edges.keys()) {
      if (index.has(root)) continue;
      const work: Array<[Draft, number]> = [[root, 0]]; index.set(root, counter); low.set(root, counter++); stack.push(root); onStack.add(root);
      while (work.length) {
        const top = work[work.length - 1]!, v = top[0], outs = edges.get(v) ?? [];
        if (top[1] < outs.length) {
          const w = outs[top[1]++]!;
          if (!index.has(w)) { index.set(w, counter); low.set(w, counter++); stack.push(w); onStack.add(w); work.push([w, 0]); }
          else if (onStack.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
        } else {
          work.pop();
          if (work.length) { const par = work[work.length - 1]![0]; low.set(par, Math.min(low.get(par)!, low.get(v)!)); }
          if (low.get(v) === index.get(v)) { let w: Draft; do { w = stack.pop()!; onStack.delete(w); comp.set(w, comps); } while (w !== v); comps++; }
        }
      }
    }
    const size = new Map<number, number>(); for (const k of comp.values()) size.set(k, (size.get(k) ?? 0) + 1);
    for (const { c, w, p } of cand) if (w === p || (comp.get(w) !== undefined && comp.get(w) === comp.get(p) && (size.get(comp.get(w)!) ?? 0) > 1)) aggCycle.add(c.id);
  }
  const matched = new Set<UsageRef>();                                // EA usages (Part, nested element) already matched to one aggregation connector
  const actorSeen = new Set<string>();
  // a flow end: a usage the importer wrote, or the usage of a nested definition in its owner (IMP-114)
  const endUsage = (id: number): { owner: Draft; ref: UsageRef } | undefined => {
    const u = usageByObj.get(id); if (u) return u;
    const dd = byObj.get(id), pr = dd?.parent; const nr = dd && pr ? nestedRef.get(`${pr.o.id}|${dd.o.id}`) : undefined;
    return nr && pr ? { owner: pr, ref: nr } : undefined;
  };
  const DESCRIBER = new Set(["Info", "Artifact", "Document"]);
  for (const c of g.connectors) guard("connector", "t_connector", c, () => {
    const key = connectorKey(c);
    const r = row("t_connector", c.id, c.guid, c.type, c.stereotype, 0, "family:" + key);
    const src = endDraft(c.sourceId), dst = endDraft(c.destId);
    const defer = (code: string, action = "Native relationship not emitted"): void => {
      set(r, "deferred_review", "", code, action); deferredLinks.push({ c, code, family: key });
      // Every deferred connector leaves a flag in the vault: on the source note, else on the note that owns the source or target usage.
      const eName = (id: number): string => g.objectsById.get(id)?.name ?? `object ${id}`;
      const host = src ?? usageByObj.get(c.sourceId)?.owner ?? dst ?? usageByObj.get(c.destId)?.owner;
      if (host) {
        const to = dst ? lk(dst) : eName(c.destId);
        const from = host === src ? "" : ` from ${src ? lk(src) : eName(c.sourceId)}`;
        host.sourceLines.push(`- Connector ${key}${from} to ${to} (unresolved: ${code})`);
        flagLink(host, `Unresolved ${key} link${from} to ${dst ? dst.title : eName(c.destId)}`, [`No native relationship was written (${code}). See the ledger row for EA connector ${c.guid}.`]);
      } else hostlessLinks.push({ c, code, family: key, row: r });
    };
    const done = (owner: Draft, kind: string, diag = "UNVERIFIED_SYNTAX"): void => { set(r, "native", kind, diag); r.target_stable_id = owner.id; r.target_file = owner.path; };
    const hit = resolver.relationship(c.type, c.stereotype);
    if (!hit) { r.confidence = "unmapped"; defer("UNKNOWN_FAMILY", "Map this connector family or confirm it is out of scope"); return; }
    if (!g.objectsById.has(c.sourceId) || !g.objectsById.has(c.destId)) { defer("ENDPOINT_MISSING_IN_SOURCE"); return; }
    const en = hit.entry;
    if (en.disposition === "reference_only") {
      if (c.type === "NoteLink") {
        const info = src?.type === "Info" ? src : dst?.type === "Info" ? dst : null, other = info === src ? dst : src;
        if (info && other) {
          info.describes.push(lkRaw(other)); set(r, "native", "MdseLink:describes"); r.target_stable_id = info.id; r.target_file = info.path;
          return;
        }
        set(r, "evidence_only", "", "NOTELINK_ENDPOINT_NOT_INFO_NOTE"); return;
      }
      set(r, "evidence_only", "", "REFERENCE_ONLY"); return;
    }
    if (key === "Nesting") { set(r, "evidence_only", "", "ORGANIZATIONAL_ONLY"); return; }
    if (en.disposition === "conditional_review") { defer(en.required_evidence[0] ?? "CONDITIONAL_REVIEW", "No approved rule for this family; decide it and add the rule"); return; }
    if (!o.emitNative) { defer("NATIVE_EMISSION_DISABLED"); return; }
    const kw = (d?: Draft): string => d?.keyword ?? "";
    const srcLine = (verb: string, other: Draft): string => `- ${verb} ${lk(other)}`;
    // IMP-115, D-0070: approved descriptive MDSE-note relationships use YAML, but an ambiguous one is flagLink evidence.
    // D-0010 retired provisional tracesTo: never emit that YAML field, never mark an unresolved connector native.
    const noteLink = (): boolean => {
      if (!src || !dst || src === dst || (src.keyword && dst.keyword)) return false;
      const issue = [src, dst].find((d) => !d.keyword && d.o.type === "Issue"), other = issue === src ? dst : src;
      const field = !src.keyword && DESCRIBER.has(src.type) ? "describes" : !dst.keyword && DESCRIBER.has(dst.type) ? "describes" : issue && other.o.type !== "Issue" && other.o.type !== "Change" ? "affects" : key === "Dependency" || key === "Usage" ? "dependsOn" : "";
      if (!field) {
        defer("PROVISIONAL_LINK", "Review this MDSE-note connector and select a justified native or MDSE-only relationship; do not write tracesTo");
        return true;
      }
      const from = field === "describes" ? (!src.keyword && DESCRIBER.has(src.type) ? src : dst) : field === "affects" ? issue! : src, to = from === src ? dst : src;
      from.links.push([field, to]);                                  // the YAML says it; Source: EA does not repeat it (IMP-096)
      set(r, "native", `MdseLink:${field}`); r.target_stable_id = from.id; r.target_file = from.path;
      return true;
    };
    if (key === "Generalization") {
      if (src && dst && src.keyword && src.keyword === dst.keyword && src !== dst) {
        src.specializes.push(dst); set(r, "native", "Specialization"); r.target_stable_id = src.id; r.target_file = src.path;
        return;
      }
      defer("GENERALIZATION_ENDPOINT_KIND"); return;
    }
    if (key === "Aggregation") {
      const e = aggEnds(c);
      if ("code" in e) { defer(e.code); return; }
      const { whole, part } = e;
      if (whole && part && (!whole.keyword || !part.keyword)) {         // MDSE hierarchy between notes (Change to Change and the like, approved): descriptive, not native ownership
        whole.links.push(["hasChild", part]);
        set(r, "native", "MdseLink:hasChild"); r.target_stable_id = whole.id; r.target_file = whole.path; return;
      }
      if (whole?.keyword === "port def" && part?.keyword === "part def") { defer("AGGREGATION_PART_IN_INTERFACE", "Approved as an exception: inspect the source before choosing a construct"); return; }
      const kind = whole && part ? AGG[`${whole.keyword}|${part.keyword}`] : undefined;
      if (!whole || !part || !kind) { defer("AGGREGATION_ENDPOINT_KIND"); return; }
      if (aggCycle.has(c.id)) { defer("OWNERSHIP_CYCLE", "Whole and part own each other through other links; resolve the cycle in EA"); return; }
      const owned = kind === "use case" ? undefined : whole.usages.find((u) => u.kind === kind && u.typeDraft === part && !u.conn && !matched.has(u));
      if (owned) {                                                  // the EA Part (or nested element) already says this; it is that connector's usage, once
        matched.add(owned); { const mm = parseMultiplicity(e.card); if (!owned.mult && mm.text) owned.mult = mm.text; }          // the connector's multiplicity fills a usage that has none
        set(r, "alias_merged", KIND_NAME[kind]!, "USAGE_WINS"); r.target_stable_id = whole.id; r.target_file = whole.path; r.evidence = `merged into usage ${owned.name}`;
        return;
      }
      const m = parseMultiplicity(e.card), role = e.role.trim();
      const name = scopeOf(whole).take(usageIdent(role || part.title, `${kind.replace(" ", "")}${part.o.id}`));
      if (kind === "use case") { addStmt(whole, `use case ${name} : ${part.symbol}${m.text ?? ""};`, srcLine("Contains use case", part)); done(whole, KIND_NAME[kind]!, m.ok ? "UNVERIFIED_SYNTAX" : "MULTIPLICITY_UNPARSED"); return; }
      whole.usages.push({ kind, name, typeDraft: part, typedBy: part.title, ...(m.text ? { mult: m.text } : {}), objGuid: c.guid, conn: true });
      set(r, "native", KIND_NAME[kind]!, m.ok ? "" : "MULTIPLICITY_UNPARSED"); r.target_stable_id = whole.id; r.target_file = whole.path;
      return;
    }
    if (key === "Dependency:satisfy") {
      const req = [src, dst].find((d) => kw(d) === "requirement def"), by = req === src ? dst : src;
      if (!req || !by || !["part def", "action def", "state def"].includes(kw(by))) { if (noteLink()) return; defer("SATISFY_ENDPOINT_KIND"); return; }
      addStmt(by, `satisfy ${req.symbol};`, srcLine("Satisfies", req)); done(by, "SatisfyRequirementUsage"); return;
    }
    if (key === "Dependency:verify") {
      const ver = [src, dst].find((d) => kw(d) === "verification def"), req = [src, dst].find((d) => kw(d) === "requirement def");
      if (!ver || !req) { if (noteLink()) return; defer("VERIFY_ENDPOINT_KIND"); return; }
      if (!ver.verifies.includes(req.symbol)) ver.verifies.push(req.symbol);
      done(ver, "VerifyRequirementUsage"); return;
    }
    if (ALLOCATE.has(key)) {
      if (!src || !dst || !src.keyword || !dst.keyword) { if (noteLink()) return; defer("ALLOCATE_ENDPOINT_KIND"); return; }
      addStmt(src, `allocate ${src.symbol} to ${dst.symbol};`, srcLine("Allocated to", dst)); done(src, "AllocationUsage"); return;
    }
    if (key === "Realisation") {
      // IMP-117: the part is found by element type, not by arrow direction (Test_Vault_ Object/Requirement realization decision)
      const pd = src?.keyword === "part def" ? src : dst?.keyword === "part def" ? dst : undefined, other = pd === src ? dst : src;
      if (pd && other?.keyword === "action def") {
        const nm = scopeOf(pd).take(usageIdent(other.title, `action${other.o.id}`));
        addStmt(pd, `perform action ${nm} : ${other.symbol};`, srcLine("Performs", other)); done(pd, "PerformActionUsage"); return;
      }
      if (pd && other?.keyword === "requirement def") { addStmt(pd, `allocate ${other.symbol} to ${pd.symbol};`, srcLine("Realises", other)); done(pd, "AllocationUsage"); return; }
      if (src?.keyword === "part def" && dst?.keyword === "part def") { addStmt(src, `allocate ${src.symbol} to ${dst.symbol};`, srcLine("Realises", dst)); done(src, "AllocationUsage"); return; }
      if (noteLink()) return;
      defer("REALISATION_ENDPOINT_KIND"); return;
    }
    if (DERIVE.has(key)) {
      if (src?.keyword !== "requirement def" || dst?.keyword !== "requirement def") { if (noteLink()) return; defer("DERIVE_ENDPOINT_KIND"); return; }
      addStmt(src, `#derivation connection derive_${dst.symbol.replace(/[^A-Za-z0-9_]/g, "_")} {\n            end #original ::> ${dst.symbol};\n            end #derive ::> ${src.symbol};\n        }`, srcLine("Derived from", dst)); done(src, "Dependency"); return;
    }
    if (DEP_WORD[key]) {
      if (!src?.keyword || !dst?.keyword) { if (noteLink()) return; defer("DEPENDENCY_ENDPOINT_KIND"); return; }
      addStmt(src, DEP_WORD[key] === "refines" ? `#refinement dependency from ${src.symbol} to ${dst.symbol};` : `dependency from ${src.symbol} to ${dst.symbol}; // ${DEP_WORD[key]}`, srcLine(`Dependency (${DEP_WORD[key]})`, dst)); done(src, "Dependency"); return;
    }
    if (key === "Association") {
      // IMP-118: an Actor or Object associated with a Use Case takes part in it. An Actor is an `actor` of the use case (native); another Object goes to the `participants` link. Anything else is not proven to connect.
      const uc = src?.keyword === "use case def" ? src : dst?.keyword === "use case def" ? dst : undefined, who = uc === src ? dst : src;
      if (uc && who?.keyword === "part def") {
        if (who.o.type === "Actor") {
          const seen = `${uc.o.id}|${who.o.id}`;
          if (actorSeen.has(seen)) { set(r, "alias_merged", "ActorUsage", "USAGE_WINS"); r.target_stable_id = uc.id; r.target_file = uc.path; r.evidence = "merged into the actor already on the use case"; return; }
          actorSeen.add(seen);
          addStmt(uc, `actor ${scopeOf(uc).take(usageIdent(who.title, `actor${who.o.id}`))} : ${who.symbol};`, srcLine("Actor", who)); done(uc, "ActorUsage"); return;
        }
        uc.links.push(["participants", who]); set(r, "native", "MdseLink:participants"); r.target_stable_id = uc.id; r.target_file = uc.path; return;
      }
      defer("ASSOCIATION_CONNECTIVITY_NOT_PROVEN", "An association is not a connection; model it as a Connector between ports"); return;
    }
    if (key === "Connector" || key === "Connector:BindingConnector" || key === "InformationFlow:itemFlow") {
      const a = usageByObj.get(c.sourceId), b = usageByObj.get(c.destId);
      if (!a || !b || a.ref.kind !== "port" || b.ref.kind !== "port") { defer(key === "Connector" ? "CONNECTOR_ENDPOINT_NOT_PORT" : key === "Connector:BindingConnector" ? "BINDING_ENDPOINT_NOT_PORT" : "FLOW_ENDPOINT_NOT_PORT"); return; }
      if (key === "Connector:BindingConnector" && (!a.ref.typeDraft || a.ref.typeDraft !== b.ref.typeDraft || !!a.ref.conj !== !!b.ref.conj)) { defer("BINDING_FEATURES_NOT_COMPATIBLE", "Binding needs two ports of the same type; the connection is kept as a review row"); return; }
      // IMP-109: ports that sit on Parts of one assembly connect through those Parts: `connect partA.port to partB.port`
      const ca = carrierOf.get(c.sourceId), cb = carrierOf.get(c.destId);
      const pa = ca ? usageByObj.get(ca) : undefined, pb = cb ? usageByObj.get(cb) : undefined;
      const endText = (x: { owner: Draft; ref: UsageRef } | undefined, port: { owner: Draft; ref: UsageRef }): string => (x ? `${x.ref.name}.${port.ref.name}` : port.ref.name);
      let owner: Draft | null = null, ta = "", tb = "";
      if (pa && pb && pa.owner === pb.owner) { owner = pa.owner; ta = endText(pa, a); tb = endText(pb, b); }
      else if (pa && !cb && b.owner === pa.owner) { owner = pa.owner; ta = endText(pa, a); tb = b.ref.name; }
      else if (pb && !ca && a.owner === pb.owner) { owner = pb.owner; ta = a.ref.name; tb = endText(pb, b); }
      else if (a.owner !== b.owner) {                                // find the one definition that owns a part of each end's type
        const ctxs = drafts.filter((w) => w.keyword === "part def" && w.usages.some((u) => u.kind === "part" && u.typeDraft === a.owner) && w.usages.some((u) => u.kind === "part" && u.typeDraft === b.owner));
        if (!ctxs.length) { defer("PORT_CONNECTION_NEEDS_COMMON_OWNER"); return; }
        const w = ctxs[0]!, ua = w.usages.filter((u) => u.kind === "part" && u.typeDraft === a.owner), ub = w.usages.filter((u) => u.kind === "part" && u.typeDraft === b.owner);
        if (ctxs.length > 1 || ua.length !== 1 || ub.length !== 1) { defer("PORT_CONNECTION_AMBIGUOUS_OWNER"); return; }
        owner = w; ta = `${ua[0]!.name}.${a.ref.name}`; tb = `${ub[0]!.name}.${b.ref.name}`;
      } else { owner = a.owner; ta = a.ref.name; tb = b.ref.name; }
      if (key === "Connector") { addStmt(owner, `connect ${ta} to ${tb};`, `- Connection ${ta} to ${tb}`); done(owner, "ConnectionUsage"); }
      else if (key === "Connector:BindingConnector") { addStmt(owner, `bind ${ta} = ${tb};`); done(owner, "BindingConnectorUsage"); }   // IMP-120
      else { addStmt(owner, `flow from ${ta} to ${tb};`); done(owner, "FlowUsage"); }                                                              // IMP-120
      return;
    }
    if (key === "ControlFlow" || key === "StateFlow") {
      const okKinds = key === "ControlFlow" ? ["action", "fork", "join"] : ["state"];
      const a = endUsage(c.sourceId), b = endUsage(c.destId);
      const word = key === "ControlFlow" ? "succession" : "transition";
      // Guard, trigger and effect follow SysML v2 (IMP-098): `transition first a accept t if g do e then b;` / `succession first a if g then b;`.
      // Free text cannot be an expression, so each is a small named helper usage that carries the wording in `doc`.
      const clean = (x: string): string => x.replace(/\s+/g, " ").trim();
      let trig = isPlaceholder(c.pdata1) ? "" : clean(c.pdata1), grd = isPlaceholder(c.pdata2) ? "" : clean(c.pdata2), eff = isPlaceholder(c.pdata3) ? "" : clean(c.pdata3);
      const label = clean(c.name);
      if (label && !trig && !grd && !eff) { if (key === "ControlFlow") grd = label; else trig = label; }          // an unstructured label: guard on a control flow, trigger on a state flow
      if (a && b && okKinds.includes(a.ref.kind) && okKinds.includes(b.ref.kind) && a.owner === b.owner) {
        const helper = (kw: string, pre: string, text: string): string => {
          const nm = scopeOf(a.owner).take(usageIdent(`${pre} ${text.slice(0, 40)}`, `${pre}${c.id}`));
          const stmt = `${kw} ${nm} { doc /* ${text.replace(/\*\//g, "* /")} */ }`;
          if (!a.owner.members.includes(stmt)) a.owner.members.push(stmt);
          return nm;
        };
        const parts: string[] = [];
        if (key === "StateFlow" && trig) { const nm = helper("item", "trigger", trig); parts.push(`accept ${nm}`); }
        if (grd) { const nm = helper("constraint", "guard", grd); parts.push(`if ${nm}`); }
        if (key === "StateFlow" && eff) { const nm = helper("action", "effect", eff); parts.push(`do ${nm}`); }
        addStmt(a.owner, `${word} first ${a.ref.name}${parts.length ? " " + parts.join(" ") : ""} then ${b.ref.name};`);
        done(a.owner, key === "ControlFlow" ? "SuccessionUsage" : "TransitionUsage"); return;
      }
      // D-0073: do not turn cross-owner temporal semantics into a YAML "precedes" assertion.
      // Preserve the EA connector and every explicit trigger/guard/effect when no native owner is established.
      const dA = byObj.get(c.sourceId), dB = byObj.get(c.destId);
      const extra = [trig && `trigger: ${trig}`, grd && `guard: ${grd}`, eff && `effect: ${eff}`].filter(Boolean).join("; ");
      if (dA && dB && dA !== dB) {
        if (extra) dA.sourceLines.push(`- ${key} evidence to ${lk(dB)} (${extra})`);
        defer("FLOW_NO_COMMON_OWNER", "Find a valid common SysML owner and compatible usages before writing succession or transition");
        return;
      }
      // An unresolved usage endpoint still retains its source GUID and review flag.
      if (extra) {
        const host = dA ?? a?.owner ?? dB ?? b?.owner;
        if (host) host.sourceLines.push(`- ${key} evidence (source: ${g.objectsById.get(c.sourceId)?.name ?? c.sourceId}; target: ${g.objectsById.get(c.destId)?.name ?? c.destId}; ${extra})`);
      }
      defer("FLOW_ENDPOINT_NOT_USAGE"); return;
    }
    if (key === "UseCase:include") {
      if (src?.keyword !== "use case def" || dst?.keyword !== "use case def") { defer("INCLUDE_ENDPOINT_KIND"); return; }
      const nm = scopeOf(src).take(usageIdent(dst.title, `include${dst.o.id}`));
      addStmt(src, `include use case ${nm} : ${dst.symbol};`, srcLine("Includes", dst)); done(src, "IncludeUseCaseUsage"); return;
    }
    if (key === "UseCase:extend") {                                  // extension (source) is an optional case of the base (destination)
      if (src?.keyword !== "use case def" || dst?.keyword !== "use case def") { defer("EXTEND_ENDPOINT_KIND"); return; }
      const nm = scopeOf(dst).take(usageIdent(src.title, `extension${src.o.id}`));
      addStmt(dst, `use case ${nm} : ${src.symbol}[0..1];`, srcLine("Extended by", src)); done(dst, "OptionalUseCaseUsage"); return;
    }
    defer(`NATIVE_EMISSION_NOT_IMPLEMENTED:${key}`, `Needs: ${en.required_evidence.join(", ")}`);
  });

  track.stage = "render notes";
  // Every deferred element leaves a flag on the nearest note that holds it (its owner, else the owner of its owner). One with no note above it goes
  // on a single modelCheck holding note (MOD-056) so nothing is only in the CSV.
  const generated = new Map<string, { path: string; text: string; guid: string; draft: Draft }>();
  const hostlessEls: Array<{ e: EaObject; r: LedgerRow }> = [];
  let holdingFlags = 0;
  for (const e of g.objects) {
    const r = objRow.get(e.id); if (!r || r.disposition !== "deferred_review") continue;
    let host: Draft | undefined = byObj.get(e.id), cur: EaObject | undefined = e; const seen = new Set<number>();
    while (!host && cur && !seen.has(cur.id)) { seen.add(cur.id); host = byObj.get(cur.parentId) ?? usageByObj.get(cur.parentId)?.owner; cur = g.objectsById.get(cur.parentId); }
    if (!host) { hostlessEls.push({ e, r }); continue; }
    const label = `${e.type}${e.stereotype ? ":" + e.stereotype : ""}`, nm = e.name.trim() || e.alias.trim() || `object ${e.id}`;
    host.sourceLines.push(`- Element ${label} \`${nm}\` not written (${r.diagnostic_code})`);
    flagLink(host, `Unmapped ${label} \`${nm}\``, [`Not written to SysML (${r.diagnostic_code}). ${(r.operator_action || "See the ledger row").replace(/\.$/, "")}. EA GUID ${e.guid}.`]);
    r.target_stable_id = host.id; r.target_file = host.path;
  }
  if (hostlessEls.length || hostlessLinks.length) {
    const guid = "review-unplaced", known = idx?.byGuid.get(guid), created = [...hostlessEls.map((x) => x.e.created)].sort()[0] ?? "";
    let uid = known?.uid ?? "", id = known?.id ?? "";
    if (!known) {
      uid = allocateUids([{ key: "review", created, guid, author: "" }], o.authors, taken, "20000101000000000").get("review")!.uid;
      const pre = prefixOf("modelCheck", "Review"), top = [...ids.values()].filter((v) => v.startsWith(pre + "-")).map((v) => +v.slice(pre.length + 1));
      const hi = new Map(highest); hi.set(pre, Math.max(hi.get(pre) ?? 0, ...top, 0));
      id = allocateIds([{ key: "review", prefix: pre, created, guid }], hi).get("review")!;
    }
    const path = known?.path ?? `${claim("Unplaced Review Items")}.md`;
    const lname = (id: number): string => g.objectsById.get(id)?.name || `object ${id}`;
    const linkFlags = hostlessLinks.map(({ c, code, family }) => flagCallout("flagLink", `Unresolved ${family} link from ${lname(c.sourceId)} to ${lname(c.destId)}`, sourceLink, [`No native relationship was written (${code}). Neither end has a note. See the ledger row for EA connector ${c.guid}.`]));
    const flags = linkFlags.concat(hostlessEls.map(({ e, r }) => flagCallout("flagNote", `${e.type}${e.stereotype ? ":" + e.stereotype : ""} \`${e.name.trim() || e.alias.trim() || `object ${e.id}`}\``, sourceLink,
      [`Not written to SysML (${r.diagnostic_code}). ${(r.operator_action || "See the ledger row").replace(/\.$/, "")}. Package: ${pkgPath(e.packageId).join(" > ") || "(root)"}. EA GUID ${e.guid}.`])));
    const lines = [`- EA GUID: ${guid}`, ...hostlessLinks.map(({ c, code, family }) => `- Connector ${family} from ${lname(c.sourceId)} to ${lname(c.destId)} (unresolved: ${code})`), ...hostlessEls.map(({ e, r }) => `- ${e.type}${e.stereotype ? ":" + e.stereotype : ""} \`${e.name.trim() || e.alias.trim() || `object ${e.id}`}\` (${r.diagnostic_code}) — EA package: ${pkgPath(e.packageId).join(" > ") || "(root)"}`)];
    generated.set(path, { path, guid, draft: undefined as unknown as Draft, text: renderNote({ type: "modelCheck", subtype: "Review", id, uid, eaType: "Review", title: "Unplaced Review Items", relFields: [], bodyText: "Elements and connectors the importer could not place in any note (no mapping, no owner, or no rule). Each has a flag below and a row in Review - Deferred Elements.csv. Decide each one, then remove its flag.", flags, sourceLines: lines, sysml: null }) });
    holdingFlags = flags.length;
    for (const r of [...hostlessEls.map((x) => x.r), ...hostlessLinks.map((x) => x.row)]) { r.target_stable_id = id; r.target_file = path; }
  }

  // ---- render notes -------------------------------------------------------------------------------------------------
  const outFiles: OutFile[] = [];
  const relFieldsOf = (d: Draft): Array<[string, string[]]> => {
    const f = new Map<string, string[]>(); if (d.describes.length) f.set("describes", [...d.describes]);
    for (const [k, t] of d.links) { const l = f.get(k) ?? []; if (!l.includes(lkRaw(t))) l.push(lkRaw(t)); f.set(k, l); }
    return [...f].map(([k, v]) => [k, [...new Set(v)]] as [string, string[]]);
  };
  let blocks = 0, flagCount = holdingFlags;
  const tagDisp = new Map(o.tags.tags.map((t) => [t.tag, t.disposition] as const)), unlistedTags = new Map<string, number>();
  const attachFiles: OutFile[] = [], attachTaken = new Set<string>(existing?.allPaths ? [...existing.allPaths].map((p) => p.toLowerCase()) : []);
  let attachRows = 0;
  for (const d of drafts) guard("render", "t_object", d.o, () => {
    const e = d.o, src = [`- EA GUID: ${e.guid}`];
    // D-0068: the exact EA name is the `name` property and the EA alias is in `aliases`, so neither is repeated here (IMP-096)
    let partNumber = "";
    const isReq = d.keyword === "requirement def";
    let reqText = isReq ? e.note.trim() : "";
    for (const [k, v] of g.tags.get(e.id) ?? []) {
      if (isPlaceholder(v)) continue;
      if (!partNumber && /^(PN|Part ?Number)$/i.test(k.trim())) partNumber = v.trim();   // MOD-173: the EA part number tag (tag names as in WKB-017; not checked against a real model)
      if (isReq && /^(SysML1\.\d::)?text$/i.test(k.trim())) { if (!reqText.includes(v.trim())) reqText = [reqText, v.trim()].filter(Boolean).join("\n\n"); continue; }     // requirement wording lives in `doc` (IMP-097)
      const disp = tagDisp.get(k);
      if (disp === undefined) { unlistedTags.set(k, (unlistedTags.get(k) ?? 0) + 1); }          // new to the list: kept in the body until someone decides (W-33)
      else if (disp !== "body") continue;
      src.push(`- ${k}: ${v.replace(/\s*\n\s*/g, " ")}`);
    }
    src.push(...d.sourceLines);
    if (o.folderCap !== 0 && d.pkgPath.length > (o.folderCap ?? 6)) src.push(`- Package: ${d.pkgPath.join(" / ")}`);   // the folders stop at the cap (MOD-174); the whole path stays here
    let bodyExtra = "";
    if (d.entry.disposition === "attachment_link") {
      const docs = g.documents.get(e.guid) ?? [];
      if (!docs.length) d.evidence.push("ATTACHMENT_BYTES_NOT_FOUND");
      for (const doc of docs) {
        if (doc.bytes.length > MAX_ATTACH) { d.evidence.push("ATTACHMENT_TOO_LARGE"); src.push(`- Attachment skipped (too large): ${doc.name} (${doc.bytes.length} bytes)`); continue; }
        const base = safeName(doc.name || e.name || `attachment ${e.id}`) + extOf(doc.name || e.name, doc.bytes);
        let path = `Attachments/${base}`, n = 1;
        const own = existing?.allPaths?.has(path) && existing.files.get(d.path)?.includes(`[[${path}]]`);          // this element's file from an earlier run
        while (!own && attachTaken.has(path.toLowerCase())) { n++; path = `Attachments/${base.replace(/(\.[^.]*)?$/, `~${n}$1`)}`; }
        if (!own) { attachTaken.add(path.toLowerCase()); attachFiles.push({ path, content: "", bytes: doc.bytes }); }
        attachRows++;
        src.push(`- Attachment: [[${path}]] (${doc.bytes.length} bytes)`);
        if (/\.(png|jpe?g|gif|svg|bmp|webp)$/i.test(path)) bodyExtra += `![[${path}]]\n`;
      }
    }
    const sysml = d.keyword ? renderBlock({ keyword: d.keyword, pkg: d.pkg, name: d.ident, specializes: d.specializes.map((s) => s.symbol),
      usages: d.usages.map((u) => ({ kind: u.kind, name: u.name, ...(u.dir ? { dir: u.dir } : {}), ...(u.typeDraft ? { typeSymbol: u.typeDraft.symbol } : {}), ...(u.mult ? { mult: u.mult } : {}), ...(u.conj ? { conj: true } : {}), ...(u.isRef ? { ref: true } : {}) })),
      ...(reqText ? { doc: reqText } : {}), members: [...d.members, ...(d.verifies.length ? [`objective { ${d.verifies.map((v) => `verify ${v};`).join(" ")} }`] : [])] }) : null;
    if (sysml) blocks++;
    flagCount += d.flags.length;
    const model: NoteModel = { type: d.type, subtype: d.subtype, id: d.id, uid: d.uid, eaType: d.family, title: d.title, ...(e.name.trim() || e.alias.trim() ? { name: d.title } : {}), ...(e.alias.trim() && e.name.trim() && e.alias.trim() !== e.name.trim() ? { aliases: [e.alias.trim()] } : {}), ...(partNumber ? { partNumber } : {}), relFields: relFieldsOf(d),
      bodyText: [isReq ? "" : e.note.trim(), bodyExtra.trim()].filter(Boolean).join("\n\n"), flags: d.flags, sourceLines: src, sysml, ...(sysml ? { sourceRole: "authoritative-model", primarySymbol: d.symbol } : {}) };
    generated.set(d.path, { path: d.path, text: renderNote(model), guid: e.guid, draft: d });
    const r = objRow.get(e.id)!;
    set(r, "native", d.keyword ? d.entry.native_kind! : `MdseNote:${d.type}`, d.evidence[0] ?? ""); r.target_stable_id = d.id; r.target_file = d.path; r.evidence = d.evidence.join(";");
  });

  // aggregate boundary note (MOD-131)
  if (boundaries.length) {
    const guid = aggregate!.guid, known = idx?.byGuid.get(guid);
    const uid = known?.uid ?? uids.get("boundary")!.uid, id = known?.id ?? ids.get("boundary")!, path = known?.path ?? `${claim("Boundaries")}.md`;
    const lines = [`- EA GUID: ${guid}`, `- EA type: Boundary`, ...boundaries.map((b) => `- Boundary: ${b.o.name || "(unnamed)"} — EA package: ${pkgPath(b.o.packageId).join(" > ") || "(root)"}`)];
    generated.set(path, { path, guid, draft: undefined as unknown as Draft, text: renderNote({ type: "modelCheck", subtype: "Boundary", id, uid, eaType: "Boundary", title: "Boundaries", relFields: [], bodyText: "Aggregate of every EA Boundary element (MOD-131). Descriptive evidence, not a native SysML relationship.", flags: [], sourceLines: lines, sysml: null }) });
    for (const b of boundaries) { set(b.row, "evidence_only", "MdseNote:modelCheck/Boundary", "BOUNDARY_GROUPED"); b.row.target_stable_id = id; b.row.target_file = path; }
  }

  track.stage = "reconcile";
  // ---- reconcile: every source row has exactly one disposition (IMP-059, IMP-064) ---------------------------------------
  const expect: Record<string, number> = { t_package: g.counts.t_package, t_object: g.counts.t_object, t_connector: g.counts.t_connector };
  const warnings: string[] = [];
  for (const [k, n] of [...unlistedTags].sort()) warnings.push(`tag not in ea-tag-dispositions.json: "${k}" (${n} rows); kept in the body until it is given a disposition`);
  for (const t of LEDGER_ORDER) { const n = ledger.filter((l) => l.source_table === t).length; if (n !== expect[t]) problems.push(`ledger rows for ${t}: ${n}, source rows: ${expect[t]}`); }
  for (const l of ledger) if (!l.disposition) { l.disposition = "error"; l.diagnostic_code = "NO_DISPOSITION"; problems.push(`no disposition: ${l.source_table} ${l.source_pk}`); }
  ledger.sort((a, b) => (LEDGER_ORDER.indexOf(a.source_table) - LEDGER_ORDER.indexOf(b.source_table)) || (a.ea_guid < b.ea_guid ? -1 : a.ea_guid > b.ea_guid ? 1 : 0) || (+a.source_pk - +b.source_pk));
  const dispositions: Record<string, number> = {};
  for (const l of ledger) dispositions[l.disposition] = (dispositions[l.disposition] ?? 0) + 1;

  // ---- vault-level files ---------------------------------------------------------------------------------------------------
  const sys = (name: string, content: string): OutFile => ({ path: `${SYSTEM_DIR}/${name}`, content });
  const named = (id: number): string => g.objectsById.get(id)?.name ?? "";
  const deferredElements = ledger.filter((l) => l.source_table === "t_object" && l.disposition === "deferred_review");
  // Context columns so a row can be understood without the 175 MB source: what the element sits under, what it is typed by, and what each end of a link is.
  const ctx = (id: number): { type: string; name: string; guid: string } => { const x = g.objectsById.get(id); return x ? { type: x.stereotype ? `${x.type}:${x.stereotype}` : x.type, name: x.name || x.alias, guid: x.guid } : { type: "", name: "", guid: "" }; };
  const elementsCsv = csv(["ea_guid", "ea_type", "ea_stereotype", "name", "package", "author", "created", "note", "diagnostic_code", "operator_action", "parent_type", "parent_name", "parent_guid", "typed_by", "multiplicity"],
    deferredElements.map((l) => { const e = g.objects.find((x) => String(x.id) === l.source_pk)!, par = ctx(e.parentId), ty = refObj(e.pdata1) ?? g.objectsById.get(e.classifier);
      return [l.ea_guid, l.ea_type, l.ea_stereotype, e.name, pkgPath(e.packageId).join(" > "), e.author, e.created, e.note, l.diagnostic_code, l.operator_action, par.type, par.name, par.guid, ty ? `${ty.name} (${ty.type})` : "", e.multiplicity]; }));
  const linksCsv = csv(["ea_guid", "family", "source_name", "source_guid", "target_name", "target_guid", "direction", "connector_name", "diagnostic_code", "source_type", "target_type", "source_parent", "target_parent"],
    deferredLinks.map(({ c, code, family }) => { const a = ctx(c.sourceId), b = ctx(c.destId), pa = ctx(g.objectsById.get(c.sourceId)?.parentId ?? 0), pb = ctx(g.objectsById.get(c.destId)?.parentId ?? 0);
      return [c.guid, family, named(c.sourceId), a.guid, named(c.destId), b.guid, c.direction, c.name, code, a.type, b.type, pa.name ? `${pa.name} (${pa.type})` : "", pb.name ? `${pb.name} (${pb.type})` : ""]; }));
  const manifest = { schema: "mdse-run-manifest/0.1", runDate: o.runDate, source: { name: o.sourceName, lineage: o.lineage, sha256: o.fingerprint }, importerRelease: o.releaseVersion, mappingSchema: resolver.version,
    counts: { t_package: g.counts.t_package, t_object: g.counts.t_object, t_connector: g.counts.t_connector, t_objectproperties: g.counts.t_objectproperties }, dispositions, notes: generated.size, sysmlBlocks: blocks, flags: flagCount, problems, errors: errors.length, attachments: attachRows, translation: "Translation Table.md",
    nativeEmission: o.emitNative ? "ON (owner override of emission_enabled=false, D-0016); blocks not parser-checked" : "OFF", diagrams: "never read (ADR-V2-05)" };

  track.stage = "write plan";
  // ---- merge / write plan --------------------------------------------------------------------------------------------------
  const plan = planMerge({ generated: [...generated.values()].map((x) => ({ path: x.path, text: x.text, guid: x.guid })), existing, preApproved: o.preApproved, sourceLink, runLabel,
    sourceName: o.sourceName, presentGuids: new Set(g.objects.map((x) => x.guid).concat([...g.packages.values()].map((p) => p.guid))) });
  const sysFiles: OutFile[] = [];
  if (plan.changed || !existing) {
    sysFiles.push(sys("Ledger.csv", csv([...LEDGER_COLUMNS], ledger.map((l) => LEDGER_COLUMNS.map((k) => l[k])))), sys("Run Manifest.json", JSON.stringify(manifest, null, 2) + "\n"),
      sys("Review - Deferred Elements.csv", elementsCsv), sys("Review - Deferred Links.csv", linksCsv),
      sys("Parser Check.md", `# Parser Check\n\nStatus: **NOT RUN**. ${blocks} SysML v2 block(s) were generated in this run and none has been checked by the pinned parser.\nThe parser gate runs in CI or on a maintainer's machine, not in the importer page (MOD-139). Workbench must show these blocks as unchecked.\n`));
    if (!existing) sysFiles.push(sys("Translation Table.md", renderTranslationDoc(o.mapping)));
    if (!existing) sysFiles.push(sys(`Import Run ${runLabel}.md`, runNote(o, g, dispositions, blocks, flagCount, problems, generated.size, warnings)));
    else sysFiles.push(sys(`Changelog ${runLabel}.md`, plan.changelog));
  }
  if (errors.length) {
    sysFiles.push(sys(`Error Log ${runLabel}.json`, JSON.stringify({ schema: "mdse-error-log/0.1", runDate: o.runDate, source: o.sourceName, sha256: o.fingerprint, importerRelease: o.releaseVersion, errors }, null, 2) + "\n"),
      sys(`Error Log ${runLabel}.md`, `# Error Log ${runLabel}\n\n${errors.length} row(s) raised an exception and were skipped (ledger disposition \`error\`, code \`EXCEPTION\`). Everything else in the run completed. Source \`${o.sourceName}\`, SHA-256 \`${o.fingerprint}\`.\n\n| Stage | Table | Row | EA GUID | Name | Message |\n|---|---|---|---|---|---|\n${errors.map((e) => `| ${e.stage} | ${e.table} | ${e.pk} | ${e.guid} | ${e.name.replace(/\|/g, "\\|")} | ${e.message.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`).join("\n")}\n\n## Stacks\n\n${errors.slice(0, 20).map((e) => `### ${e.table} ${e.pk}\n\n\`\`\`text\n${e.stack}\n\`\`\``).join("\n\n")}\n`));
  }
  outFiles.push(...plan.writes, ...sysFiles, ...attachFiles);
  let baseIncluded = false;
  if (!existing && o.baseFiles) {
    baseIncluded = true;
    outFiles.push(...initVaultFiles(o.baseFiles, { runDate: o.runDate, vaultName: o.vaultName, code: o.authors.fallbackCode, release: o.releaseVersion, ...(o.person ? { person: o.person } : {}) }));
  }
  outFiles.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const dup = outFiles.map((f) => f.path.toLowerCase()).filter((p, i, a) => a.indexOf(p) !== i);
  if (dup.length) problems.push(`duplicate output paths: ${dup.slice(0, 5).join(", ")}`);
  const status = problems.length ? "FAILED" : existing && !plan.changed && !errors.length && !attachFiles.length ? "NO_CHANGES" : "WRITE_READY";
  return { status, files: status === "FAILED" ? [] : outFiles, ledger, changes: plan.changes, problems, warnings, errors,
    summary: { elements: g.counts.t_object, connectors: g.counts.t_connector, packages: g.counts.t_package, notes: generated.size, dispositions, flags: flagCount, sysmlBlocks: blocks, baseVaultIncluded: baseIncluded, created: plan.created, unchanged: plan.unchanged, updated: plan.updated, conflicts: plan.conflicts, errors: errors.length } };
}

function runNote(o: ImportOptions, g: SourceGraph, disp: Record<string, number>, blocks: number, flags: number, problems: string[], notes: number, warnings: string[]): string {
  return `# Import Run ${labelOf(o.runDate)}\n\nSource \`${o.sourceName}\` (${o.lineage}), SHA-256 \`${o.fingerprint}\`.\n\n| | |\n|---|---|\n| Packages | ${g.counts.t_package} |\n| Elements | ${g.counts.t_object} |\n| Connectors | ${g.counts.t_connector} |\n| Notes written | ${notes} |\n| SysML v2 blocks (not parser-checked) | ${blocks} |\n| Flags | ${flags} |\n\n## Dispositions\n\n${Object.entries(disp).sort().map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n${problems.length ? `## Problems\n\n${problems.map((p) => `- ${p}`).join("\n")}\n\n` : ""}${warnings.length ? `## Warnings\n\n${warnings.map((p) => `- ${p}`).join("\n")}\n\n` : ""}Ledger: \`Ledger.csv\`. Review tables: \`Review - Deferred Elements.csv\`, \`Review - Deferred Links.csv\`.\n`;
}

function MDSE_INDEX(v: ExistingVault): { uids: Set<string>; byGuid: Map<string, { path: string; uid: string; id: string }>; highest: Map<string, number>; baseNames: Set<string> } {
  const uids = new Set<string>(), byGuid = new Map<string, { path: string; uid: string; id: string }>(), highest = new Map<string, number>(), baseNames = new Set<string>();
  for (const [path, text] of v.files) {
    if (!/\.md$/i.test(path)) continue;
    baseNames.add(path.split("/").pop()!.replace(/\.md$/i, "").toLowerCase());
    let meta: Record<string, string>; try { meta = MDSE.parse(text).meta; } catch { continue; }
    if (meta.uid) uids.add(meta.uid);
    const m = /^([A-Z]+)-(\d{5})$/.exec(meta.id ?? "");
    if (m) highest.set(m[1]!, Math.max(highest.get(m[1]!) ?? 0, +m[2]!));
    for (const f of text.matchAll(/^-\s+[A-Z]+-(\d{5})\s*$/gm)) { void f; }          // ids under ## Former ids are counted below
    const fm = /^## Former ids\s*\n([\s\S]*?)(?=\n## |\s*$)/m.exec(text);
    if (fm) for (const x of fm[1]!.matchAll(/\b([A-Z]+)-(\d{5})\b/g)) highest.set(x[1]!, Math.max(highest.get(x[1]!) ?? 0, +x[2]!));
    const g = /^- EA GUID: (.+)$/m.exec(text);
    if (g && meta.uid && meta.id) byGuid.set(g[1]!.trim(), { path, uid: meta.uid, id: meta.id });
  }
  return { uids, byGuid, highest, baseNames };
}
