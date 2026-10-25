/* The Obsidian interface: a right-sidebar panel that follows the selected note, and a main-window table view. Both read the
 * one shared index the plugin builds; neither has its own file list (Obsidian's file explorer is the browser). Plain DOM;
 * every vault string goes in as text. The only writes are the two Review actions the host performs (D-0025). */
import { h, STYLE, csvCell, download } from "./ui.ts";
import type { Child } from "./ui.ts";
import type { EdgeRef, ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";
import * as V from "./views.ts";
import { MAX_PICK, relatedNotes, commonRelated } from "./canvas.ts";
import { editView, setEditRef, editRefresh, markEditStale, setEditMode, setMergeWith, EDIT_STYLE } from "./edit_ui.ts";
import type { EditHost } from "./edit_ui.ts";

export type NoteChange = { kind: "status"; value: string } | { kind: "removeFlag"; type: string; title: string; nth: number };
export interface PanelHost {
  openNote(path: string): void;
  /** Open the table for a lens in the main window. */
  openTable(lens: V.Lens): void;
  /** Open the canvas for a lens in the main window (a transient preview). */
  openCanvas(lens: V.Lens, spec: Partial<V.ViewSpec>): Promise<string>;
  /** Put the picked notes on a canvas preview (D-0078). */
  /** Put notes on the canvas preview beside the selected note's card (D-0082). */
  addToCanvas?(anchor: string, paths: string[]): Promise<string>;
  openPickCanvas?(paths: string[], label: string, relations: boolean, group: boolean, replace: boolean): Promise<string>;
  saveCanvas?(): Promise<string>;
  /** Review actions. Resolves to a message and a way back. */
  updateNote?(path: string, change: NoteChange): Promise<{ message: string; undo: () => Promise<string> }>;
  hasPreview?(): boolean;
  /** Editing (D-0030). Absent = the Edit lens is hidden. */
  edit?: EditHost;
  /** From a table in the main window: open this relationship in the panel's Edit lens. */
  editRelationship?(ref: EdgeRef): void;
}
export interface PanelApp {
  setIndex(ix: ModelIndex | null, loading?: string): void;
  select(path: string): void;
  /** The note cards chosen on a canvas, in the order chosen (D-0084). Two or more open the Common related lens; one is the same as select. */
  setCanvasSelection(paths: string[]): void;
  setLens(lens: V.Lens): void;
  /** Open the Edit lens on one relationship (from a table row or a canvas line). */
  editRelationship(ref: EdgeRef): void;
  lens(): V.Lens; selected(): string; destroy(): void;
}

const PANEL_STYLE = `
.mdw.mdp{display:block;height:100%;min-height:0;overflow:auto;padding:0 0 24px}.mdw.mdp header{display:block;padding:8px 10px}
.mdp .lenses{display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px;border-bottom:1px solid var(--line)}.mdp .lenses button{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);cursor:pointer}.mdp .lenses button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}.mdp .lenses select{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);cursor:pointer}.mdp .lenses select.cur{background:var(--acc);color:#fff;border-color:var(--acc)}.mdp .lenses select.cur option{color:var(--fg);background:var(--bg)}
.mdp .body{padding:8px 10px}.mdp h3{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);margin:14px 0 4px}
.mdp .acts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--line)}
.mdp table{font-size:12.5px}.mdp td,.mdp th{padding:3px 6px}.mdp .more{color:var(--mut);padding:4px 6px}
.mdp .chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.mdp .chips label{border:1px solid var(--line);border-radius:999px;padding:0 8px;font-size:12px;cursor:pointer}
.mdw.mdm{display:block;height:100%;overflow:auto}.mdm header{display:flex}.mdm .body{padding:10px 16px}.mdm table{font-size:13.5px}.mdm .cellist a{display:block}
.mdp .cellist a,.mdm .cellist a{display:block}.mdp .msg{padding:6px 10px;color:var(--mut);font-size:12px}
.mdw button.sm{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg);cursor:pointer}.mdw button.sm:hover{border-color:var(--acc)}.mdw button.pri{background:var(--acc);color:#fff;border-color:var(--acc)}
`;

export function mountPanel(root: HTMLElement, host: PanelHost, opt: { mode: "panel" | "main"; lens?: V.Lens } = { mode: "panel" }): PanelApp {
  const compact = opt.mode === "panel";
  const style = h("style"); style.textContent = STYLE + PANEL_STYLE + EDIT_STYLE;
  const wrap = h("div", { class: "mdw obs " + (compact ? "mdp" : "mdm") });
  root.replaceChildren(style, wrap);
  let ix: ModelIndex | null = null, sel = "", lens: V.Lens = opt.lens ?? "dashboard", loading = "Reading notes…", msg = "", undo: (() => Promise<string>) | null = null;
  let scope: "selected" | "all" = "selected", table: "notes" | "relationships" | "usages" = "relationships", text = "", spec: Partial<V.ViewSpec> = {}, revFilter = "", pinned = false;

  const note = (p: string | null | undefined): Note | undefined => (p ? ix?.notes.get(p) : undefined);
  const link = (p: string | null | undefined, label?: string, cls = ""): Node => {
    const n = note(p);
    if (!p || !n) return h("span", { class: cls || "mut" }, label ?? "(not in vault)");
    return h("a", { href: "#", class: "lnk", onclick: (e: Event) => { e.preventDefault(); host.openNote(p); } }, label ?? n.title);
  };
  const empty = (m: string): HTMLElement => h("div", { class: "empty", style: "padding:16px 0" }, m);
  const tag = (t: string): HTMLElement => h("span", { class: "tag" }, t);

  /* ---- generic table renderer ---- */
  const cellNode = (c: V.TableCell | undefined): Child => {
    if (c === undefined) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.length ? h("div", { class: "cellist" }, ...c.map((x) => link(x.path, x.text))) : "";
    if (c.action) { const ref = c.action; return host.edit || host.editRelationship ? h("button", { class: "sm", title: "Change, add properties to, or remove this relationship", onclick: () => (compact ? openEditor(ref) : host.editRelationship?.(ref)) }, c.text) : ""; }
    return c.path !== undefined ? link(c.path, c.text, c.cls) : h("span", { class: c.cls ?? "" }, c.text);
  };
  const cellText = (c: V.TableCell | undefined): string => (c === undefined ? "" : typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text).join("; ") : c.text);
  let tree: "full" | "direct" = "full", canvasSel: string[] = [], tickKey = "", tickCount: HTMLElement | null = null; const rowTicks = new Set<string>(); let  pickText = "", pickType = "", pickRel = true, pickGroup = true; const pickSel = new Set<string>();
  let editEl: HTMLElement | null = null, editSel = "";                                     // the Edit lens keeps its form while the index refreshes
  function openEditor(ref: EdgeRef): void { if (!host.edit) return; editEl = null; setEditRef(ref); lens = "edit"; msg = ""; undo = null; draw(); }
  const CAP = compact ? 25 : 1000;
  const secs = new Map<string, boolean>();                                                // open/closed state of each folding section, kept across redraws
  function sec(key: string, title: string, body: Child[], o: { count?: number | string; open?: boolean } = {}): HTMLElement {
    const k = lens + ":" + key, d = h("details", { class: "sec", open: secs.get(k) ?? o.open ?? true }, h("summary", {}, title, o.count !== undefined ? h("span", { class: "mut" }, ` (${o.count})`) : null), ...body);
    d.addEventListener("toggle", () => { secs.set(k, (d as HTMLDetailsElement).open); });
    return d;
  }
  /** The note a table row stands for: the first single cell with a note path, in column order (D-0085). */
  const rowNote = (t: V.TableData, r: Record<string, V.TableCell>): string | null => { for (const c of t.columns) { const v = r[c.key]; if (v && typeof v === "object" && !Array.isArray(v) && v.path && ix!.notes.has(v.path)) return v.path; } return null; };
  function tableView(t: V.TableData, ticks = false): HTMLElement {
    const cols = t.columns.filter((c) => !compact || !c.wide), box = h("div", {}), tickable = ticks && !!host.addToCanvas && t.rows.some((r) => rowNote(t, r));
    const wrapSec = (): HTMLElement => { const kids = [...box.childNodes]; return sec(t.id, t.title || "Table", kids as Child[], { count: t.rows.length }); };
    if (t.note) box.append(h("div", { class: "mut", style: "font-size:12px;margin-bottom:4px" }, t.note));
    if (!t.rows.length) { box.append(empty(t.empty)); return t.title ? wrapSec() : box; }
    const shown = t.rows.slice(0, CAP);
    const tick = (r: Record<string, V.TableCell>): HTMLElement => {
      const p = rowNote(t, r); if (!p) return h("td", {});
      return h("td", {}, h("input", { type: "checkbox", "aria-label": "Tick for the canvas", checked: rowTicks.has(p), onchange: (e: Event) => { if ((e.target as HTMLInputElement).checked) rowTicks.add(p); else rowTicks.delete(p); if (tickCount) tickCount.textContent = `${rowTicks.size} ticked`; } }));
    };
    box.append(h("table", {}, h("thead", {}, h("tr", {}, tickable ? h("th", { title: "Tick the notes to put on the canvas" }, "+") : null, ...cols.map((c) => h("th", {}, c.label)))), h("tbody", {}, ...shown.map((r) => h("tr", {}, tickable ? tick(r) : null, ...cols.map((c) => h("td", {}, cellNode(r[c.key]))))))));
    if (t.rows.length > shown.length) box.append(h("div", { class: "more" }, `… ${t.rows.length - shown.length} more. Open the table in the main window to see all ${t.rows.length}.`));
    if (!compact) box.append(h("button", { class: "sm", onclick: () => download(`${t.id}.csv`, [t.columns.filter((c) => c.label).map((c) => csvCell(c.label)).join(","), ...t.rows.map((r) => t.columns.filter((c) => c.label).map((c) => csvCell(cellText(r[c.key]))).join(","))].join("\n")) }, "Export CSV"));
    return t.title ? wrapSec() : box;
  }

  /* D-0085: on the Structure, Function, States, Requirements, Design types and Internal structure views, put some or all of the notes shown on the canvas. */
  const ADDABLE = new Set<V.Lens>(["structure", "functional", "states", "requirements", "design", "internal"]);
  function addBar(ts: V.TableData[]): HTMLElement | null {
    if (!host.addToCanvas) return null;
    const shown = [...new Set(ts.flatMap((t) => t.rows.map((r) => rowNote(t, r))).filter((p): p is string => !!p))].slice(0, MAX_PICK);
    if (!shown.length) return null;
    const root = sel && ix!.notes.has(sel) ? sel : "", anchor = root || shown[0]!;
    const run = (b: HTMLElement, paths: string[]): void => { if (!paths.length) { msg = "Tick at least one row first."; draw(); return; } busy(b, "Adding…", () => host.addToCanvas!(anchor, paths)); };
    const some = h("button", { class: "sm pri", title: "Put the ticked notes on the canvas preview, placed by how they relate: parts under the assembly, specializations under the general element, requirements under use cases, functions and test cases under requirements, objects under functions" }, "Add ticked to canvas");
    some.addEventListener("click", () => run(some, [...rowTicks].filter((p) => ix!.notes.has(p))));
    const every = h("button", { class: "sm", title: "Put every note listed in the tables below on the canvas preview" }, `Add all ${shown.length + (root && !shown.includes(root) ? 1 : 0)} shown to canvas`);
    every.addEventListener("click", () => run(every, root && !shown.includes(root) ? [root, ...shown] : shown));
    tickCount = h("span", { class: "mut" }, `${rowTicks.size} ticked`);
    return h("div", { class: "chips", style: "display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0" }, some, every, h("button", { class: "sm", onclick: () => { rowTicks.clear(); draw(); } }, "Clear ticks"), tickCount);
  }

  /** D-0086: the Merge tab of the Edit lens, from the Note menu, from a note, or with two notes chosen on the canvas. */
  function openMerge(other: string): void { if (!host.edit) return; setEditMode("merge"); setMergeWith(other); editEl = null; lens = "edit"; draw(); }

  /* ---- lenses ---- */
  function dashboardView(): HTMLElement {
    const d = V.dashboard(ix!), pct = (a: number, b: number): string => (b ? Math.round((100 * a) / b) + "%" : "n/a");
    const card = (k: string, v: string, sub = ""): HTMLElement => h("div", { class: "card" }, h("b", {}, v), h("span", { class: "mut" }, k), sub ? h("div", { class: "mut", style: "font-size:11px" }, sub) : null);
    const bars = (title: string, rows: Array<[string, number]>): HTMLElement => { const max = Math.max(1, ...rows.map((r) => r[1])); return h("div", {}, h("h3", {}, title), ...rows.slice(0, compact ? 8 : 20).map(([k, n]) => h("div", { style: "display:grid;grid-template-columns:minmax(80px,1fr) 2fr 36px;gap:6px;align-items:center;font-size:12.5px" }, h("span", {}, k), h("div", { class: "bar" }, h("i", { style: `width:${(100 * n) / max}%` })), h("span", { style: "text-align:right" }, String(n))))); };
    return h("div", {}, h("div", { class: "cards" }, card("notes", String(d.notes), `${d.blocks} with SysML`), card("requirements satisfied", pct(d.requirements.satisfied, d.requirements.total), `${d.requirements.satisfied} of ${d.requirements.total}`), card("requirements verified", pct(d.requirements.verified, d.requirements.total), `${d.requirements.verified} of ${d.requirements.total}`),
      card("unresolved references", String(d.dangling)), card("unconnected notes", String(d.orphans)), card("SysML warnings", String(d.warnings), d.parser === "passed" ? "parser checked" : d.parser === "failed" ? "parser check failed" : "not parser-checked")),
      bars("Notes by type", d.byType), bars("Status", d.byStatus), bars("Flags", d.flags), bars("Relationship kinds", d.edgeKinds));
  }
  function noteView(): HTMLElement {
    const n = note(sel); if (!n) return empty("Open a model note in Obsidian.");
    const box = h("div", {});
    box.append(h("div", {}, tag(n.type + (n.subtype ? "/" + n.subtype : "")), tag(n.id), tag(n.status || "no status"), h("button", { class: "sm", style: "margin-left:8px", onclick: () => host.openNote(n.path) }, "Open note"), host.edit && n.type === "Object" ? h("button", { class: "sm", style: "margin-left:4px", title: "Merge this part with another note, for example a BOM part with the model element it is", onclick: () => openMerge("") }, "Merge with another note…") : null));
    for (const f of n.flags) box.append(h("div", { class: "callout " + f.type }, h("b", {}, f.type.replace("flag", "") + ": " + f.title), f.detail ? h("div", {}, f.detail) : null));
    if (n.def?.doc) box.append(h("div", { class: "reqtext", style: "white-space:pre-wrap;margin:8px 0;padding:6px 10px;border-left:3px solid var(--text-accent,#b25e00)" }, n.def.doc));
    const rel = (edges: ReturnType<typeof outgoing>, dir: "out" | "in"): HTMLElement => {
      const by = new Map<string, typeof edges>(); for (const e of edges) (by.get(e.kind) ?? by.set(e.kind, []).get(e.kind)!).push(e);
      if (!by.size) return h("div", { class: "mut" }, "None.");
      return h("div", {}, ...[...by].map(([k, list]) => h("div", { style: "margin:2px 0" }, h("span", { class: "tag k" }, k), " ", ...list.flatMap((e, i) => { const other = dir === "out" ? e.to : e.reverse ? null : e.from; return [i ? ", " : "", e.reverse && dir === "out" ? h("span", { class: "gap" }, "← " + e.toSymbol + " (not in vault)") : other ? link(other) : h("span", { class: "gap" }, e.toSymbol + " (not in vault)"), e.label ? h("span", { class: "mut" }, " " + e.label) : null]; }))));
    };
    box.append(sec("rel-out", "Relates to", [rel(outgoing(ix!, n.path), "out")], { count: outgoing(ix!, n.path).length }), sec("rel-in", "Related from", [rel(incoming(ix!, n.path), "in")], { count: incoming(ix!, n.path).length }));
    const rn = relatedNotes(ix!, n.path);
    if (host.addToCanvas && rn.length) {       // D-0082
      const all = h("button", { class: "sm pri", title: "Put every related note on the canvas preview, beside this note's card" }, `Add all ${rn.length} related to canvas`);
      all.addEventListener("click", () => busy(all, "Adding…", () => host.addToCanvas!(n.path, rn.map((r) => r.path))));
      box.append(sec("rel-add", "Add related notes to the canvas", [h("div", { class: "row" }, all), ...rn.map((r) => { const b = h("button", { class: "sm", title: "Add this note to the canvas preview" }, "+"); b.addEventListener("click", () => busy(b, "…", () => host.addToCanvas!(n.path, [r.path]))); return h("div", { style: "margin:2px 0" }, b, " ", link(r.path), " ", h("span", { class: "mut" }, r.kinds.join(", "))); })], { count: rn.length, open: false }));
    }
    if (n.def?.usages.length) box.append(sec("usages", "Usages", [tableView({ id: "usages", title: "", columns: [{ key: "kind", label: "Kind" }, { key: "name", label: "Name" }, { key: "type", label: "Type" }], rows: n.def.usages.map((u) => ({ kind: (u.dir ? u.dir + " " : "") + u.kind, name: u.name + (u.mult ?? ""), type: u.type ? { text: ix!.bySymbol.has(u.type) ? note(ix!.bySymbol.get(u.type))!.title : u.type + " (not in vault)", path: ix!.bySymbol.get(u.type) ?? null } : { text: "untyped", cls: "gap" } })), empty: "" })], { count: n.def.usages.length }));
    return box;
  }
  const chip = (label: string, on: boolean, fn: (v: boolean) => void): HTMLElement => h("label", {}, h("input", { type: "checkbox", checked: on, onchange: (e: Event) => { fn((e.target as HTMLInputElement).checked); draw(); } }), " " + label);
  function scopeBar(): HTMLElement | null {
    if (lens === "structure") return h("div", { class: "chips" }, h("select", { "aria-label": "How much of the structure", title: "The whole tree of parts below this note, or only the parts it owns directly", onchange: (e: Event) => { tree = (e.target as HTMLSelectElement).value as typeof tree; draw(); } }, h("option", { value: "full", selected: tree === "full" }, "Full tree"), h("option", { value: "direct", selected: tree === "direct" }, "Direct parts only")));
    if (lens !== "functional" && lens !== "requirements" && lens !== "tables") return null;
    return h("div", { class: "chips" }, h("label", {}, h("input", { type: "radio", name: "scope-" + opt.mode, checked: scope === "selected", onchange: () => { scope = "selected"; draw(); } }), " around the selected note"), h("label", {}, h("input", { type: "radio", name: "scope-" + opt.mode, checked: scope === "all", onchange: () => { scope = "all"; draw(); } }), " everything in the vault"),
      lens === "tables" ? h("select", { "aria-label": "Table", onchange: (e: Event) => { table = (e.target as HTMLSelectElement).value as typeof table; draw(); } }, ...([["relationships", "Relationships"], ["usages", "Usages"], ["notes", "All notes"]] as const).map(([v, l]) => h("option", { value: v, selected: v === table }, l))) : null,
      lens === "tables" ? h("input", { type: "search", placeholder: "filter", value: text, style: "width:110px", onchange: (e: Event) => { text = (e.target as HTMLInputElement).value; draw(); } }) : null);
  }
  function reviewView(): HTMLElement {
    const items = V.reviewQueue(ix!), cats = new Map<string, number>(); for (const i of items) cats.set(i.category, (cats.get(i.category) ?? 0) + 1);
    const box = h("div", {});
    if (ix!.parser !== "passed") box.append(h("div", { class: "callout" }, h("b", {}, "SysML blocks are not parser-checked"), ix!.parser === "failed" ? "The last parser check failed." : "No parser report was found."));
    box.append(h("div", { class: "chips" }, h("label", {}, h("input", { type: "radio", name: "rv-" + opt.mode, checked: !revFilter, onchange: () => { revFilter = ""; draw(); } }), ` all ${items.length}`), ...[...cats].map(([k, n]) => h("label", {}, h("input", { type: "radio", name: "rv-" + opt.mode, checked: revFilter === k, onchange: () => { revFilter = k; draw(); } }), ` ${k} ${n}`))));
    const rows = items.filter((i) => !revFilter || i.category === revFilter), shown = rows.slice(0, compact ? 40 : 1500);
    if (!rows.length) { box.append(empty("Nothing to review.")); return box; }
    const choices = V.statusChoices(ix!);
    const act = (i: V.ReviewItem): Child => {
      if (i.flag && host.updateNote) return h("button", { class: "sm", title: "Remove this flag from the note (an engineer's decision)", onclick: () => run(i.path, { kind: "removeFlag", ...i.flag! }) }, "Resolve");
      if (i.category === "issue" && host.updateNote) return h("select", { "aria-label": "Issue status", onchange: (e: Event) => run(i.path, { kind: "status", value: (e.target as HTMLSelectElement).value }) }, ...[...new Set([i.status ?? "", ...choices])].filter(Boolean).map((s) => h("option", { value: s, selected: s === i.status }, s)));
      return "";
    };
    box.append(h("table", {}, h("thead", {}, h("tr", {}, compact ? null : h("th", {}, "Severity"), h("th", {}, "Category"), h("th", {}, "Note"), h("th", {}, "Detail"), h("th", {}, ""))),
      h("tbody", {}, ...shown.map((i) => h("tr", {}, compact ? null : h("td", { class: i.severity === "high" ? "gap" : "" }, i.severity), h("td", {}, i.category), h("td", {}, i.path ? link(i.path) : ""), h("td", {}, i.category === "issue" ? "" : i.message), h("td", {}, act(i)))))));
    if (rows.length > shown.length) box.append(h("div", { class: "more" }, `… ${rows.length - shown.length} more. Open the table in the main window.`));
    return box;
  }
  async function run(path: string, change: NoteChange): Promise<void> {
    if (!host.updateNote) return;
    if (change.kind === "removeFlag" && typeof confirm === "function" && !confirm(`Resolve this flag and remove it from the note?\n\n${change.title}`)) return;
    try { const r = await host.updateNote(path, change); msg = r.message; undo = r.undo; } catch (e) { msg = "Update failed: " + String((e as Error)?.message ?? e); undo = null; }
    draw();
  }

  /* D-0078: search a word or phrase in name or description, tick notes, place them on a canvas. */
  function pickView(): HTMLElement {
    const types = [...new Set([...ix!.notes.values()].map((n) => n.type))].sort(), found = V.pickRows(ix!, pickText, pickType), notes = found.notes;
    const count = h("span", { class: "mut" }), boxes = new Map<string, HTMLInputElement>();
    const upd = (): void => { count.textContent = `${pickSel.size} ticked${pickSel.size > MAX_PICK ? ` (a canvas takes the first ${MAX_PICK})` : ""}`; };
    const tickAll = (on: boolean): void => { for (const n of notes) { if (on) pickSel.add(n.path); else pickSel.delete(n.path); const b = boxes.get(n.path); if (b) b.checked = on; } upd(); };
    const place = h("button", { class: "sm pri", title: "Add the ticked notes to the canvas preview that is open; nothing already on it moves, and related notes are put next to each other. With none open this makes one. Nothing is saved until you choose Save canvas." }, "Place on canvas");
    place.addEventListener("click", () => { if (!pickSel.size) { msg = "Tick at least one note first."; draw(); return; } busy(place, "Placing…", () => host.openPickCanvas!([...pickSel], pickText, pickRel, pickGroup, false)); });
    const fresh = h("button", { class: "sm", title: "Replace the canvas preview with a new one made of the ticked notes (boxed by type when that is ticked)" }, "New canvas");
    fresh.addEventListener("click", () => { if (!pickSel.size) { msg = "Tick at least one note first."; draw(); return; } busy(fresh, "Creating…", () => host.openPickCanvas!([...pickSel], pickText, pickRel, pickGroup, true)); });
    const bar = h("div", { class: "chips", style: "display:flex;align-items:center;gap:6px;flex-wrap:wrap" },
      h("button", { class: "sm", onclick: () => tickAll(true) }, "Tick all listed"), h("button", { class: "sm", onclick: () => tickAll(false) }, "Untick listed"),
      h("button", { class: "sm", onclick: () => { pickSel.clear(); for (const b of boxes.values()) b.checked = false; upd(); } }, "Clear all"),
      h("label", { title: "Draw the relationships that run between the ticked notes" }, h("input", { type: "checkbox", checked: pickRel, onchange: (e: Event) => { pickRel = (e.target as HTMLInputElement).checked; } }), " draw relationships"),
      h("label", { title: "Put the notes in one labelled box for each type, so a long list is easy to move around. Applies to a new canvas." }, h("input", { type: "checkbox", checked: pickGroup, onchange: (e: Event) => { pickGroup = (e.target as HTMLInputElement).checked; } }), " group by type"), count,
      host.openPickCanvas ? place : h("span", { class: "mut" }, "Canvas needs Obsidian."), host.openPickCanvas ? fresh : null);
    if (host.saveCanvas && host.hasPreview?.()) { const b = h("button", { class: "sm" }, "Save canvas…"); b.addEventListener("click", () => busy(b, "Saving…", () => host.saveCanvas!())); bar.append(b); }
    upd();
    const list = h("div", {}, ...notes.map((n) => {
      const b = h("input", { type: "checkbox", "aria-label": "Tick " + n.title, checked: pickSel.has(n.path), onchange: (e: Event) => { if ((e.target as HTMLInputElement).checked) pickSel.add(n.path); else pickSel.delete(n.path); upd(); } }) as HTMLInputElement;
      boxes.set(n.path, b);
      const d = String(n.meta.description ?? "");
      return h("label", { style: "display:flex;gap:6px;align-items:flex-start;margin:3px 0" }, b, h("span", {}, h("a", { href: "#", onclick: (e: Event) => { e.preventDefault(); host.openNote(n.path); } }, String(n.meta.name ?? "") || n.title), " ", tag(n.type + (n.subtype ? "/" + n.subtype : "")), " ", h("span", { class: "mut" }, n.id), d ? h("div", { class: "mut", style: "font-size:12px" }, d.length > 140 ? d.slice(0, 140) + " …" : d) : null));
    }));
    return h("div", {},
      h("div", { class: "mut" }, "Words are matched in the name, description, id, part number and aliases. Every word must be there."),
      h("div", { class: "chips", style: "display:flex;gap:6px;margin:6px 0" },
        h("input", { type: "search", placeholder: "Word or phrase", value: pickText, "aria-label": "Search for notes to place on a canvas", style: "flex:1", onchange: (e: Event) => { pickText = (e.target as HTMLInputElement).value; draw(); } }),
        h("select", { "aria-label": "Type", onchange: (e: Event) => { pickType = (e.target as HTMLSelectElement).value; draw(); } }, h("option", { value: "" }, "all types"), ...types.map((t) => h("option", { value: t, selected: pickType === t }, t)))),
      h("div", { class: "mut" }, `${found.total} match${found.total === 1 ? "" : "es"}${found.total > notes.length ? ` (first ${notes.length} listed; narrow the search for the rest)` : ""}`), bar, list);
  }

  /* D-0084: the notes related to every note chosen on the canvas. */
  function commonView(): HTMLElement {
    const given = canvasSel.filter((p) => ix!.notes.has(p));
    if (given.length < 2) return empty("Choose two or more note cards on the canvas (hold Shift to add to a choice) and the notes related to all of them are listed here.");
    const c = commonRelated(ix!, given), kindsOf = (by: Array<{ from: string; kinds: string[] }>): string => by.map((b) => `${note(b.from)!.title}: ${b.kinds.join(", ")}`).join(" · ");
    const addBtn = (label: string, paths: string[], cls = "sm"): HTMLElement => { const b = h("button", { class: cls, title: "Put on the canvas preview, between the chosen cards when they are there" }, label); b.addEventListener("click", () => busy(b, "Adding…", () => host.addToCanvas!(given[0]!, paths))); return b; };
    const row = (r: { path: string; by: Array<{ from: string; kinds: string[] }> }): HTMLElement => h("div", { style: "margin:3px 0" }, host.addToCanvas ? addBtn("+", [r.path]) : null, " ", link(r.path), " ", tag(note(r.path)!.type), h("div", { class: "mut", style: "font-size:12px;margin-left:26px" }, kindsOf(r.by)));
    const mergeBtn = host.edit && given.length === 2 && given.every((p) => note(p)!.type === "Object") ? h("button", { class: "sm", title: "Mark these two notes as the same part and merge them. When one is a BOM part, it is the one that stays.", onclick: () => { sel = given[0]!; openMerge(given[1]!); } }, "Merge these two…") : null;
    const box = h("div", {}, h("div", { class: "mut" }, "Chosen on the canvas"), mergeBtn ? h("div", { class: "row" }, mergeBtn) : null, h("div", {}, ...given.flatMap((p, i) => [i ? ", " : "", link(p)])));
    box.append(sec("com-all", `Related to all ${given.length}`, c.all.length ? [host.addToCanvas ? h("div", { class: "row" }, addBtn(`Add all ${c.all.length} to canvas`, c.all.map((r) => r.path), "sm pri")) : null, ...c.all.map(row)] : [h("div", { class: "mut" }, "No note is related to all of them.")], { count: c.all.length }));
    if (given.length > 2 || !c.all.length) box.append(sec("com-some", "Related to at least two", c.some.length ? [host.addToCanvas ? h("div", { class: "row" }, addBtn(`Add all ${c.some.length} to canvas`, c.some.map((r) => r.path))) : null, ...c.some.slice(0, 200).map((r) => h("div", { style: "margin:3px 0" }, host.addToCanvas ? addBtn("+", [r.path]) : null, " ", link(r.path), " ", tag(note(r.path)!.type), h("span", { class: "mut" }, ` ${r.count} of ${given.length}`), h("div", { class: "mut", style: "font-size:12px;margin-left:26px" }, kindsOf(r.by))))] : [h("div", { class: "mut" }, "None.")], { count: c.some.length, open: given.length > 2 }));
    return box;
  }

  /* ---- canvas settings (compact) ---- */
  function canvasSettings(): HTMLElement {
    const prof = V.PROFILES.find((p) => p.name === V.LENS_PROFILE[lens])!, sp: V.ViewSpec = { ...V.defaultSpec(prof), ...spec };
    const set = (patch: Partial<V.ViewSpec>): void => { spec = { ...spec, ...patch }; draw(); };
    const types = new Map<string, number>(); for (const n of ix!.notes.values()) types.set(n.type, (types.get(n.type) ?? 0) + 1);
    const kinds = V.edgeKinds(ix!), flip = (l: string[], v: string, on: boolean): string[] => (on ? l.filter((x) => x !== v) : l.includes(v) ? l : [...l, v]);
    return h("details", { class: "vsbox" }, h("summary", {}, "Canvas settings"),
      h("div", { class: "chips" }, h("label", {}, "connections away ", h("input", { type: "number", min: 1, max: 8, value: sp.depth, style: "width:48px", onchange: (e: Event) => set({ depth: Math.max(1, +(e.target as HTMLInputElement).value || prof.depth) }) })), h("label", {}, "max notes ", h("input", { type: "number", min: 5, max: 500, value: sp.cap, style: "width:56px", onchange: (e: Event) => set({ cap: Math.max(5, +(e.target as HTMLInputElement).value || prof.cap) }) })),
        h("button", { class: "sm", onclick: () => { spec = {}; draw(); } }, "Reset")),
      h("div", { class: "mut" }, "Note types shown"), h("div", { class: "chips" }, ...[...types].sort().map(([k, n]) => chip(`${k} ${n}`, !sp.hideTypes.includes(k), (on) => { spec = { ...spec, hideTypes: flip(sp.hideTypes, k, on) }; }))),
      h("div", { class: "mut" }, `Relationships followed (none ticked = the ${prof.name} profile's own)`), h("div", { class: "chips" }, ...kinds.map(([k, n]) => chip(`${k} ${n}`, sp.kinds.includes(k), (on) => { spec = { ...spec, kinds: on ? [...sp.kinds, k] : sp.kinds.filter((x) => x !== k) }; }))),
      h("div", { class: "chips" }, h("span", { class: "mut" }, "Group similar notes by"), h("select", { "aria-label": "Classifier", onchange: (e: Event) => set({ collapse: (e.target as HTMLSelectElement).value as V.Classifier }) }, ...V.CLASSIFIERS.map(([v, l]) => h("option", { value: v, selected: v === sp.collapse }, l))), h("label", {}, "when more than ", h("input", { type: "number", min: 1, max: 50, value: sp.collapseOver, style: "width:44px", onchange: (e: Event) => set({ collapseOver: Math.max(1, +(e.target as HTMLInputElement).value || 6) }) }))),
      h("label", { class: "mut" }, h("input", { type: "checkbox", checked: sp.ghosts, onchange: (e: Event) => { spec = { ...spec, ghosts: (e.target as HTMLInputElement).checked }; } }), " show references to notes not in the vault"));
  }

  /* ---- shell ---- */
  const busy = (btn: HTMLElement, label: string, job: () => Promise<string>): void => { btn.setAttribute("disabled", ""); btn.textContent = label; job().then((m) => { msg = m; undo = null; }, (e) => { msg = "Failed: " + String((e as Error)?.message ?? e); }).finally(() => draw()); };
  function draw(): void {
    const n = note(sel);
    const header = h("header", {}, n ? h("div", {}, h("b", {}, n.title), " ", tag(n.type + (n.subtype ? "/" + n.subtype : "")), " ", h("span", { class: "mut" }, n.id)) : h("div", { class: "mut" }, ix ? "No model note selected. Open a note in Obsidian and this view follows it." : loading),
      ix ? h("div", { class: "mut", style: "font-size:12px" }, `${ix.notes.size} notes · ${ix.edges.length} links · ` + (ix.parser === "passed" ? "SysML checked" : ix.parser === "failed" ? "SysML check failed" : "SysML not parser-checked")) : null,
      !compact ? h("label", { class: "mut", style: "margin-left:auto" }, h("input", { type: "checkbox", checked: !pinned, onchange: (e: Event) => { pinned = !(e.target as HTMLInputElement).checked; draw(); } }), " follow the selected note") : null);
    const lenses = h("div", { class: "lenses" }, ...V.LENS_GROUPS.map((g) => {                       // D-0084: three menus
      const items = g.lenses.filter((k) => (k !== "edit" && k !== "merge") || !!host.edit).map((k) => [k, V.LENSES.find(([x]) => x === k)![1]] as const), here = g.lenses.includes(lens);
      return h("select", { "aria-label": `${g.label} menu`, title: g.id === "note" ? "Ways to see the selected note" : g.id === "model" ? "Ways to see the whole model" : "Tools for the canvas", class: here ? "cur" : "", onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value as V.Lens; if (!v) return; if (v === "merge") openMerge(""); else { lens = v; if (v !== "edit") editEl = null; draw(); } } },
        h("option", { value: "", selected: !here }, `${g.label} ▾`), ...items.map(([k, label]) => h("option", { value: k, selected: lens === k }, label)));
    }));
    const acts = h("div", { class: "acts" });
    if (compact && ix) {
      // A direct, all-relationships canvas launcher on the Workbench home screen.
      // "tables" deliberately selects the Everything profile: all relationship kinds,
      // incoming and outgoing, rather than the current lens's restricted trace.
      const allProfile = V.PROFILES.find((p) => p.name === "Everything")!;
      const allDepth = Math.max(1, Math.min(8, Number(spec.depth ?? allProfile.depth) || allProfile.depth));
      const allControls = h("div", { class: "chips", style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" },
        h("label", {}, "Connections away ", h("input", {
          type: "number", min: 1, max: 8, value: allDepth, "aria-label": "All connections canvas depth",
          style: "width:54px", onchange: (e: Event) => {
            spec = { ...spec, depth: Math.max(1, Math.min(8, Number((e.target as HTMLInputElement).value) || allProfile.depth)) };
            draw();
          }
        })),
        h("button", { class: "sm pri", disabled: !n || undefined, onclick: (e: Event) => {
          const b = e.currentTarget as HTMLElement;
          busy(b, "Creating…", () => host.openCanvas("tables", {
            ...spec, depth: Math.max(1, Math.min(8, Number(spec.depth ?? allProfile.depth) || allProfile.depth)),
            kinds: [] // Empty = all kinds in the Everything profile.
          }));
        } }, "All connections canvas"));
      acts.append(allControls);
      if (V.lensHasTable(lens)) { const b = h("button", { class: "sm pri", onclick: () => host.openTable(lens) }, "Table in main window"); acts.append(b); }
      if (V.lensHasCanvas(lens)) { const b = h("button", { class: "sm pri", disabled: !n || undefined }, "Canvas in main window"); b.addEventListener("click", () => busy(b, "Creating…", () => host.openCanvas(lens, spec))); acts.append(b); }
      if (host.saveCanvas && host.hasPreview?.() && V.lensHasCanvas(lens)) { const b = h("button", { class: "sm" }, "Save canvas…"); b.addEventListener("click", () => busy(b, "Saving…", () => host.saveCanvas!())); acts.append(b); }
    }
    const status = msg ? h("div", { class: "msg" }, msg, undo ? h("button", { class: "sm", style: "margin-left:8px", onclick: async () => { const u = undo!; undo = null; try { msg = await u(); markEditStale(); } catch (e) { msg = "Undo failed: " + String((e as Error)?.message ?? e); } draw(); } }, "Undo") : null) : null;
    const body = h("div", { class: "body" });
    if (!ix) body.append(empty(loading));
    else try {
      if (compact && V.lensHasCanvas(lens) && n) body.append(canvasSettings());
      const bar = scopeBar(); if (bar) body.append(bar);
      if (lens !== "dashboard" && lens !== "edit") body.append(h("div", { class: "secbar", style: "display:flex;gap:6px;justify-content:flex-end" }, h("button", { class: "sm", onclick: () => wrap.querySelectorAll("details.sec").forEach((d) => { (d as HTMLDetailsElement).open = false; }) }, "Collapse all"), h("button", { class: "sm", onclick: () => wrap.querySelectorAll("details.sec").forEach((d) => { (d as HTMLDetailsElement).open = true; }) }, "Expand all")));
      if (lens === "dashboard") body.append(dashboardView());
      else if (lens === "note") body.append(noteView());
      else if (lens === "review") body.append(reviewView());
      else if (lens === "pick") body.append(pickView());
      else if (lens === "common") body.append(commonView());
      else if (lens === "edit" && host.edit) { if (!editEl || editSel !== sel) { editSel = sel; editEl = editView({ getIx: () => ix!, getSel: () => sel, host: host.edit, done: (m, u) => { msg = m; undo = u; editEl = null; draw(); }, open: (p) => host.openNote(p) }); } body.append(editEl); }
      else {
        const key = lens + "|" + sel; if (key !== tickKey) { rowTicks.clear(); tickKey = key; }
        const ts = V.lensTables(ix, lens, sel, { scope, table, text, tree }), canAdd = ADDABLE.has(lens), ab = canAdd ? addBar(ts) : null;
        if (ab) body.append(ab); else tickCount = null;
        for (const t of ts) body.append(tableView(t, canAdd));
      }
    } catch (e) { body.append(h("div", { class: "callout flagConflict" }, h("b", {}, "This view failed to draw"), String((e as Error)?.message ?? e))); console.error(e); }
    wrap.replaceChildren(header, lenses, ...(compact ? [acts] : []), ...(status ? [status] : []), body);
  }
  draw();

  return {
    setIndex(i, l = "") { ix = i; loading = l || (i ? "" : "Reading notes…"); if (ix && sel && !ix.notes.has(sel)) sel = ""; if (!ix) editEl = null; if (lens === "edit" && editEl && ix) { editRefresh(editEl); return; } draw(); },
    editRelationship(ref) { openEditor(ref); },
    select(p) { if (pinned || p === sel) return; if (ix && !ix.notes.has(p)) return; sel = p; draw(); },
    setCanvasSelection(paths) {
      const same = paths.length === canvasSel.length && paths.every((p, i) => p === canvasSel[i]); canvasSel = paths; if (same) return;
      if (paths.length === 1) { if (lens === "common") lens = "note"; if (!pinned && (!ix || ix.notes.has(paths[0]!))) sel = paths[0]!; }
      else if (paths.length >= 2) lens = "common";
      editEl = lens === "edit" ? editEl : null; draw();
    },
    setLens(l) { lens = l; editEl = null; draw(); },
    lens: () => lens, selected: () => sel,
    destroy() { wrap.remove(); style.remove(); },
  };
}
