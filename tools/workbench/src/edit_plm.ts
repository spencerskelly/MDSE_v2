/* Part fields and the links a Part or a document writes in YAML (D-0128): level, makeBuy, sourcing and businessLine
 * (MOD-178, BOM-061, MOD-188) and the `implements` and `describes` links (MOD-185, MOD-184). Every function here only
 * PLANS a change; the Edit lens shows the diff and applies it with an Undo like any other edit.
 * The stored inverses (`implementedBy`, `describedBy`) are not written here: one command writes them after a merge (MOD-186, not built). */
import type { ModelIndex, Note } from "./index.ts";
import type { EditPlan } from "./edit.ts";

/** The governed lists of governance/schemas/properties.json (D-0124). A test compares them with the file, so they cannot drift. */
export const PLM_LISTS: Record<string, string[]> = {
  level: ["product", "assembly", "part"],
  makeBuy: ["make", "buy", "other"],
  sourcing: ["designed", "standard hardware", "OTS"],
  businessLine: ["IPC", "GSE", "MHE", "BMID", "PD", "RV", "PT"],
};
export const PLM_FIELDS = ["level", "sourcing", "makeBuy", "businessLine"];
/** Fields only a Part has (a note with a part number); businessLine may also sit on an element a Part implements (MOD-188). */
const PART_ONLY = new Set(["level", "sourcing", "makeBuy"]);
const AFTER_KEYS = ["bomCategory", "bomRole", ...PLM_FIELDS];
export const plmIsPart = (n: Note): boolean => !!String(n.meta.partNumber ?? "").trim();
/** Notes that can carry `describes` (relationships.yaml: from Info, Artifact, Document). */
export const plmIsDocLike = (n: Note): boolean => n.type === "Info" || n.type === "Artifact" || n.type === "Document";

const yamlScalar = (v: string): string => (/^[\s'"]|[:#]\s|\s$|^[-?!&*|>%@`]|[,\[\]{}]/.test(v) ? JSON.stringify(v) : v);

/** Set, add or remove one front-matter key. `null` removes it. A key that is not there is added after the nearest earlier key of the part group, else at the end. Line endings are kept. */
export function plmSetYaml(text: string, key: string, value: string | null): string {
  const crlf = text.includes("\r\n"), t = text.replace(/\r\n/g, "\n");
  const m = /^---\n([\s\S]*?)\n---(\n|$)/.exec(t); if (!m) return text;
  const lines = m[1]!.split("\n"), at = lines.findIndex((l) => l.startsWith(key + ":"));
  const line = value === null ? null : value === "" ? `${key}:` : `${key}: ${value}`;
  if (at >= 0) { if (line === null) lines.splice(at, 1); else lines[at] = line; }
  else if (line !== null) {
    const earlier = AFTER_KEYS.slice(0, Math.max(AFTER_KEYS.indexOf(key), 0)), pos = lines.reduce((p, l, i) => (earlier.some((k) => l.startsWith(k + ":")) ? i : p), -1);
    lines.splice(pos >= 0 ? pos + 1 : lines.length, 0, line);
  }
  const out = `---\n${lines.join("\n")}\n---${m[2]}` + t.slice(m[0].length);
  return crlf ? out.replace(/\n/g, "\r\n") : out;
}

/** `[[file name|name]]` (MOD-170). */
export const plmLink = (n: Note): string => `[[${n.name}|${String(n.meta.name ?? n.title).replace(/[|\[\]\n]/g, " ").replace(/\s+/g, " ").trim() || n.name}]]`;
const linkList = (ns: Note[]): string => `[${ns.map((n) => JSON.stringify(plmLink(n))).join(", ")}]`;

/** The targets a link field of a note names now, as index notes (a dangling link is left out here and kept by the planner). */
export function plmTargets(ix: ModelIndex, n: Note, field: string): Note[] {
  const out: Note[] = [];
  for (const l of n.links) if (l.field === field) { const p = ix.byName.get(l.target.toLowerCase()); const t = p ? ix.notes.get(p) : undefined; if (t && !out.includes(t)) out.push(t); }
  return out;
}
/** Notes that name this note in `field` (for `implementedBy`, read from the forward links, never from a stored inverse). */
export function plmSources(ix: ModelIndex, n: Note, field: string): Note[] {
  const out: Note[] = [];
  for (const e of ix.inn.get(n.path) ?? []) if (e.kind === field && e.via === "yaml") { const s = ix.notes.get(e.from); if (s && !out.includes(s)) out.push(s); }
  return out;
}

export interface PartFields { level?: string; makeBuy?: string; sourcing?: string; businessLine?: string }
/** Set the part fields of one note. A value of "" removes the field. Values outside the governed lists are refused. */
export function planSetPartFields(ix: ModelIndex, files: Map<string, string>, path: string, vals: PartFields): EditPlan {
  const n = ix.notes.get(path), text = files.get(path), bad = (m: string): EditPlan => ({ summary: "", writes: [], problems: [m] });
  if (!n || text === undefined) return bad("That note is not in the vault.");
  let out = text; const said: string[] = [];
  for (const k of PLM_FIELDS) {
    const v = (vals as Record<string, string | undefined>)[k]; if (v === undefined) continue;
    if (PART_ONLY.has(k) && !plmIsPart(n)) return bad(`${k} belongs to a part (a note with a part number).`);
    if (v !== "" && !PLM_LISTS[k]!.includes(v)) return bad(`"${v}" is not a ${k} value. Allowed: ${PLM_LISTS[k]!.join(", ")}.`);
    const cur = String(n.meta[k] ?? ""); if (v === cur) continue;
    out = plmSetYaml(out, k, v === "" ? null : yamlScalar(v)); said.push(v === "" ? `remove ${k}` : `${k}: ${v}`);
  }
  if (out === text) return bad("Nothing changed.");
  return { summary: `${n.title}: ${said.join(", ")}.`, writes: [{ path, before: text, after: out }], problems: [] };
}

/** Set the targets of `implements` (on a part) or `describes` (on an Info, Artifact or Document note). An empty list removes the field. */
export function planSetLinks(ix: ModelIndex, files: Map<string, string>, path: string, field: "implements" | "describes", targetPaths: string[]): EditPlan {
  const n = ix.notes.get(path), text = files.get(path), bad = (m: string): EditPlan => ({ summary: "", writes: [], problems: [m] });
  if (!n || text === undefined) return bad("That note is not in the vault.");
  if (field === "implements" && !plmIsPart(n)) return bad("Only a part (a note with a part number) implements an element.");
  if (field === "describes" && !plmIsDocLike(n)) return bad("Only an Info, Artifact or Document note describes another note.");
  const ts: Note[] = [];
  for (const p of [...new Set(targetPaths)]) {
    const t = ix.notes.get(p); if (!t) return bad(`${p} is not in the vault.`);
    if (t.path === n.path) return bad("A note cannot link to itself.");
    if (field === "implements" && plmIsPart(t)) return bad(`${t.title} is a part. A part implements an MDSE element, not another part (MOD-185).`);
    ts.push(t);
  }
  ts.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const dangling = n.links.filter((l) => l.field === field && !ix.byName.has(l.target.toLowerCase()));
  if (dangling.length) return bad(`${field} holds ${dangling.length} link(s) that match no note (${dangling.map((d) => d.target).join(", ")}). Fix them in the note first so nothing is lost.`);
  const out = plmSetYaml(text, field, ts.length ? linkList(ts) : null);
  if (out === text) return bad("Nothing changed.");
  const was = plmTargets(ix, n, field).length;
  return { summary: `${n.title}: ${field} ${was} → ${ts.length} link(s). The stored inverse is written after the next merge (MOD-186).`, writes: [{ path, before: text, after: out }], problems: [] };
}

/** Notes that can be offered as a target. For `implements`: elements that are not parts. For `describes`: any note except itself. */
export function plmCandidates(ix: ModelIndex, from: Note, field: "implements" | "describes", query: string, limit = 50): Note[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean), out: Note[] = [];
  for (const n of ix.notes.values()) {
    if (n.path === from.path || n.meta.mergedInto || String(n.meta.status ?? "") === "Retired") continue;
    if (field === "implements" && (plmIsPart(n) || plmIsDocLike(n))) continue;
    if (words.length) { const hay = `${n.title} ${n.name} ${n.meta.description ?? ""} ${n.id} ${n.meta.partNumber ?? ""}`.toLowerCase(); if (!words.every((w) => hay.includes(w))) continue; }
    out.push(n); if (out.length >= limit) break;
  }
  return out;
}
