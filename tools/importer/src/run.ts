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
import { planMerge } from "./merge.ts";
import type { ExistingVault, OutFile, ChangeEntry } from "./merge.ts";

export type { ExistingVault, OutFile, ChangeEntry } from "./merge.ts";

export interface ClassTable { [type: string]: { prefix: string; subtype: string[]; prefixBySubtype?: Record<string, string> } }

export interface ImportOptions {
  sourceName: string;
  fingerprint: string;
  runDate: string;                                 // local time, "YYYY-MM-DDTHH:MM:SS"
  lineage: string;                                 // source lineage label, MOD-018 (EA8647)
  authors: AuthorOptions;
  omitRootPackages: string[];                      // package names that are not folders (MOD-096)
  vaultName: string;
  releaseVersion: string;
  classes: ClassTable;
  mapping: FamilyMapping;
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
  created: number; unchanged: number; updated: number; conflicts: number;
}
export interface ImportResult {
  status: "WRITE_READY" | "NO_CHANGES" | "FAILED";
  files: OutFile[];
  ledger: LedgerRow[];
  changes: ChangeEntry[];
  summary: ImportSummary;
  problems: string[];
}

interface UsageRef { kind: UsageDecl["kind"]; name: string; typeDraft: Draft | null; mult?: string; objGuid: string; typedBy: string }
interface Draft {
  key: string; o: EaObject; family: string; entry: ElementEntry; type: string; subtype: string; evidence: string[];
  title: string; uid: string; id: string; baseName: string; path: string; ownDir: string | null; parent: Draft | null; children: Draft[];
  keyword: string | null; pkg: string; ident: string; symbol: string; specializes: Draft[]; usages: UsageRef[];
  flags: string[]; sourceLines: string[]; describes: string[]; existingPath?: string; pkgPath: string[];
}

const LEDGER_ORDER = ["t_package", "t_object", "t_connector"];
const DROPPED_TAGS = new Set(["Status", "Object Type", "Applicability Status", "Priority", "Abstraction Layer", "Domain", "Origin"]);   // IMP-029
const RESERVED_NAME = /^(Template - |Rule - |README_|BASE_|CANVAS_)/;
const SYSTEM_DIR = "99_System/11_Import";

const stampOf = (iso: string): string => iso.replace(/[-:T]/g, "").slice(0, 14) + "000";
const labelOf = (iso: string): string => iso.slice(0, 16).replace("T", " ").replace(":", ".");

export async function runImport(reader: ReaderLike, o: ImportOptions): Promise<ImportResult> {
  const problems: string[] = [];
  if (reader.walMode) throw new Error("SQLITE_WAL_MODE: close the model in EA or checkpoint it first; the WAL is not read (IMP-053)");
  const g = await readSourceGraph(reader);
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
  const objRow = new Map<number, LedgerRow>();
  for (const e of g.objects) {
    const key = e.stereotype ? `${e.type}:${e.stereotype}` : e.type;
    const r = row("t_object", e.id, e.guid, e.type, e.stereotype, e.packageId, "family:" + key); objRow.set(e.id, r);
    if (e.type === "Package") { set(r, "native", "Folder"); r.rule_id = "folder_only"; continue; }
    const hit = resolver.element(e.type, e.stereotype);
    if (!hit) { set(r, "deferred_review", "", "UNKNOWN_FAMILY", "Map this family or confirm it is out of scope"); r.confidence = "unmapped"; continue; }
    const en = hit.entry;
    if (isUsageEntry(en)) { usageObjs.push({ o: e, entry: en, row: r }); continue; }
    if (en.disposition === "native_candidate" && en.native_kind && DEFINITION_KINDS[en.native_kind] || en.disposition === "mdse_note") {
      const cls = classify(en, e, pkgPath(e.packageId));
      if (!cls || !o.classes[cls.type]) { set(r, "error", "", "NO_CLASS_FOR_FAMILY"); problems.push(`element ${e.id} ${key}: no MDSE class`); continue; }
      const kw = en.native_kind ? DEFINITION_KINDS[en.native_kind] ?? null : null;
      const title = e.name.trim() || e.alias.trim() || `Unnamed ${e.id}`;
      const d: Draft = { key: `o:${e.id}`, o: e, family: key, entry: en, type: cls.type, subtype: cls.subtype, evidence: cls.evidence, title, uid: "", id: "", baseName: "", path: "", ownDir: null, parent: null, children: [], keyword: kw && o.emitNative ? kw : null, pkg: "", ident: sysmlIdent(title), symbol: "", specializes: [], usages: [], flags: [], sourceLines: [], describes: [], pkgPath: pkgPath(e.packageId) };
      drafts.push(d); byObj.set(e.id, d); continue;
    }
    if (en.disposition === "attachment_link") { set(r, "deferred_review", "", "ATTACHMENT_NOT_IMPLEMENTED", "Attachments are a later step (IMP-025)"); continue; }
    if (en.disposition === "reference_only") { set(r, "evidence_only", "", "REFERENCE_ONLY"); continue; }
    if (en.disposition === "aggregate_boundary_note") { boundaries.push({ o: e, row: r }); continue; }
    if (en.disposition === "conditional_review") { set(r, "deferred_review", "", en.conditional_evidence[0] ?? "CONDITIONAL_REVIEW", "Needs the evidence named in the diagnostic"); continue; }
    set(r, "deferred_review", "", "UNHANDLED_DISPOSITION_" + en.disposition);
  }

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

  // ---- usages owned by definitions -----------------------------------------------------------------------------------
  const scopes = new Map<Draft, IdentScope>();
  const scopeOf = (d: Draft): IdentScope => scopes.get(d) ?? (scopes.set(d, new IdentScope()), scopes.get(d)!);
  const flagLink = (d: Draft, title: string, detail: string[]): void => { d.flags.push(flagCallout("flagLink", title, sourceLink, detail)); };
  const ownerKeyword: Record<string, string> = { PartUsage: "part def", PortUsage: "part def", ActionUsage: "action def", StateUsage: "state def" };
  usageObjs.sort((a, b) => a.o.id - b.o.id);
  for (const u of usageObjs) {
    const e = u.o, kind = u.entry.native_kind!;
    const owner = byObj.get(e.parentId);
    if (kind === "ItemUsage") { set(u.row, "deferred_review", kind, "DIRECTION_EVIDENCE_MISSING", "Port item usage needs owning port and direction evidence"); continue; }
    if (!owner || !owner.keyword) { set(u.row, "deferred_review", kind, "USAGE_WITHOUT_NOTE_OWNER", "Owner is not a definition note"); continue; }
    if (owner.keyword !== ownerKeyword[kind]) { set(u.row, "deferred_review", kind, "USAGE_OWNER_KIND_MISMATCH", `${kind} inside ${owner.keyword}`); continue; }
    const name = scopeOf(owner).take(usageIdent(e.name || e.alias, `${kind.replace("Usage", "").toLowerCase()}${e.id}`));
    const ref: UsageRef = { kind: kind === "PartUsage" ? "part" : kind === "PortUsage" ? "port" : kind === "ActionUsage" ? "action" : "state", name, typeDraft: null, objGuid: e.guid, typedBy: "" };
    let diag = "";
    if (kind === "PartUsage" || kind === "PortUsage" || kind === "ActionUsage") {
      const want = kind === "PartUsage" ? Number(e.pdata1) || 0 : e.classifier;                      // IMP-011: the block comes from PDATA1
      const target = byObj.get(want);
      const okKind = kind === "PartUsage" ? "part def" : kind === "PortUsage" ? "port def" : "action def";
      if (target && target.keyword === okKind) { ref.typeDraft = target; ref.typedBy = target.title; }
      else { diag = kind === "PartUsage" ? "UNRESOLVED_PART_TYPE" : kind === "PortUsage" ? "UNRESOLVED_PORT_TYPE" : "UNRESOLVED_ACTION_TYPE"; if (target) diag += `:TARGET_IS_${(target.keyword ?? "NOTE").replace(" ", "_").toUpperCase()}`; }
    }
    if (kind === "PartUsage") { const m = parseMultiplicity(e.multiplicity); if (m.text) ref.mult = m.text; if (!m.ok) diag = (diag ? diag + ";" : "") + "MULTIPLICITY_UNPARSED"; }
    owner.usages.push(ref);
    set(u.row, "native", kind, diag.split(";").find((x) => x.startsWith("UNRESOLVED")) ?? diag, diag ? "Review: usage written without a type" : "");
    u.row.target_stable_id = owner.id; u.row.target_file = owner.path; if (diag) u.row.evidence = diag;
    if (diag.startsWith("UNRESOLVED")) flagLink(owner, `Untyped ${ref.kind} usage \`${name}\``, [`The EA ${u.o.type} \`${e.name}\` has no resolvable definition of the right kind (${diag}). It is written without a type.`]);
    owner.sourceLines.push(`- Usage: ${ref.kind} ${name}${ref.typeDraft ? ` : [[${ref.typeDraft.baseName}]]` : " (untyped)"}${ref.mult ?? ""} — EA GUID: ${e.guid}`);
  }

  // ---- connectors ---------------------------------------------------------------------------------------------------
  const deferredLinks: Array<{ c: EaConnector; code: string; family: string }> = [];
  const aggScopes = new Map<Draft, number>();
  for (const c of g.connectors) {
    const key = connectorKey(c);
    const r = row("t_connector", c.id, c.guid, c.type, c.stereotype, 0, "family:" + key);
    const src = byObj.get(c.sourceId), dst = byObj.get(c.destId);
    const defer = (code: string, action = "Native relationship not emitted"): void => {
      set(r, "deferred_review", "", code, action); deferredLinks.push({ c, code, family: key });
      if (src) {
        const to = dst ? `[[${dst.baseName}]]` : (g.objectsById.get(c.destId)?.name ?? `object ${c.destId}`);
        src.sourceLines.push(`- Connector ${key} to ${to} (unresolved: ${code}) — EA GUID: ${c.guid}`);
        flagLink(src, `Unresolved ${key} link to ${dst ? dst.title : (g.objectsById.get(c.destId)?.name ?? "?")}`, [`No native relationship was written (${code}). See the ledger row for EA connector ${c.guid}.`]);
      }
    };
    const hit = resolver.relationship(c.type, c.stereotype);
    if (!hit) { r.confidence = "unmapped"; defer("UNKNOWN_FAMILY", "Map this connector family or confirm it is out of scope"); continue; }
    if (!g.objectsById.has(c.sourceId) || !g.objectsById.has(c.destId)) { defer("ENDPOINT_MISSING_IN_SOURCE"); continue; }
    const en = hit.entry;
    if (en.disposition === "reference_only") {
      if (c.type === "NoteLink") {
        const info = src?.type === "Info" ? src : dst?.type === "Info" ? dst : null, other = info === src ? dst : src;
        if (info && other) {
          info.describes.push(other.baseName); set(r, "native", "MdseLink:describes"); r.target_stable_id = info.id; r.target_file = info.path;
          info.sourceLines.push(`- Link describes [[${other.baseName}]] — EA GUID: ${c.guid}`); continue;
        }
        set(r, "evidence_only", "", "NOTELINK_ENDPOINT_NOT_INFO_NOTE"); continue;
      }
      set(r, "evidence_only", "", "REFERENCE_ONLY"); continue;
    }
    if (key === "Nesting") { set(r, "evidence_only", "", "ORGANIZATIONAL_ONLY"); continue; }
    if (!o.emitNative) { defer("NATIVE_EMISSION_DISABLED"); continue; }
    if (key === "Generalization") {
      if (src && dst && src.keyword && src.keyword === dst.keyword && src !== dst) {
        src.specializes.push(dst); set(r, "native", "Specialization"); r.target_stable_id = src.id; r.target_file = src.path;
        src.sourceLines.push(`- Specializes [[${dst.baseName}]] — EA GUID: ${c.guid}`); continue;
      }
      defer("GENERALIZATION_ENDPOINT_KIND"); continue;
    }
    if (key === "Aggregation") {
      const srcWhole = c.sourceIsAggregate === 1 || c.sourceIsAggregate === 2, dstWhole = c.destIsAggregate === 1 || c.destIsAggregate === 2;
      if (srcWhole === dstWhole) { defer(srcWhole ? "AGGREGATION_BOTH_ENDS_AGGREGATE" : "AGGREGATION_WHOLE_NOT_EVIDENCED"); continue; }
      const whole = srcWhole ? src : dst, part = srcWhole ? dst : src, card = srcWhole ? c.destCard : c.sourceCard;
      if (!whole || !part || whole.keyword !== "part def" || part.keyword !== "part def") { defer("AGGREGATION_ENDPOINT_KIND"); continue; }
      const m = parseMultiplicity(card);
      const name = scopeOf(whole).take(usageIdent(part.title, `part${part.o.id}`));
      whole.usages.push({ kind: "part", name, typeDraft: part, typedBy: part.title, ...(m.text ? { mult: m.text } : {}), objGuid: c.guid });
      set(r, "native", "TypedOwnedUsage", m.ok ? "" : "MULTIPLICITY_UNPARSED"); r.target_stable_id = whole.id; r.target_file = whole.path;
      whole.sourceLines.push(`- Aggregation: part ${name} : [[${part.baseName}]]${m.text ?? ""} — EA GUID: ${c.guid}`); aggScopes.set(whole, 1); continue;
    }
    defer(`NATIVE_EMISSION_NOT_IMPLEMENTED:${key}`, `Needs: ${en.required_evidence.join(", ")}`);
  }

  // ---- render notes -------------------------------------------------------------------------------------------------
  const outFiles: OutFile[] = [];
  let blocks = 0, flagCount = 0;
  const generated = new Map<string, { path: string; text: string; guid: string; draft: Draft }>();
  for (const d of drafts) {
    const e = d.o, src = [`- EA GUID: ${e.guid}`];
    if (safeName(e.name) !== e.name.trim()) src.push(`- Name: ${e.name}`);
    src.push(`- EA type: ${e.type}`);
    if (e.stereotype) src.push(`- EA stereotype: ${e.stereotype}`);
    if (e.alias) src.push(`- EA alias: ${e.alias}`);
    if (e.author) src.push(`- EA author: ${e.author}`);
    if (e.created) src.push(`- EA created: ${e.created}`);
    if (d.pkgPath.length) src.push(`- EA package: ${d.pkgPath.join(" > ")}`);
    for (const [k, v] of g.tags.get(e.id) ?? []) if (v.trim() && !DROPPED_TAGS.has(k)) src.push(`- ${k}: ${v.replace(/\s*\n\s*/g, " ")}`);
    src.push(...d.sourceLines);
    const sysml = d.keyword ? renderBlock({ keyword: d.keyword, pkg: d.pkg, name: d.ident, specializes: d.specializes.map((s) => s.symbol),
      usages: d.usages.map((u) => ({ kind: u.kind, name: u.name, ...(u.typeDraft ? { typeSymbol: u.typeDraft.symbol } : {}), ...(u.mult ? { mult: u.mult } : {}) })) }) : null;
    if (sysml) blocks++;
    flagCount += d.flags.length;
    const model: NoteModel = { type: d.type, subtype: d.subtype, id: d.id, uid: d.uid, eaType: d.family, title: d.title, relFields: d.describes.length ? [["describes", d.describes]] : [],
      bodyText: e.note, flags: d.flags, sourceLines: src, sysml, ...(sysml ? { sourceRole: "authoritative-model", primarySymbol: d.symbol } : {}) };
    generated.set(d.path, { path: d.path, text: renderNote(model), guid: e.guid, draft: d });
    const r = objRow.get(e.id)!;
    set(r, "native", d.keyword ? d.entry.native_kind! : `MdseNote:${d.type}`, d.evidence[0] ?? ""); r.target_stable_id = d.id; r.target_file = d.path; r.evidence = d.evidence.join(";");
  }

  // aggregate boundary note (MOD-131)
  if (boundaries.length) {
    const guid = aggregate!.guid, known = idx?.byGuid.get(guid);
    const uid = known?.uid ?? uids.get("boundary")!.uid, id = known?.id ?? ids.get("boundary")!, path = known?.path ?? `${claim("Boundaries")}.md`;
    const lines = [`- EA GUID: ${guid}`, `- EA type: Boundary`, ...boundaries.map((b) => `- Boundary: ${b.o.name || "(unnamed)"} — EA package: ${pkgPath(b.o.packageId).join(" > ") || "(root)"} — EA GUID: ${b.o.guid}`)];
    generated.set(path, { path, guid, draft: undefined as unknown as Draft, text: renderNote({ type: "modelCheck", subtype: "Boundary", id, uid, eaType: "Boundary", title: "Boundaries", relFields: [], bodyText: "Aggregate of every EA Boundary element (MOD-131). Descriptive evidence, not a native SysML relationship.", flags: [], sourceLines: lines, sysml: null }) });
    for (const b of boundaries) { set(b.row, "evidence_only", "MdseNote:modelCheck/Boundary", "BOUNDARY_GROUPED"); b.row.target_stable_id = id; b.row.target_file = path; }
  }

  // ---- reconcile: every source row has exactly one disposition (IMP-059, IMP-064) ---------------------------------------
  const expect: Record<string, number> = { t_package: g.counts.t_package, t_object: g.counts.t_object, t_connector: g.counts.t_connector };
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
    counts: { t_package: g.counts.t_package, t_object: g.counts.t_object, t_connector: g.counts.t_connector, t_objectproperties: g.counts.t_objectproperties }, dispositions, notes: generated.size, sysmlBlocks: blocks, flags: flagCount, problems,
    nativeEmission: o.emitNative ? "ON (owner override of emission_enabled=false, D-0016); blocks not parser-checked" : "OFF", diagrams: "never read (ADR-V2-05)" };

  // ---- merge / write plan --------------------------------------------------------------------------------------------------
  const plan = planMerge({ generated: [...generated.values()].map((x) => ({ path: x.path, text: x.text, guid: x.guid })), existing, preApproved: o.preApproved, sourceLink, runLabel,
    sourceName: o.sourceName, presentGuids: new Set(g.objects.map((x) => x.guid).concat([...g.packages.values()].map((p) => p.guid))) });
  const sysFiles: OutFile[] = [];
  if (plan.changed || !existing) {
    sysFiles.push(sys("Ledger.csv", csv([...LEDGER_COLUMNS], ledger.map((l) => LEDGER_COLUMNS.map((k) => l[k])))), sys("Run Manifest.json", JSON.stringify(manifest, null, 2) + "\n"),
      sys("Review - Deferred Elements.csv", elementsCsv), sys("Review - Deferred Links.csv", linksCsv),
      sys("Parser Check.md", `# Parser Check\n\nStatus: **NOT RUN**. ${blocks} SysML v2 block(s) were generated in this run and none has been checked by the pinned parser.\nThe parser gate runs in CI or on a maintainer's machine, not in the importer page (MOD-139). Workbench must show these blocks as unchecked.\n`));
    if (!existing) sysFiles.push(sys(`Import Run ${runLabel}.md`, runNote(o, g, dispositions, blocks, flagCount, problems, generated.size)));
    else sysFiles.push(sys(`Changelog ${runLabel}.md`, plan.changelog));
  }
  outFiles.push(...plan.writes, ...sysFiles);
  let baseIncluded = false;
  if (!existing && o.baseFiles) {
    baseIncluded = true;
    const stamp = stampOf(o.runDate), vaultUid = `${stamp}${o.authors.fallbackCode}`;
    for (const [p, text] of Object.entries(o.baseFiles)) {
      const t = p === ".vault.yaml" ? text.replace(/^vault_uid:.*$/m, `vault_uid: ${vaultUid}`).replace(/^vault_name:.*$/m, `vault_name: ${o.vaultName}`).replace(/^author:.*$/m, `author: ${o.authors.fallbackCode}`).replace(/^mdse_release:.*$/m, `mdse_release: ${o.releaseVersion}`) : text;
      outFiles.push({ path: p, content: t });
    }
  }
  outFiles.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const dup = outFiles.map((f) => f.path.toLowerCase()).filter((p, i, a) => a.indexOf(p) !== i);
  if (dup.length) problems.push(`duplicate output paths: ${dup.slice(0, 5).join(", ")}`);
  const status = problems.length ? "FAILED" : existing && !plan.changed ? "NO_CHANGES" : "WRITE_READY";
  return { status, files: status === "FAILED" ? [] : outFiles, ledger, changes: plan.changes, problems,
    summary: { elements: g.counts.t_object, connectors: g.counts.t_connector, packages: g.counts.t_package, notes: generated.size, dispositions, flags: flagCount, sysmlBlocks: blocks, baseVaultIncluded: baseIncluded, created: plan.created, unchanged: plan.unchanged, updated: plan.updated, conflicts: plan.conflicts } };
}

function runNote(o: ImportOptions, g: SourceGraph, disp: Record<string, number>, blocks: number, flags: number, problems: string[], notes: number): string {
  return `# Import Run ${labelOf(o.runDate)}\n\nSource \`${o.sourceName}\` (${o.lineage}), SHA-256 \`${o.fingerprint}\`.\n\n| | |\n|---|---|\n| Packages | ${g.counts.t_package} |\n| Elements | ${g.counts.t_object} |\n| Connectors | ${g.counts.t_connector} |\n| Notes written | ${notes} |\n| SysML v2 blocks (not parser-checked) | ${blocks} |\n| Flags | ${flags} |\n\n## Dispositions\n\n${Object.entries(disp).sort().map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n${problems.length ? `## Problems\n\n${problems.map((p) => `- ${p}`).join("\n")}\n\n` : ""}Ledger: \`Ledger.csv\`. Review tables: \`Review - Deferred Elements.csv\`, \`Review - Deferred Links.csv\`.\n`;
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
