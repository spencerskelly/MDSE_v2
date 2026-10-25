/* Draw-to-relate (D-0043). A line the person draws between two note cards on the canvas preview becomes a relationship
 * only through the same previewed, undoable plan the Edit lens uses (WKB-009). Pure functions: find the lines the person
 * drew, work out which relationship kinds the two notes allow, and tidy the scratch canvas afterwards. The Obsidian shell
 * (plugin.ts) shows the dropdown and applies the plan. A canvas line is a picture; it never becomes model meaning by itself. */
import type { CanvasDoc, CanvasEdge, CanvasNode } from "./canvas.ts";
import { cardNotePath } from "./canvas.ts";
import type { ModelIndex, Note } from "./index.ts";
import { ED_RELS, planAddRelationship, edUsageKinds } from "./edit.ts";
import type { EdRel, EditPlan } from "./edit.ts";

/** Ids of every line already in the doc (the ones the Workbench drew). Anything else that appears later was drawn by the person. */
export const cdEdgeIds = (doc: CanvasDoc): Set<string> => new Set(doc.edges.map((e) => e.id));

/** The note a card stands for: a file card, or a requirement card whose first line is the note's link. Group, "not in vault" and free text cards stand for none. */
export const cdNotePath = (node: CanvasNode | undefined): string | null => cardNotePath(node);

export interface DrawnLine { id: string; from: string | null; to: string | null; fromCard: string; toCard: string }
/** Lines in `doc` whose id is not in `known`, with the note at each end (null when that card is not a note). */
export function cdDrawnLines(doc: CanvasDoc, known: Set<string>): DrawnLine[] {
  const card = new Map(doc.nodes.map((n) => [n.id, n]));
  return doc.edges.filter((e) => !known.has(e.id)).map((e) => ({ id: e.id, fromCard: e.fromNode, toCard: e.toNode, from: cdNotePath(card.get(e.fromNode)), to: cdNotePath(card.get(e.toNode)) }));
}

export interface DrawChoice { rel: EdRel; /** the plan for the default form, to learn whether the kind can be written at all */ plan: EditPlan; ok: boolean; problem: string; /** the usage kind a "has …" relationship will write (part, port, item …) */ usageKind: string }
/** Every relationship kind the source allows toward the target, each tried once so the list holds only kinds that can be written now. */
export function cdChoices(ix: ModelIndex, files: Map<string, string>, from: string, to: string): DrawChoice[] {
  const a = ix.notes.get(from), b = ix.notes.get(to);
  if (!a || !b || from === to) return [];
  return ED_RELS.filter((r) => r.from(a) && r.to(b, a)).map((rel) => {
    const plan = planAddRelationship(ix, files, { rel: rel.id, from, to });
    return { rel, plan, ok: !plan.problems.length, problem: plan.problems[0] ?? "", usageKind: rel.id === "owns" ? edUsageKinds(b)[0] ?? "" : "" };
  });
}

/** Why a drawn line cannot become a relationship, or "" when at least one kind fits. */
export function cdWhyNot(ix: ModelIndex, files: Map<string, string>, from: string, to: string): string {
  const a = ix.notes.get(from), b = ix.notes.get(to);
  if (!a || !b) return "Both ends of the line must be notes in the vault.";
  if (from === to) return "A relationship needs two different notes.";
  const fwd = cdChoices(ix, files, from, to);
  if (fwd.some((c) => c.ok)) return "";
  if (fwd.length) return `Already written or not possible: ${fwd[0]!.problem}`;
  const what = (n: Note): string => `${n.type}${n.subtype ? "/" + n.subtype : ""}${n.def ? " (" + n.def.keyword + ")" : " (no SysML block)"}`;
  return `No relationship fits from ${what(a)} to ${what(b)}.`;
}

/** Kinds that fit only when the line points the other way (for example a part satisfies a requirement, never the reverse). The dropdown always offers the generic kinds, so a line drawn backwards is not refused; this tells the person. */
export function cdOtherWay(ix: ModelIndex, files: Map<string, string>, from: string, to: string): string[] {
  const here = new Set(cdChoices(ix, files, from, to).filter((c) => c.ok).map((c) => c.rel.id));
  return cdChoices(ix, files, to, from).filter((c) => c.ok && !here.has(c.rel.id)).map((c) => c.rel.label);
}

/** The canvas text without the line `id` (the person cancelled, or the line cannot be a relationship). null when it is not there. */
export function cdDropLine(text: string, id: string): string | null {
  let doc: CanvasDoc;
  try { doc = JSON.parse(text); } catch { return null; }
  if (!Array.isArray(doc.edges) || !doc.edges.some((e: CanvasEdge) => e.id === id)) return null;
  return JSON.stringify({ ...doc, edges: doc.edges.filter((e: CanvasEdge) => e.id !== id) }, null, 2);
}
/** The canvas text with the line `id` labelled as the relationship now written, so the picture matches the model. */
export function cdLabelLine(text: string, id: string, label: string): string | null {
  let doc: CanvasDoc;
  try { doc = JSON.parse(text); } catch { return null; }
  if (!Array.isArray(doc.edges) || !doc.edges.some((e: CanvasEdge) => e.id === id)) return null;
  return JSON.stringify({ ...doc, edges: doc.edges.map((e: CanvasEdge) => e.id === id ? { ...e, label: label.slice(0, 60) } : e) }, null, 2);
}
