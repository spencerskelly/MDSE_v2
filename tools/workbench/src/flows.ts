/* PLM flows (D-0169, WKB-076): guided, section-by-section forms an engineer follows to change, create, redline, review,
 * specify, release and verify. Plain logic, no DOM; flows_ui.ts draws it.
 *
 * - A flow works on the note selected in the Workbench when it starts (its pick). Fields marked `from` are filled from
 *   that note and keep their starting value, so a change shows what it was.
 * - Each section ends with Submitted. A section with an empty required field cannot be submitted. Changing a value in a
 *   submitted section makes it "edited since submitted" until it is submitted again.
 * - Submitting a section saves the whole flow, unsubmitted edits included, as one record note in `_ops/Flows/`. The
 *   note has no `type` or `uid`, so it is not a model note: the index skips it and no SysML is written. Its YAML header
 *   names the flow; its body is the evidence of work (submitted sections only); a fenced `mdse-flow` block holds the
 *   state the Workbench reads back to reopen the flow.
 * - Flow IDs are PREFIX-yymm-nnnn, numbered from the flow records in this working tree; the GUID is a 30-character
 *   time-and-author token in the model UID format, so it is unique across people and branches. */
import type { ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";
import * as V from "./views.ts";
import { edUid } from "./edit.ts";
import type { EditPlan } from "./edit.ts";
import { REASON_BLOCKS, FLOW_DEFS } from "./flow_defs.ts";

export interface FlowField {
  id: string; label: string; kind?: "text" | "area" | "read" | "select"; v?: string; req?: boolean; ph?: string; opts?: string[];
  tag?: string; hint?: string; dyn?: string; y?: string; ylist?: boolean;
  /** note property (or @-derived value) that fills the field when the flow starts */
  from?: string;
  /** `table:column`: more options taken from the rows of a table in this flow */
  optsFrom?: string;
}
export interface FlowCol { k: string; label: string; edit?: boolean; opts?: string[] }
export type FlowRow = Record<string, string>;
export interface FlowBlock {
  t: "head" | "group" | "table" | "yaml" | "canvas" | "evidence"; n?: number; title?: string; codes?: string; who?: string; intro?: string;
  label?: string; crit?: boolean; caption?: string; fields?: FlowField[]; id?: string; note?: string; cols?: FlowCol[]; rows?: FlowRow[];
  /** mech | fw | asm | copy: shown only when that applies */
  show?: string;
  /** computed table: whereUsed | children | requirements | issues | ecoFlows | verifications */
  src?: string;
  from?: string; include?: string; group?: string; item?: string; file?: string;
}
export interface FlowFile { f: string; a: string; fmt: string; loc: string }
export interface FlowDef {
  id: string; name: string; group: string; pick: string; copy: boolean; wasLabel: string; files: FlowFile[];
  subtypeId?: string; typeId?: string; blocks: FlowBlock[];
}
export interface FlowSection { key: string; title: string; head: FlowBlock; blocks: FlowBlock[] }
export interface FlowSubmit { at: string; by: string; hash: string }
export interface FlowEvent { at: string; by: string; ev: "created" | "section_submitted" | "reopened" | "completed"; section?: string }
export interface FlowRecord {
  schema: 1; flow: string; flowId: string; guid: string; author: string; created: string;
  /** vault path of the note the flow works on ("" when it started blank) */
  pick: string; pickTitle: string;
  vals: Record<string, string>; base: Record<string, string>; rows: Record<string, FlowRow[]>;
  sub: Record<string, FlowSubmit>; events: FlowEvent[]; status: "open" | "complete";
}

export const FLOWS_DIR = "_ops/Flows";
export const FLOW_GROUPS = ["Change", "Define", "Verify"] as const;
export const flowDefs = (): FlowDef[] => FLOW_DEFS;
export const flowDef = (id: string): FlowDef | undefined => FLOW_DEFS.find((d) => d.id === id);

const FILES_BLOCKS = (def: FlowDef): FlowBlock[] => [
  { t: "head", title: "Files and evidence", codes: "Evidence of work", who: "The tool writes the flow record when you submit a section.",
    intro: `Submitted sections are saved as the evidence of work in ${FLOWS_DIR}. The files below are what this flow is for; in this version the tool writes only the flow record, and you make the other changes with the Edit lens or by hand.` },
  { t: "table", id: "files", title: "Files this flow creates or edits", note: "CAD files stay in PDM", src: "files",
    cols: [{ k: "f", label: "File" }, { k: "a", label: "Action" }, { k: "fmt", label: "Format" }, { k: "loc", label: "Location" }],
    rows: def.files.map((f) => ({ f: f.f, a: f.a, fmt: f.fmt, loc: f.loc })) },
];

/** The flow's sections in order: Driving reason, the flow's own sections, Files and evidence. */
export function flowSections(def: FlowDef): FlowSection[] {
  const all = [...REASON_BLOCKS, ...def.blocks, ...FILES_BLOCKS(def)];
  const out: FlowSection[] = [];
  for (const b of all) {
    if (b.t === "head") { out.push({ key: flSlug(b.title ?? "section", out.map((s) => s.key)), title: b.title ?? "", head: b, blocks: [] }); continue; }
    if (!out.length) throw new Error(`Flow ${def.id} has a block before its first heading.`);
    out[out.length - 1]!.blocks.push(b);
  }
  return out;
}
function flSlug(s: string, taken: string[]): string {
  const b = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  let k = b, i = 2; while (taken.includes(k)) k = `${b}-${i++}`; return k;
}
export const allFields = (def: FlowDef): FlowField[] => flowSections(def).flatMap((s) => s.blocks.flatMap((b) => b.fields ?? []));

/* ---- values from the selected note ------------------------------------------------------------------------ */
const flCap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const flChildren = (ix: ModelIndex, p: string) => V.bom(ix, p, 1);
/** The value of a `from` key for a note. Keys starting with @ are derived; others are YAML properties. */
export function noteValue(ix: ModelIndex, n: Note, key: string): string {
  const m = n.meta as Record<string, unknown>, s = (k: string): string => String(m[k] ?? "").trim();
  switch (key) {
    case "@label": return [s("partNumber") || n.id, n.title].filter(Boolean).join(" ");
    case "@description": return s("description") || n.title;
    case "@partType": return flChildren(ix, n.path).length ? "Assembly" : "Part";
    case "@makeBuy": { const v = s("makeBuy").toLowerCase(); return v === "make" || v === "buy" ? flCap(v) : ""; }
    case "@life": { const lc = V.viewPartLifecycle(n); return lc === "obsolete" ? "Obsolete" : lc === "proposed" ? "In design" : "Released"; }
    default: return s(key);
  }
}

/** Read-only values computed for the flow. "—" when the vault does not hold it. */
export function dynValue(key: string, ix: ModelIndex | null, rec: FlowRecord, def: FlowDef): string {
  const n = ix && rec.pick ? ix.notes.get(rec.pick) ?? null : null;
  const m = (k: string): string => String((n?.meta as Record<string, unknown> | undefined)?.[k] ?? "").trim() || "—";
  const parents = (): string[] => (ix && n ? V.whereUsed(ix, n.path, 1).tree.children.map((c) => c.path).filter((p): p is string => !!p) : []);
  const reqs = (): Note[] => (ix && n ? linkedRequirements(ix, n.path) : []);
  switch (key) {
    case "subCount": { const secs = flowSections(def).filter((s) => submittable(s)); return `${secs.filter((s) => sectionState(def, rec, s) === "submitted").length} of ${secs.length}`; }
    case "flowId": return rec.flowId;
    case "ecoNo": return rec.vals["rs.econo"] || "Set in Driving reason";
    case "newPn": return "Assigned by the person merging";
    case "pn": return m("partNumber");
    case "rev": case "srcRev": case "dRev": return m("revision");
    case "model": return n ? `${n.type}${n.subtype ? "/" + n.subtype : ""} ${n.id}`.trim() : "—";
    case "cls": case "srcType": case "dType": return n ? `${n.type}${n.subtype ? "/" + n.subtype : ""}` : "—";
    case "name": case "title": case "dPart": return n?.title ?? "—";
    case "life": case "dStatus": case "rel": return n ? `${noteValue(ix!, n, "@life")} (note ${n.status || "no status"})` : "—";
    case "used": case "srcUsed": case "dUsed": { const p = parents(); return n ? (p.length ? `${p.length} parent${p.length === 1 ? "" : "s"}` : "Not used in an assembly") : "—"; }
    case "lines": { const set = new Set(parents().map((p) => String(ix!.notes.get(p)?.meta.businessLine ?? "")).filter(Boolean)); const own = m("businessLine"); if (own !== "—") set.add(own); return set.size ? [...set].join(", ") : "—"; }
    case "reqs": { const r = reqs(); const unver = r.filter((q) => !incoming(ix!, q.path).some((e) => e.kind === "verifies")).length; return n ? `${r.length} linked, ${unver} with no test` : "—"; }
    case "openEco": { if (!ix || !n) return "—"; const o = openEcosFor(ix, n.path); return o.length ? o.join(", ") : "None"; }
    case "owner": return m("owner");
    case "reason": return m("reason");
    case "opened": return m("ecrDate");
    case "parent": { const p = parents(); return p.length ? p.map((x) => ix!.notes.get(x)?.title ?? x).join(", ") : "—"; }
    case "alts": return m("manufacturer2") !== "—" ? `${m("manufacturer2")} ${m("mfgPn2")}`.trim() : "None on record";
    case "items": { if (!ix || !n) return "—"; const d = n.links.filter((l) => l.field === "drives").length; return d ? `${d} item${d === 1 ? "" : "s"}` : "—"; }
    case "hw": case "repo": case "req": case "setup": case "unit": case "plan": case "method": case "phase": case "flows": case "cases":
    case "found": case "need": case "gaps": case "designs": case "dCopy": default: return m(key);
  }
}

export function linkedRequirements(ix: ModelIndex, path: string): Note[] {
  const out = new Set<string>();
  for (const e of outgoing(ix, path)) if ((e.kind === "satisfies" || e.kind === "derivedFrom" || e.kind === "refines") && e.to) out.add(e.to);
  return [...out].map((p) => ix.notes.get(p)).filter((x): x is Note => !!x && V.isRequirement(x));
}
function openEcosFor(ix: ModelIndex, path: string): string[] {
  return [...ix.notes.values()].filter((e) => e.type === "Info" && e.subtype === "change" && !e.meta.approvedOn)
    .filter((e) => e.links.some((l) => l.field === "drives" && ix.byName.get(l.target.toLowerCase()) === path)).map((e) => e.title);
}

/** Rows of a computed table when the flow starts. */
export function flowTableRows(src: string, ix: ModelIndex | null, n: Note | null, def: FlowDef, cols: FlowCol[], records: FlowRecord[]): FlowRow[] {
  const keys = cols.map((c) => c.k), row = (vals: string[]): FlowRow => Object.fromEntries(keys.map((k, i) => [k, vals[i] ?? ""]));
  const pn = (x: Note | undefined): string => String(x?.meta.partNumber ?? "") || x?.id || "";
  if (!ix || !n) return [];
  switch (src) {
    case "whereUsed": return V.whereUsed(ix, n.path, 1).tree.children.filter((c) => c.path).map((c) => { const p = ix.notes.get(c.path!); return row([pn(p), p?.title ?? c.path!, String(p?.meta.revision ?? ""), String(p?.meta.businessLine ?? ""), "Yes", "Yes"]); });
    case "children": return flChildren(ix, n.path).map((c, i) => { const p = ix.notes.get(c.path); return row([String((i + 1) * 10), pn(p), p?.title ?? c.title, String(p?.meta.revision ?? ""), String(c.qty), c.unit || "EA", "", noteValue(ix, p ?? n, "@makeBuy"), p ? noteValue(ix, p, "@life") : ""]); });
    case "requirements": return linkedRequirements(ix, n.path).map((q) => { const ver = incoming(ix, q.path).some((e) => e.kind === "verifies") ? "Verified by a linked case" : "No linked test"; return row([q.id, V.requirementText(q) || q.title, ver, q.subtype, ver]); });
    case "issues": return [...ix.notes.values()].filter((x) => x.type === "Issue" && x.status !== "Retired" && x.links.some((l) => ix.byName.get(l.target.toLowerCase()) === n.path)).map((x) => row([x.id, x.title, String(x.meta.severity ?? ""), String(x.meta.status ?? x.status)]));
    case "verifications": return incoming(ix, n.path).filter((e) => e.kind === "verifies").map((e) => ix.notes.get(e.from)).filter((x): x is Note => !!x).map((x) => row(["Yes", x.title, "Verifies " + n.title, "", x.subtype]));
    case "ecoFlows": return records.filter((r) => r.vals["rs.econo"] && (r.vals["rs.econo"] === n.title || r.vals["rs.econo"] === n.id)).map((r) => row([flowDef(r.flow)?.name ?? r.flow, r.flowId, r.status, `${Object.keys(r.sub).length}`]));
    default: return [];
  }
}

/* ---- identity --------------------------------------------------------------------------------------------- */
/** The person's name from their person note (Bootstrap writes `name` and `authorCode`); the code itself when there is none. */
export function authorName(files: Map<string, string>, code: string): string {
  if (!code) return "";
  const re = new RegExp(`^authorCode:\\s*${code.replace(/[^\w-]/g, "")}\\s*$`, "m");
  for (const t of files.values()) {
    if (!t.startsWith("---") || !re.test(t.slice(0, 600))) continue;
    const m = /^name:\s*(.+)$/m.exec(t.slice(0, 600)); if (!m) continue;
    const v = m[1]!.trim(); try { return v.startsWith('"') ? String(JSON.parse(v)) : v; } catch { return v; }
  }
  return code;
}
const flP2 = (x: number): string => String(x).padStart(2, "0");
/** Next PREFIX-yymm-nnnn after the highest one in these records. */
export function nextFlowId(prefix: string, now: Date, records: Array<{ flowId: string }>): string {
  const stem = `${prefix}-${flP2(now.getFullYear() % 100)}${flP2(now.getMonth() + 1)}-`;
  const max = records.map((r) => r.flowId).filter((id) => id.startsWith(stem)).map((id) => Number(id.slice(stem.length)) || 0).reduce((a, b) => Math.max(a, b), 0);
  return stem + String(max + 1).padStart(4, "0");
}
export const flowPath = (flowId: string): string => `${FLOWS_DIR}/${flowId}.md`;

/** Start a flow on the selected note. `author` is the 13-character author code; a blank code is refused by the caller. */
export function startFlow(def: FlowDef, ix: ModelIndex | null, pick: string, author: string, now: Date, records: FlowRecord[]): FlowRecord {
  const n = ix && pick ? ix.notes.get(pick) ?? null : null;
  const vals: Record<string, string> = {}, base: Record<string, string> = {}, rows: Record<string, FlowRow[]> = {};
  for (const s of flowSections(def)) for (const b of s.blocks) {
    for (const f of b.fields ?? []) {
      if (f.kind === "read") continue;
      let v = f.v ?? "";
      if (f.from && n && ix) { const nv = noteValue(ix, n, f.from); if (nv && (f.kind !== "select" || (f.opts ?? []).includes(nv))) { v = nv; base[f.id] = nv; } }
      vals[f.id] = v;
    }
    if (b.t === "table" && b.id && b.id !== "files") rows[b.id] = b.src ? flowTableRows(b.src, ix, n, def, b.cols ?? [], records) : (b.rows ?? []).map((r) => ({ ...r }));
  }
  if (def.copy) vals["start.mode"] = n ? "Existing part or assembly" : "Blank";
  const at = now.toISOString(), guid = edUid(author, now, new Set(records.map((r) => r.guid)));
  return { schema: 1, flow: def.id, flowId: nextFlowId(def.id, now, records), guid, author, created: at, pick: n?.path ?? "", pickTitle: n?.title ?? "",
    vals, base, rows, sub: {}, events: [{ at, by: author, ev: "created" }], status: "open" };
}

/* ---- what is shown ------------------------------------------------------------------------------------------- */
const FW_SUBTYPES = ["electrical", "circuit", "firmware", "software"];
/** Whether a block with a `show` condition applies to this flow's current values. */
export function flowShown(def: FlowDef, rec: FlowRecord, b: FlowBlock): boolean {
  if (!b.show) return true;
  const sub = (def.subtypeId ? rec.vals[def.subtypeId] : "") ?? "", type = (def.typeId ? rec.vals[def.typeId] : "") ?? "";
  if (b.show === "mech") return sub === "mechanical";
  if (b.show === "fw") return FW_SUBTYPES.includes(sub);
  if (b.show === "asm") return type === "Assembly";
  if (b.show === "copy") return rec.vals["start.mode"] !== "Blank";
  return true;
}
export const submittable = (s: FlowSection): boolean => s.key !== "files-and-evidence";
export function fieldOptions(f: FlowField, rec: FlowRecord): string[] {
  const base = [...(f.opts ?? [])];
  if (f.optsFrom) { const [t, c] = f.optsFrom.split(":"); for (const r of rec.rows[t!] ?? []) { const v = (r[c!] ?? "").trim(); if (v && !base.includes(v)) base.splice(Math.max(1, base.length - 1), 0, v); } }
  const cur = rec.vals[f.id] ?? ""; if (cur && !base.includes(cur)) base.push(cur);
  return base;
}

/* ---- submit ----------------------------------------------------------------------------------------------- */
/** The values a section's Submitted box vouches for: its visible editable fields and table rows. */
export function sectionContent(def: FlowDef, rec: FlowRecord, s: FlowSection): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const b of s.blocks) {
    if (!flowShown(def, rec, b)) continue;
    for (const f of b.fields ?? []) if (f.kind !== "read") o[f.id] = rec.vals[f.id] ?? "";
    if (b.t === "table" && b.id && b.id !== "files") o["table:" + b.id] = rec.rows[b.id] ?? [];
  }
  return o;
}
/** FNV-1a over a stable JSON form; enough to tell an edited section from a submitted one. */
export function flowHash(o: unknown): string {
  const s = flStable(o); let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(16).padStart(8, "0");
}
function flStable(o: unknown): string {
  if (Array.isArray(o)) return "[" + o.map(flStable).join(",") + "]";
  if (o && typeof o === "object") return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + flStable((o as Record<string, unknown>)[k])).join(",") + "}";
  return JSON.stringify(o ?? null);
}
export function sectionState(def: FlowDef, rec: FlowRecord, s: FlowSection): "submitted" | "stale" | "open" {
  const sub = rec.sub[s.key]; if (!sub) return "open";
  return sub.hash === flowHash(sectionContent(def, rec, s)) ? "submitted" : "stale";
}
/** Labels of required visible fields that are empty. */
export function missingRequired(def: FlowDef, rec: FlowRecord, s: FlowSection): string[] {
  const out: string[] = [];
  for (const b of s.blocks) { if (!flowShown(def, rec, b)) continue; for (const f of b.fields ?? []) if (f.req && f.kind !== "read" && !(rec.vals[f.id] ?? "").trim()) out.push(f.label); }
  return out;
}
/** Submit one section. Returns the new record, or the reason it cannot be submitted. */
export function submitSection(def: FlowDef, rec: FlowRecord, key: string, by: string, now: Date): { rec: FlowRecord } | { error: string } {
  const secs = flowSections(def), s = secs.find((x) => x.key === key);
  if (!s || !submittable(s)) return { error: "That section cannot be submitted." };
  const miss = missingRequired(def, rec, s);
  if (miss.length) return { error: `Fill in ${miss.join(", ")} first.` };
  const at = now.toISOString(), wasSubmitted = !!rec.sub[key];
  const next: FlowRecord = { ...rec, sub: { ...rec.sub, [key]: { at, by, hash: flowHash(sectionContent(def, rec, s)) } }, events: [...rec.events, { at, by, ev: wasSubmitted ? "reopened" : "section_submitted", section: key }] };
  if (wasSubmitted) next.events.push({ at, by, ev: "section_submitted", section: key });
  const done = secs.filter(submittable).every((x) => sectionState(def, next, x) === "submitted");
  if (done && next.status !== "complete") { next.status = "complete"; next.events.push({ at, by, ev: "completed" }); }
  else if (!done) next.status = "open";
  return { rec: next };
}

/* ---- the flow record note --------------------------------------------------------------------------------- */
const flYq = (s: string): string => JSON.stringify(s);
const flCell = (s: string): string => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
/** Firmware: the properties file the fields describe, each line marked when it differs from the starting value. */
export function firmwareYaml(def: FlowDef, rec: FlowRecord): Array<{ line: string; changed: boolean; was: string }> {
  const out: Array<{ line: string; changed: boolean; was: string }> = [];
  for (const f of allFields(def)) {
    if (!f.y) continue;
    const v = (rec.vals[f.id] ?? "").trim(), was = rec.base[f.id] ?? "";
    const fmt = (x: string): string => (f.ylist ? "[" + x.split(",").map((y) => y.trim()).filter(Boolean).join(", ") + "]" : x || '""');
    out.push({ line: `${f.y}: ${fmt(v)}`, changed: (rec.base[f.id] !== undefined ? v !== was : !!v), was });
  }
  return out;
}
/** Test plan: included cases grouped by setup. */
export function planGroups(rec: FlowRecord, b: FlowBlock): Array<{ group: string; items: string[] }> {
  const rows = (rec.rows[b.from ?? ""] ?? []).filter((r) => (r[b.include ?? "inc"] ?? "Yes") !== "No");
  const m = new Map<string, string[]>();
  for (const r of rows) { const g = (r[b.group ?? "setup"] ?? "").trim() || "No setup"; if (!m.has(g)) m.set(g, []); m.get(g)!.push((r[b.item ?? "test"] ?? "").trim() || "(unnamed test)"); }
  return [...m].map(([group, items]) => ({ group, items }));
}

/** The record note: YAML header, evidence of the submitted sections, then the state block. */
export function renderFlowNote(def: FlowDef, rec: FlowRecord): string {
  const secs = flowSections(def), sub = secs.filter((s) => submittable(s) && sectionState(def, rec, s) === "submitted");
  const first = rec.events.find((e) => e.ev === "section_submitted")?.at ?? "", done = [...rec.events].reverse().find((e) => e.ev === "completed")?.at ?? "";
  const fm = ["---", `mdseFlow: ${def.id}`, `flow: ${flYq(def.name)}`, `flowId: ${rec.flowId}`, `guid: ${rec.guid}`, `status: ${rec.status}`,
    `reason: ${flYq(rec.vals["rs.type"] ?? "")}`, `eco: ${flYq(rec.vals["rs.econo"] ?? "")}`, `pick: ${flYq(rec.pick ? "[[" + rec.pick.replace(/\.md$/i, "") + "]]" : "")}`,
    `author: ${rec.author}`, `started: ${first}`, `completed: ${rec.status === "complete" ? done : ""}`,
    `sectionsSubmitted: [${sub.map((s) => flYq(s.title)).join(", ")}]`, "---"];
  const body: string[] = [`# ${rec.flowId} ${def.name}${rec.pickTitle ? " — " + rec.pickTitle : ""}`, "",
    "Evidence of work written by the MDSE Workbench. Only submitted sections are listed. Edit the flow in the Workbench (Flow menu), not here: the block at the end is read back.", ""];
  for (const s of sub) {
    const at = rec.sub[s.key]!;
    body.push(`## ${s.title}`, "", `Submitted ${at.at} by ${at.by}.`, "");
    for (const b of s.blocks) {
      if (!flowShown(def, rec, b)) continue;
      const fields = (b.fields ?? []).map((f) => {
        const v = f.kind === "read" ? (f.dyn ? dynValue(f.dyn, null, rec, def) : f.v ?? "") : rec.vals[f.id] ?? "";
        const was = rec.base[f.id] !== undefined && rec.base[f.id] !== v ? ` (was: ${rec.base[f.id]})` : "";
        return f.kind === "read" && f.dyn && v === "—" ? null : `- **${f.label}:** ${v || "—"}${was}`;
      }).filter((x): x is string => !!x);
      if (fields.length) body.push(...fields, "");
      if (b.t === "table" && b.id && b.id !== "files") {
        const rows = rec.rows[b.id] ?? [], cols = b.cols ?? [];
        body.push(`**${b.title}**`, "");
        if (!rows.length) body.push("None.", "");
        else body.push("| " + cols.map((c) => flCell(c.label)).join(" | ") + " |", "|" + cols.map(() => " --- ").join("|") + "|", ...rows.map((r) => "| " + cols.map((c) => flCell(r[c.k] ?? "")).join(" | ") + " |"), "");
      }
      if (b.t === "yaml") body.push("```yaml", ...firmwareYaml(def, rec).map((l) => l.line + (l.changed ? `  # changed${l.was ? ", was " + l.was : ""}` : "")), "```", "");
      if (b.t === "canvas") for (const g of planGroups(rec, b)) body.push(`- **${g.group}:** ${g.items.join(", ")}`);
    }
  }
  const pending = secs.filter((s) => submittable(s) && sectionState(def, rec, s) !== "submitted");
  if (pending.length) body.push("## Not yet submitted", "", ...pending.map((s) => `- ${s.title}${sectionState(def, rec, s) === "stale" ? " (edited since submitted)" : ""}`), "");
  body.push("## Flow state", "", "```mdse-flow", JSON.stringify(rec, null, 1), "```", "");
  return fm.join("\n") + "\n\n" + body.join("\n");
}

/** Read a record note back. Null when the text is not a flow record. */
export function parseFlowNote(text: string): FlowRecord | null {
  const m = /```mdse-flow\r?\n([\s\S]*?)\r?\n```/.exec(text);
  if (!m) return null;
  try {
    const r = JSON.parse(m[1]!) as FlowRecord;
    if (r.schema !== 1 || !r.flowId || !r.flow || !flowDef(r.flow)) return null;
    return { ...r, vals: r.vals ?? {}, base: r.base ?? {}, rows: r.rows ?? {}, sub: r.sub ?? {}, events: r.events ?? [] };
  } catch { return null; }
}
/** Every flow record in the working tree, newest first. */
export function listFlows(files: Map<string, string>): Array<{ path: string; rec: FlowRecord }> {
  const out: Array<{ path: string; rec: FlowRecord }> = [];
  for (const [p, t] of files) if (p.startsWith(FLOWS_DIR + "/") && /\.md$/i.test(p)) { const r = parseFlowNote(t); if (r) out.push({ path: p, rec: r }); }
  return out.sort((a, b) => b.rec.created.localeCompare(a.rec.created));
}

/** The write that saves the record: refused if the note changed since it was read (applyPlan compares `before`). */
export function planSaveFlow(def: FlowDef, rec: FlowRecord, files: Map<string, string>): EditPlan {
  const path = flowPath(rec.flowId), before = files.get(path) ?? null, after = renderFlowNote(def, rec);
  if (before !== null) { const cur = parseFlowNote(before); if (cur && cur.guid !== rec.guid) return { summary: "", writes: [], problems: [`${path} belongs to another flow (${cur.guid}). Start the flow again to take the next number.`] }; }
  if (before === after) return { summary: "", writes: [], problems: ["Nothing changed since the last save."] };
  return { summary: `Save ${rec.flowId} (${def.name}) to ${path}.`, writes: [{ path, before, after }], problems: [] };
}
