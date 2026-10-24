/* Who owns what inside a part note that came from a BOM (D-0052, D-0053). Shared by the importer (update scan) and the Workbench (merge),
 * because both must read the same boundary: the BOM's members and properties on one side, the model's on the other.
 * Areas: `facts` and `structure` are what a BOM can own; the other five are the model's. A merge picks an owner per area; the
 * choice is written on the note as `bomOwns` so that a later BOM update touches only the areas the BOM still owns. */
import { sha256Text } from "../../importer/src/sha256.ts";

export type AreaId = "facts" | "structure" | "properties" | "interfaces" | "behavior" | "requirements" | "relationships";
export type BomArea = "facts" | "structure";
export const BOM_AREAS: Array<{ id: AreaId; label: string; hint: string; bom: boolean }> = [
  { id: "facts", label: "Part facts", hint: "Description, manufacturer data, part number, revision, source, drawing location", bom: true },
  { id: "structure", label: "Structure", hint: "Assembly lines (part usages), drawing references, replaced part numbers", bom: true },
  { id: "properties", label: "Properties", hint: "Other attributes, constants, documentation", bom: false },
  { id: "interfaces", label: "Interfaces and connections", hint: "Ports, connect, bind, interfaces, flows, allocations", bom: false },
  { id: "behavior", label: "Behavior", hint: "States, actions, transitions, successions, use cases", bom: false },
  { id: "requirements", label: "Requirements", hint: "Satisfy, verify, requirement and constraint usages, derivation, refinement", bom: false },
  { id: "relationships", label: "Other relationships", hint: "Dependencies, specializations", bom: false },
];

/** The area of one SysML member, from its first line and its full text. Used by the merge to choose an owner per area. */
export function bomAreaOfMember(head: string, text: string = head): AreaId {
  const raw = head.trim(), tag = /^#(\w+)\s+/.exec(raw)?.[1], h = raw.replace(/^#\w+\s+/, "");
  if (/^attribute\s+(partNumber|revision|source|drawingLocation)\b/.test(h)) return "facts";
  if (tag === "derivation" || tag === "refinement") return "requirements";
  if (/^dependency\b/.test(h)) return /\/\/\s*supersedes\s*$/m.test(text.split("\n")[0]!) ? "structure" : "relationships";
  if (/^(?:ref\s+)?(?:part|item)\b/.test(h)) return "structure";
  if (/^(?:(?:in|out|inout|conjugated|ref)\s+)*(?:port|connect|bind|binding|interface|flow|message|connection|allocate|allocation)\b/.test(h)) return "interfaces";
  if (/^(?:state|exhibit|perform|action|transition|accept|send|assign|if|while|loop|fork|join|merge|decide|first|then|succession|entry|do|exit|use\s+case|include|calc|analysis|actor)\b/.test(h)) return "behavior";
  if (/^(?:satisfy|verify|requirement|constraint|assert|assume|require|subject|objective|concern|stakeholder|frame)\b/.test(h)) return "requirements";
  if (/^(?:specializes|subsets|redefines)\b/.test(h)) return "relationships";
  return "properties";
}

/* ---- members of a BOM part note ---- */
export interface SysmlMember { key: string; kind: "attr" | "usage" | "ref" | "dep" | "other"; /** written by the importer (by its shape) */ owned: boolean; area: AreaId; lines: string[] }
export interface SysmlParts { head: string[]; members: SysmlMember[]; tail: string[] }
const OWNED_ATTRS = new Set(["partNumber", "revision", "source", "drawingLocation"]);
export function bomAttrOf(lines: string[], k: string): string { const m = new RegExp(`attribute ${k} = (?:"((?:[^"\\\\]|\\\\.)*)"|([^;]+));`).exec(lines.join("\n")); return m ? (m[1] ?? m[2] ?? "").trim() : ""; }
/** Splits the SysML of a part note into the lines around the part definition's members and the members themselves; null when the members are not in a layout this can read. */
export function bomSplitSysml(sysml: string): SysmlParts | null {
  const lines = sysml.replace(/\n+$/, "").split("\n"), open = lines.findIndex((l) => /^ {4}part def \w+(?: :> [^{]+?)? \{$/.test(l));
  if (open < 0) return { head: lines, members: [], tail: [] };
  let close = -1; for (let i = lines.length - 1; i > open; i--) if (lines[i] === "    }") { close = i; break; }
  if (close < 0) return null;
  const members: SysmlMember[] = [], body = lines.slice(open + 1, close), seen = new Map<string, number>(); let other = 0;
  for (let i = 0; i < body.length; i++) {
    const first = body[i]!; if (first.trim() === "") continue;
    if (!/^ {8}\S/.test(first)) return null;
    const blk = [first]; let depth = (first.match(/\{/g) ?? []).length - (first.match(/\}/g) ?? []).length;
    if (/\/\*(?!.*\*\/)/.test(first)) return null;
    while (depth > 0) { if (++i >= body.length) return null; const l = body[i]!; blk.push(l); depth += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length; }
    if (depth < 0) return null;
    let key: string, kind: SysmlMember["kind"], owned = false;
    const am = /^ {8}attribute (\w+) /.exec(first), um = /^ {8}part (\w+) : (\S+)/.exec(first), rm = /^ {8}ref item (\w+) : (\S+);/.exec(first), dm = /^ {8}dependency from (\S+) to (\S+);(.*)$/.exec(first);
    if (am && OWNED_ATTRS.has(am[1]!)) { kind = "attr"; key = "attr:" + am[1]; owned = true; }
    else if (um && /attribute childRevision = /.test(blk.join("\n"))) { kind = "usage"; const line = bomAttrOf(blk, "line"); key = line ? "usage:" + line : "usage:~" + um[2]; owned = true; }
    else if (rm && /::D_/.test(rm[2]!)) { kind = "ref"; key = "ref:" + rm[2]; owned = true; }
    else if (dm && /\/\/ supersedes\s*$/.test(dm[3]!)) { kind = "dep"; key = "dep:" + dm[2]; owned = true; }
    else { kind = "other"; key = "other:" + other++; }
    if (owned) { const n = seen.get(key) ?? 0; seen.set(key, n + 1); if (n) key += "#" + n; }
    members.push({ key, kind, owned, area: bomAreaOfMember(first.trim(), blk.join("\n")), lines: blk });
  }
  return { head: lines.slice(0, open + 1), members, tail: lines.slice(close) };
}
const bomFence = (noteText: string): string => { const sec = noteText.replace(/\r\n?/g, "\n").split(/^## SysML v2\s*$/m)[1] ?? ""; return /```[^\n]*\n([\s\S]*?)\n```/.exec(sec)?.[1] ?? ""; };

/** The areas of this note that a BOM update may change: `bomOwns: [facts, structure]` in the frontmatter; no property means both. */
export function bomOwnsOf(noteText: string): Set<BomArea> {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(noteText.replace(/\r\n?/g, "\n"))?.[1] ?? "", m = /^bomOwns:\s*\[(.*)\]\s*$/m.exec(fm);
  if (!m) return new Set<BomArea>(["facts", "structure"]);
  const out = new Set<BomArea>(); for (const x of m[1]!.split(",").map((y) => y.trim().replace(/^["']|["']$/g, ""))) if (x === "facts" || x === "structure") out.add(x);
  return out;
}
/** BOM-031: the part of a note that a BOM update owns and may compare: of the areas in `bomOwns`, the `description`, `manufacturerN` and `mfgPnN` properties (facts) and the importer's own SysML members
 *  (all of a Document note's block). Prose, callouts, `status`, `tags`, specializations and every member the model added are not in it. 16 hex digits of the SHA-256. A later scan recomputes this
 *  from the note in the vault, merged or not. */
export function bomOwnedHash(noteText: string): string {
  const text = noteText.replace(/\r\n?/g, "\n"), fm = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "", owns = bomOwnsOf(text);
  const yaml = owns.has("facts") ? fm.split("\n").filter((l) => /^(description|manufacturer\d+|mfgPn\d+):/.test(l)) : [];
  const fence = bomFence(text).trim(), parts = fence ? bomSplitSysml(fence) : null;
  const owned = !parts ? (owns.size ? fence : "") : parts.members.length === 0 && parts.head.length === fence.split("\n").length ? (owns.size ? fence : "") : parts.members.filter((m) => m.owned && owns.has(m.area as BomArea)).map((m) => m.lines.join("\n")).join("\n");
  return sha256Text(`${yaml.join("\n")}\n--\n${owned}`).slice(0, 16);
}
