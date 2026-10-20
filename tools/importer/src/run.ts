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
import { safeName, sysmlIdent, usageIdent, IdentScope } from "./naming.ts";
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

interface UsageRef { kind: UsageDecl["kind"]; name: string; typeDraft: Draft | null; mult?: string; objGuid: string; typedBy: string; dir?: "in" | "out" | "inout" }
interface Draft {
  key: string; o: EaObject; family: string; entry: ElementEntry; type: string; subtype: string; evidence: string[];
  title: string; uid: string; id: string; baseName: string; path: string; ownDir: string | null; parent: Draft | null; children: Draft[];
  keyword: string | null; pkg: string; ident: string; symbol: string; specializes: Draft[]; usages: UsageRef[];
  flags: string[]; sourceLines: string[]; describes: string[]; existingPath?: string; pkgPath: string[]; members: string[]; verifies: string[];
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

  for (const p of g.packages.values()) { const r = row("t_package", p.id, p.guid, "Package", "", p.parentId, "folder_only"); set(r, "native", "Folder"); r.target_file = pkgPath(p.id).join("/"); }

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
      const kw = en.native_kind ? DEFINITION_KINDS[en.native_kind] ?? null : null;
      const title = e.name.trim() || e.alias.trim() || `Unnamed ${e.id}`;
      const d: Draft = { key: `o:${e.id}`, o: e, family: key, entry: en, type: cls.type, subtype: cls.subtype, evidence: cls.evidence, title, uid: "", id: "", baseName: "", path: "", ownDir: null, parent: null, children: [], keyword: kw && o.emitNative ? kw : null, pkg: "", ident: sysmlIdent(title), symbol: "", specializes: [], usages: [], flags: [], sourceLines: [], describes: [], pkgPath: pkgPath(e.packageId), members: [], verifies: [] };
      for (const c of en.conditional_evidence) d.evidence.push("REVIEW:" + c);
      drafts.push(d); byObj.set(e.id, d); return;
    }
    if (en.disposition === "reference_only") { set(r, "evidence_only", "", "REFERENCE_ONLY"); return; }
    if (en.disposition === "aggregate_boundary_note") { boundaries.push({ o: e, row: r }); return; }
    if (en.disposition === "conditional_review") { set(r, "deferred_review", "", en.conditional_evidence[0] ?? "CONDITIONAL_REVIEW", "Needs the evidence named in the diagnostic"); return; }
    set(r, "deferred_review", "", "UNHANDLED_DISPOSITION_" + en.disposition);
  });

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
  for (const d of order) d.baseName = d.existingPath ? d.existingPath.split("/").pop()!.replace(/\.md$/, "") : claim(safeName(d.title));
  const dirOf = (d: Draft): string => (d.parent ? ownDirOf(d.parent) : d.pkgPath.join("/"));
  const ownDirOf = (d: Draft): string => { const base = dirOf(d); return (base ? base + "/" : "") + d.baseName; };
  for (const d of drafts) {
    if (d.existingPath) { d.path = d.existingPath; continue; }
    const dir = dirOf(d);
    d.path = d.children.length ? `${ownDirOf(d)}/${d.baseName}.md` : `${dir ? dir + "/" : ""}${d.baseName}.md`;
  }

  track.stage = "usages";
  // ---- usages owned by definitions -----------------------------------------------------------------------------------
  const scopes = new Map<Draft, IdentScope>();
  const scopeOf = (d: Draft): IdentScope => scopes.get(d) ?? (scopes.set(d, new IdentScope()), scopes.get(d)!);
  const flagLink = (d: Draft, title: string, detail: string[]): void => { d.flags.push(flagCallout("flagLink", title, sourceLink, detail)); };
  const ownerKeyword: Record<string, string> = { PartUsage: "part def", PortUsage: "part def", ActionUsage: "action def", StateUsage: "state def", SyncNode: "action def" };
  usageObjs.sort((a, b) => a.o.id - b.o.id);
  const usageByObj = new Map<number, { owner: Draft; ref: UsageRef }>();
  const flowIn = new Map<number, number>(), flowOut = new Map<number, number>();
  for (const c of g.connectors) if (connectorKey(c) === "ControlFlow") { flowOut.set(c.sourceId, (flowOut.get(c.sourceId) ?? 0) + 1); flowIn.set(c.destId, (flowIn.get(c.destId) ?? 0) + 1); }
  const flowItem = (u: { o: EaObject; entry: ElementEntry; row: LedgerRow }): void => {
    const e = u.o;
    let ownerDef = byObj.get(e.parentId) ?? null;
    if (!ownerDef) { const po = g.objectsById.get(e.parentId); if (po && po.type === "Port") ownerDef = byObj.get(po.classifier) ?? null; }   // flow item under a port usage: its port def owns it
    if (!ownerDef || ownerDef.keyword !== "port def") { set(u.row, "deferred_review", "ItemUsage", "FLOW_OWNER_NOT_PORT_DEF", "Move the flow item under its port definition"); return; }
    const tag = ((g.tags.get(e.id) ?? []).find(([k]) => /^(flow ?)?direction$/i.test(k.trim()))?.[1] ?? "").trim().toLowerCase();
    const dir = tag === "in" || tag === "out" || tag === "inout" ? tag : tag === "in/out" || tag === "bidirectional" ? "inout" : null;
    if (!dir) { set(u.row, "deferred_review", "ItemUsage", "DIRECTION_EVIDENCE_MISSING", "Set the flow direction (in, out, inout)"); return; }
    const t = byObj.get(e.classifier), typed = t && (t.keyword === "item def" || t.keyword === "attribute def") ? t : null;
    const name = scopeOf(ownerDef).take(usageIdent(e.name || e.alias, `flow${e.id}`));
    const ref: UsageRef = { kind: "item", dir, name, typeDraft: typed, objGuid: e.guid, typedBy: typed?.title ?? "" };
    ownerDef.usages.push(ref); usageByObj.set(e.id, { owner: ownerDef, ref });
    set(u.row, "native", "ItemUsage", typed ? "" : "UNRESOLVED_FLOW_TYPE", typed ? "" : "Set the Classifier to the Signal this flow carries");
    u.row.target_stable_id = ownerDef.id; u.row.target_file = ownerDef.path;
    if (!typed) flagLink(ownerDef, `Untyped flow item \`${name}\``, [`The EA FlowProperty \`${e.name}\` has no Signal as Classifier. It is written without a type.`]);
  };
  for (const u of usageObjs) guard("usage", "t_object", u.o, () => {
    const e = u.o, kind = u.entry.native_kind ?? "SyncNode";
    if (kind === "ItemUsage") { flowItem(u); return; }
    const owner = byObj.get(e.parentId);
    if (!owner || !owner.keyword) { set(u.row, "deferred_review", kind, "USAGE_WITHOUT_NOTE_OWNER", "Owner is not a definition note"); return; }
    if (owner.keyword !== ownerKeyword[kind]) { set(u.row, "deferred_review", kind, "USAGE_OWNER_KIND_MISMATCH", `${kind} inside ${owner.keyword}`); return; }
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
    if (kind === "PartUsage" || kind === "PortUsage" || kind === "ActionUsage") {
      const want = kind === "PartUsage" ? Number(e.pdata1) || 0 : e.classifier;                      // IMP-011: the block comes from PDATA1
      const target = byObj.get(want);
      const okKind = kind === "PartUsage" ? "part def" : kind === "PortUsage" ? "port def" : "action def";
      if (target && (target.keyword === okKind || (kind === "PortUsage" && target.keyword === "interface def"))) { ref.typeDraft = target; ref.typedBy = target.title; }
      else if (kind === "ActionUsage" && want === 0) { /* a plain step in an activity has no type; that is not a gap */ }
      else { diag = kind === "PartUsage" ? "UNRESOLVED_PART_TYPE" : kind === "PortUsage" ? "UNRESOLVED_PORT_TYPE" : "UNRESOLVED_ACTION_TYPE"; if (target) diag += `:TARGET_IS_${(target.keyword ?? "NOTE").replace(" ", "_").toUpperCase()}`; }
    }
    // IMP-110: a usage with no name of its own takes the name of its typed element (EA created these when the element was added as a part)
    const name = scopeOf(owner).take(usageIdent(e.name || e.alias || ref.typeDraft?.title || "", `${kind.replace("Usage", "").toLowerCase()}${e.id}`));
    ref.name = name;
    if (kind === "PartUsage") { const m = parseMultiplicity(e.multiplicity); if (m.text) ref.mult = m.text; if (!m.ok) diag = (diag ? diag + ";" : "") + "MULTIPLICITY_UNPARSED"; }
    owner.usages.push(ref); usageByObj.set(e.id, { owner, ref });
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
  track.stage = "connectors";
  // ---- connectors ---------------------------------------------------------------------------------------------------
  const deferredLinks: Array<{ c: EaConnector; code: string; family: string }> = [];
  // IMP-096: what the SysML block says is not repeated in Source: EA. `line` is kept only where it carries something SysML does not (a guard or trigger text).
  const addStmt = (d: Draft, text: string, line = ""): void => { if (!d.members.includes(text)) d.members.push(text); if (/^- (Succession|Transition) /.test(line) && !d.sourceLines.includes(line)) d.sourceLines.push(line); };
  const DEP_WORD: Record<string, string> = { "Dependency:refine": "refines", "Abstraction:Refine": "refines", "Dependency:trace": "trace", "Abstraction:trace": "trace", Dependency: "dependsOn", Usage: "uses" };
  const DERIVE = new Set(["Realisation:deriveReqt", "Dependency:deriveReqt", "Dependency:RecoveryRequirement", "Abstraction:Derive"]);
  const ALLOCATE = new Set(["Abstraction:allocate", "Usage:Responsibility"]);
  for (const c of g.connectors) guard("connector", "t_connector", c, () => {
    const key = connectorKey(c);
    const r = row("t_connector", c.id, c.guid, c.type, c.stereotype, 0, "family:" + key);
    const src = byObj.get(c.sourceId), dst = byObj.get(c.destId);
    const defer = (code: string, action = "Native relationship not emitted"): void => {
      set(r, "deferred_review", "", code, action); deferredLinks.push({ c, code, family: key });
      if (src) {
        const to = dst ? `[[${dst.baseName}]]` : (g.objectsById.get(c.destId)?.name ?? `object ${c.destId}`);
        src.sourceLines.push(`- Connector ${key} to ${to} (unresolved: ${code})`);
        flagLink(src, `Unresolved ${key} link to ${dst ? dst.title : (g.objectsById.get(c.destId)?.name ?? "?")}`, [`No native relationship was written (${code}). See the ledger row for EA connector ${c.guid}.`]);
      }
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
          info.describes.push(other.baseName); set(r, "native", "MdseLink:describes"); r.target_stable_id = info.id; r.target_file = info.path;
          return;
        }
        set(r, "evidence_only", "", "NOTELINK_ENDPOINT_NOT_INFO_NOTE"); return;
      }
      set(r, "evidence_only", "", "REFERENCE_ONLY"); return;
    }
    if (key === "Nesting") { set(r, "evidence_only", "", "ORGANIZATIONAL_ONLY"); return; }
    if (!o.emitNative) { defer("NATIVE_EMISSION_DISABLED"); return; }
    const kw = (d?: Draft): string => d?.keyword ?? "";
    const srcLine = (verb: string, other: Draft): string => `- ${verb} [[${other.baseName}]]`;
    if (key === "Generalization") {
      if (src && dst && src.keyword && src.keyword === dst.keyword && src !== dst) {
        src.specializes.push(dst); set(r, "native", "Specialization"); r.target_stable_id = src.id; r.target_file = src.path;
        return;
      }
      defer("GENERALIZATION_ENDPOINT_KIND"); return;
    }
    if (key === "Aggregation") {
      const srcWhole = c.sourceIsAggregate === 1 || c.sourceIsAggregate === 2, dstWhole = c.destIsAggregate === 1 || c.destIsAggregate === 2;
      if (srcWhole === dstWhole) { defer(srcWhole ? "AGGREGATION_BOTH_ENDS_AGGREGATE" : "AGGREGATION_WHOLE_NOT_EVIDENCED"); return; }
      const whole = srcWhole ? src : dst, part = srcWhole ? dst : src, card = srcWhole ? c.destCard : c.sourceCard;
      if (!whole || !part || whole.keyword !== "part def" || part.keyword !== "part def") { defer("AGGREGATION_ENDPOINT_KIND"); return; }
      const owned = whole.usages.find((u) => u.kind === "part" && u.typeDraft === part);
      if (owned) {                                                  // an EA Part usage already says this; the usage wins
        set(r, "alias_merged", "TypedOwnedUsage", "USAGE_WINS"); r.target_stable_id = whole.id; r.target_file = whole.path; r.evidence = `merged into usage ${owned.name}`;
        return;
      }
      const m = parseMultiplicity(card);
      const name = scopeOf(whole).take(usageIdent(part.title, `part${part.o.id}`));
      whole.usages.push({ kind: "part", name, typeDraft: part, typedBy: part.title, ...(m.text ? { mult: m.text } : {}), objGuid: c.guid });
      set(r, "native", "TypedOwnedUsage", m.ok ? "" : "MULTIPLICITY_UNPARSED"); r.target_stable_id = whole.id; r.target_file = whole.path;
      return;
    }
    if (key === "Dependency:satisfy") {
      const req = [src, dst].find((d) => kw(d) === "requirement def"), by = req === src ? dst : src;
      if (!req || !by || !["part def", "action def", "state def"].includes(kw(by))) { defer("SATISFY_ENDPOINT_KIND"); return; }
      addStmt(by, `satisfy ${req.symbol};`, srcLine("Satisfies", req)); done(by, "SatisfyRequirementUsage"); return;
    }
    if (key === "Dependency:verify") {
      const ver = [src, dst].find((d) => kw(d) === "verification def"), req = [src, dst].find((d) => kw(d) === "requirement def");
      if (!ver || !req) { defer("VERIFY_ENDPOINT_KIND"); return; }
      if (!ver.verifies.includes(req.symbol)) ver.verifies.push(req.symbol);
      done(ver, "VerifyRequirementUsage"); return;
    }
    if (ALLOCATE.has(key)) {
      if (!src || !dst || !src.keyword || !dst.keyword) { defer("ALLOCATE_ENDPOINT_KIND"); return; }
      addStmt(src, `allocate ${src.symbol} to ${dst.symbol};`, srcLine("Allocated to", dst)); done(src, "AllocationUsage"); return;
    }
    if (key === "Realisation") {
      if (src?.keyword === "part def" && dst?.keyword === "action def") {
        const nm = scopeOf(src).take(usageIdent(dst.title, `action${dst.o.id}`));
        addStmt(src, `perform action ${nm} : ${dst.symbol};`, srcLine("Performs", dst)); done(src, "PerformActionUsage"); return;
      }
      if (src?.keyword === "part def" && dst?.keyword === "requirement def") { addStmt(src, `allocate ${dst.symbol} to ${src.symbol};`, srcLine("Realises", dst)); done(src, "AllocationUsage"); return; }
      if (src?.keyword === "part def" && dst?.keyword === "part def") { addStmt(src, `allocate ${src.symbol} to ${dst.symbol};`, srcLine("Realises", dst)); done(src, "AllocationUsage"); return; }
      defer("REALISATION_ENDPOINT_KIND"); return;
    }
    if (DERIVE.has(key)) {
      if (src?.keyword !== "requirement def" || dst?.keyword !== "requirement def") { defer("DERIVE_ENDPOINT_KIND"); return; }
      addStmt(src, `dependency from ${src.symbol} to ${dst.symbol}; // derivedFrom`, srcLine("Derived from", dst)); done(src, "Dependency"); return;
    }
    if (DEP_WORD[key]) {
      if (!src?.keyword || !dst?.keyword) { defer("DEPENDENCY_ENDPOINT_KIND"); return; }
      addStmt(src, `dependency from ${src.symbol} to ${dst.symbol}; // ${DEP_WORD[key]}`, srcLine(`Dependency (${DEP_WORD[key]})`, dst)); done(src, "Dependency"); return;
    }
    if (key === "Association") { defer("ASSOCIATION_CONNECTIVITY_NOT_PROVEN", "An association is not a connection; model it as a Connector between ports"); return; }
    if (key === "Connector") {
      const a = usageByObj.get(c.sourceId), b = usageByObj.get(c.destId);
      if (!a || !b || a.ref.kind !== "port" || b.ref.kind !== "port") { defer("CONNECTOR_ENDPOINT_NOT_PORT"); return; }
      if (a.owner !== b.owner) {                                     // find the one definition that owns a part of each end's type
        const ctxs = drafts.filter((w) => w.keyword === "part def" && w.usages.some((u) => u.kind === "part" && u.typeDraft === a.owner) && w.usages.some((u) => u.kind === "part" && u.typeDraft === b.owner));
        if (!ctxs.length) { defer("PORT_CONNECTION_NEEDS_COMMON_OWNER"); return; }
        const w = ctxs[0]!, ua = w.usages.filter((u) => u.kind === "part" && u.typeDraft === a.owner), ub = w.usages.filter((u) => u.kind === "part" && u.typeDraft === b.owner);
        if (ctxs.length > 1 || ua.length !== 1 || ub.length !== 1) { defer("PORT_CONNECTION_AMBIGUOUS_OWNER"); return; }
        addStmt(w, `connect ${ua[0]!.name}.${a.ref.name} to ${ub[0]!.name}.${b.ref.name};`, `- Connection ${ua[0]!.name}.${a.ref.name} to ${ub[0]!.name}.${b.ref.name}`); done(w, "ConnectionUsage"); return;
      }
      addStmt(a.owner, `connect ${a.ref.name} to ${b.ref.name};`, `- Connection ${a.ref.name} to ${b.ref.name}`); done(a.owner, "ConnectionUsage"); return;
    }
    if (key === "ControlFlow" || key === "StateFlow") {
      const okKinds = key === "ControlFlow" ? ["action", "fork", "join"] : ["state"];
      const a = usageByObj.get(c.sourceId), b = usageByObj.get(c.destId);
      if (!a || !b || !okKinds.includes(a.ref.kind) || !okKinds.includes(b.ref.kind)) { defer("FLOW_ENDPOINT_NOT_USAGE"); return; }
      if (a.owner !== b.owner) { defer("FLOW_DIFFERENT_OWNERS"); return; }
      const word = key === "ControlFlow" ? "succession" : "transition";
      // Guard, trigger and effect follow SysML v2 (IMP-098): `transition first a accept t if g do e then b;` / `succession first a if g then b;`.
      // Free text cannot be an expression, so each is a small named helper usage that carries the wording in `doc`.
      const clean = (x: string): string => x.replace(/\s+/g, " ").trim();
      let trig = isPlaceholder(c.pdata1) ? "" : clean(c.pdata1), grd = isPlaceholder(c.pdata2) ? "" : clean(c.pdata2), eff = isPlaceholder(c.pdata3) ? "" : clean(c.pdata3);
      const label = clean(c.name);
      if (label && !trig && !grd && !eff) { if (key === "ControlFlow") grd = label; else trig = label; }          // an unstructured label: guard on a control flow, trigger on a state flow
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
  // ---- render notes -------------------------------------------------------------------------------------------------
  const outFiles: OutFile[] = [];
  let blocks = 0, flagCount = 0;
  const tagDisp = new Map(o.tags.tags.map((t) => [t.tag, t.disposition] as const)), unlistedTags = new Map<string, number>();
  const attachFiles: OutFile[] = [], attachTaken = new Set<string>(existing?.allPaths ? [...existing.allPaths].map((p) => p.toLowerCase()) : []);
  let attachRows = 0;
  const generated = new Map<string, { path: string; text: string; guid: string; draft: Draft }>();
  for (const d of drafts) guard("render", "t_object", d.o, () => {
    const e = d.o, src = [`- EA GUID: ${e.guid}`];
    if (safeName(e.name) !== e.name.trim()) src.push(`- Name: ${e.name}`);
    if (e.alias) src.push(`- EA alias: ${e.alias}`);
    const isReq = d.keyword === "requirement def";
    let reqText = isReq ? e.note.trim() : "";
    for (const [k, v] of g.tags.get(e.id) ?? []) {
      if (isPlaceholder(v)) continue;
      if (isReq && /^(SysML1\.\d::)?text$/i.test(k.trim())) { if (!reqText.includes(v.trim())) reqText = [reqText, v.trim()].filter(Boolean).join("\n\n"); continue; }     // requirement wording lives in `doc` (IMP-097)
      const disp = tagDisp.get(k);
      if (disp === undefined) { unlistedTags.set(k, (unlistedTags.get(k) ?? 0) + 1); }          // new to the list: kept in the body until someone decides (W-33)
      else if (disp !== "body") continue;
      src.push(`- ${k}: ${v.replace(/\s*\n\s*/g, " ")}`);
    }
    src.push(...d.sourceLines);
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
      usages: d.usages.map((u) => ({ kind: u.kind, name: u.name, ...(u.dir ? { dir: u.dir } : {}), ...(u.typeDraft ? { typeSymbol: u.typeDraft.symbol } : {}), ...(u.mult ? { mult: u.mult } : {}) })),
      ...(reqText ? { doc: reqText } : {}), members: [...d.members, ...(d.verifies.length ? [`objective { ${d.verifies.map((v) => `verify ${v};`).join(" ")} }`] : [])] }) : null;
    if (sysml) blocks++;
    flagCount += d.flags.length;
    const model: NoteModel = { type: d.type, subtype: d.subtype, id: d.id, uid: d.uid, eaType: d.family, title: d.title, relFields: d.describes.length ? [["describes", d.describes]] : [],
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
  const elementsCsv = csv(["ea_guid", "ea_type", "ea_stereotype", "name", "package", "author", "created", "note", "diagnostic_code", "operator_action"],
    deferredElements.map((l) => { const e = g.objects.find((x) => String(x.id) === l.source_pk)!; return [l.ea_guid, l.ea_type, l.ea_stereotype, e.name, pkgPath(e.packageId).join(" > "), e.author, e.created, e.note, l.diagnostic_code, l.operator_action]; }));
  const linksCsv = csv(["ea_guid", "family", "source_name", "source_guid", "target_name", "target_guid", "direction", "connector_name", "diagnostic_code"],
    deferredLinks.map(({ c, code, family }) => [c.guid, family, named(c.sourceId), g.objectsById.get(c.sourceId)?.guid ?? "", named(c.destId), g.objectsById.get(c.destId)?.guid ?? "", c.direction, c.name, code]));
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
