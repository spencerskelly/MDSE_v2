/* The Obsidian interface: a right-sidebar panel that follows the selected note, and a main-window table view. Both read the
 * one shared index the plugin builds; neither has its own file list (Obsidian's file explorer is the browser). Plain DOM;
 * every vault string goes in as text. The only writes are the two Review actions the host performs (D-0025). */
import { h, STYLE, csvCell, download } from "./ui.ts";
import type { Child } from "./ui.ts";
import type { EdgeRef, ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";
import * as V from "./views.ts";
import * as OL from "./outline.ts";
import { relatedNotes, commonRelated } from "./canvas.ts";
import * as QC from "./quick_create.ts";
import * as MN from "./member_nav.ts";
import * as TD from "./term_discovery.ts";
import { findSimilar, similarKinds } from "./similar.ts";
import { keywordGroups, previewWord, UNCATEGORIZED } from "./keywords.ts";
import { DEFAULT_CATEGORY_RULES, parseCategoryRules } from "../../importer/src/bom_category.ts";
import { editView, setEditRef, editRefresh, markEditStale, setEditMode, setMergeWith, EDIT_STYLE } from "./edit_ui.ts";
import type { EditHost } from "./edit_ui.ts";

export type NoteChange = { kind: "status"; value: string } | { kind: "removeFlag"; type: string; title: string; nth: number };
export interface PanelHost {
  openNote(path: string): void;
  /** Current globally selected model item, used only when the engineer explicitly enables Follow. */
  currentSelection?(): string | null;
  /** Open the table for a lens in the main window. */
  openTable(lens: V.Lens): void;
  /** Open an independent Workbench editor tab without replacing an open note, Canvas or other workflow. */
  openWorkflow?(area: "document" | "define" | "structure" | "verify", lens: V.Lens, selected: string): Promise<void>;
  /** Create a document or governed model note from a workflow-specific template, with preview before Apply. */
  quickCreate?(templateId: string, selectedPath: string): Promise<string>;
  /** Open the canvas for a lens in the main window (a transient preview). */
  openCanvas(lens: V.Lens, spec: Partial<V.ViewSpec>): Promise<string>;
  /** Show one usage and its actual SysML connect/bind/flow endpoints in a new scratch Canvas tab. */
  openMemberCanvas?(owner: string, key: string): Promise<string>;
  /** Put the picked notes on a canvas preview (D-0078). */
  /** Put notes on the canvas preview beside the selected note's card (D-0082). */
  addToCanvas?(anchor: string, paths: string[]): Promise<string>;
  /** The actual note cards in the open Canvas; temporary discovery candidates excluded. */
  canvasIncluded?(): Promise<{ canvas: string | null; included: string[] }>;
  /** Set membership for this list only: checked cards included, unchecked cards removed. */
  updateIncluded?(anchor: string, scope: string[], checked: string[], directChildren: string[]): Promise<string>;
  /** Show related notes as temporary candidates on a new scratch Canvas, never writing an existing saved Canvas. */
  discoverRelated?(sources: string[], mode: { workflow: "document" | "define" | "structure" | "verify"; all: boolean }): Promise<string>;
  discoveryActive?(): boolean;
  stopDiscovery?(): Promise<string>;
  /** Promote or dismiss cards selected on a discovery preview; only kept cards are saved. */
  keepSelectedDiscovery?(): Promise<string>;
  dismissSelectedDiscovery?(): Promise<string>;
  /** D-0088: a new canvas of the selected assembly's structure. */
  openStructureCanvas?(path: string, mode: "direct" | "full"): Promise<string>;
  /** D-0088: a new canvas (replacing the preview) of a note and the notes a view shows. */
  /** D-0089: apply the layout rules to the canvas that is open in the main window. */
  autoLayout?(): Promise<string>;
  /** D-0094, D-0095: collapse or expand the cards chosen on the open canvas, one layer or all layers. */
  cardAction?(kind: "toggle" | "collapseLayer" | "expandLayer" | "collapseAll" | "expandAll"): Promise<string>;
  /** D-0091: re-read the vault and bring the open canvas up to date with it. */
  refreshCanvas?(): Promise<string>;
  /** D-0090: put notes on the open canvas as one row directly below a parent's card. */
  addChildren?(parent: string, paths: string[]): Promise<string>;
  newCanvasFrom?(anchor: string, paths: string[]): Promise<string>;
  openPickCanvas?(paths: string[], label: string, relations: boolean, group: boolean, replace: boolean): Promise<string>;
  saveCanvas?(): Promise<string>;
  /** Review actions. Resolves to a message and a way back. */
  updateNote?(path: string, change: NoteChange): Promise<{ message: string; undo: () => Promise<string> }>;
  hasPreview?(): boolean;
  /** D-0146: the text of the vault's BOM category list (null when the vault has none), and the change that adds a word to a category and files the parts it places. */
  categoryRules?(): string | null;
  applyCategoryWord?(word: string, category: string, paths: string[]): Promise<{ message: string; undo: () => Promise<string> }>;
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
  /** Restore a workflow tab's own state, independent of other open Workbench tabs. */
  setWorkflow(area: "document" | "define" | "structure" | "verify", lens: V.Lens, selected: string): void;
  area(): "document" | "define" | "structure" | "verify";
  isPinned(): boolean;
  setPinned(pinned: boolean): void;
  /** Open the Edit lens on one relationship (from a table row or a canvas line). */
  editRelationship(ref: EdgeRef): void;
  refresh(): void;
  reloadCanvasIncluded(): void;
  lens(): V.Lens; selected(): string; destroy(): void;
}

export type EngineeringWorkflow = "document" | "define" | "structure" | "verify";
export const WORKFLOW_ENTRY_LENS: Record<EngineeringWorkflow, V.Lens> = {
  document: "note", define: "functional", structure: "structure", verify: "requirements",
};
/** Navigate to an item and workflow inside the existing Workbench. */
export function navigateToWorkflow(host: Pick<PanelHost, "openWorkflow">, area: EngineeringWorkflow, itemPath: string): Promise<void> {
  if (!itemPath || !host.openWorkflow) return Promise.reject(new Error("Choose a governed engineering item before opening a workflow."));
  return host.openWorkflow(area, WORKFLOW_ENTRY_LENS[area], itemPath);
}

/** Context isolation: pinned views, active editing, and unresolved paths must never silently change the selected item. */
export function followSelection(ix: ModelIndex | null, current: string, proposed: string | null | undefined, pinned: boolean, editing: boolean): string {
  return !pinned && !editing && !!proposed && !!ix?.notes.has(proposed) ? proposed : current;
}

const PANEL_STYLE = `
.mdw.mdp{display:block;height:100%;min-height:0;overflow:auto;padding:0 0 24px}.mdw.mdp header{display:block;padding:8px 10px}
.mdp .lenses{display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px;border-bottom:1px solid var(--line)}.mdp .lenses button{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);cursor:pointer}.mdp .lenses button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}.mdp .lenses select{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--fg);cursor:pointer}.mdp .lenses select.cur{background:var(--acc);color:#fff;border-color:var(--acc)}.mdp .lenses select.cur option{color:var(--fg);background:var(--bg)}
.mdw.mdp.tb{overflow:hidden;padding:0}.mdp .split{display:flex;height:100%;min-height:0}.mdp .main{flex:1;min-width:0;overflow:auto;padding-bottom:24px}
.mdp .workareas{display:flex;flex-wrap:wrap;gap:4px;padding:7px 10px;border-bottom:1px solid var(--line)}.mdp .workareas button{font-size:12px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg);cursor:pointer}.mdp .workareas button[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:#fff}.mdp .workareas button:disabled{opacity:.48;cursor:not-allowed}.mdp .workareas button.review{margin-left:auto}
.mdw .globalsearch{padding:7px 10px;border-bottom:1px solid var(--line)}.mdw .globalsearch input{box-sizing:border-box;width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg)}
.mdw .searchhits{max-height:250px;overflow-y:auto;margin-top:4px;border:1px solid var(--line);border-radius:6px}
.mdw .searchhits button{display:block;width:100%;text-align:left;padding:5px 8px;background:var(--bg2);border:0;border-bottom:1px solid var(--line);color:var(--fg);cursor:pointer}
.mdw .searchhits button:hover,.mdw .searchhits button:focus-visible{background:var(--bg)}
.mdw .searchhits small{display:block;color:var(--mut);font-size:11px}
.mdp .fnrow{padding:6px 10px;border-bottom:1px solid var(--line)}.mdp .fnrow select{width:100%;font-size:13px;padding:4px 6px}.mdp .tbar{flex:0 0 38px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;border-left:1px solid var(--line);overflow-y:auto;overflow-x:hidden}.mdp .tbar .tg{width:24px;border-top:1px solid var(--line);margin:4px 0 2px}.mdp .tbar button{width:30px;height:30px;padding:0;font-size:15px;line-height:1;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--fg);cursor:pointer}.mdp .tbar button:hover:not(:disabled){border-color:var(--acc)}.mdp .tbar button[aria-pressed=true]{background:var(--acc);color:#fff}.mdp .tbar button:disabled{opacity:.35;cursor:not-allowed}
.mdw .contextmode{display:flex;gap:4px;align-items:center;margin-top:6px;flex-wrap:wrap}.mdw .contextmode button{font-size:12px;padding:3px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg);cursor:pointer}.mdw .contextmode button[aria-pressed=true]{background:var(--acc);color:#fff;border-color:var(--acc)}.mdw .contextmode button:disabled{opacity:.55;cursor:not-allowed}
.mdw .relation-workflow{margin-left:6px;max-width:110px;font-size:11px;padding:2px 3px;border:1px solid var(--line);border-radius:5px;background:var(--bg2);color:var(--fg)}
.mdw .member-search{width:100%;box-sizing:border-box;padding:5px 7px;margin:4px 0 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg)}
.mdw .member-entry{border-bottom:1px solid var(--line);padding:5px 0}.mdw .member-entry summary{cursor:pointer;font-size:12.5px;white-space:normal}.mdw .member-info{padding:6px 10px;font-size:12px;overflow-wrap:anywhere}.mdw .member-info code{white-space:pre-wrap}.mdw .member-link{padding:4px 0;border-top:1px dashed var(--line)}
.mdp .body{padding:8px 10px}.mdp h3{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);margin:14px 0 4px}
.mdp .acts{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--line)}
.mdp table{font-size:12.5px}.mdp td,.mdp th{padding:3px 6px}.mdp .more{color:var(--mut);padding:4px 6px}.mdp .olc{display:inline-block;white-space:nowrap}.mdp .oltg{display:inline-block;width:16px;padding:0;border:0;background:transparent;color:var(--fg);cursor:pointer;font-size:12px;text-align:center}
.mdp .chips{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.mdp .chips label{border:1px solid var(--line);border-radius:999px;padding:0 8px;font-size:12px;cursor:pointer}
.mdw.mdm{display:block;height:100%;overflow:auto}.mdm header{display:flex}.mdm .body{padding:10px 16px}.mdm table{font-size:13.5px}.mdm .cellist a{display:block}
.mdp .cellist a,.mdm .cellist a{display:block}.mdp .msg{padding:6px 10px;color:var(--mut);font-size:12px}
.mdw button.sm{padding:2px 8px;font-size:12px;border:1px solid var(--line);border-radius:6px;background:var(--bg2);color:var(--fg);cursor:pointer}.mdw button.sm:hover{border-color:var(--acc)}.mdw button.pri{background:var(--acc);color:#fff;border-color:var(--acc)}
`;

export function mountPanel(root: HTMLElement, host: PanelHost, opt: { mode: "panel" | "main"; lens?: V.Lens; area?: "document" | "define" | "structure" | "verify"; selected?: string; fixedContext?: boolean } = { mode: "panel" }): PanelApp {
  const compact = opt.mode === "panel";
  const style = h("style"); style.textContent = STYLE + PANEL_STYLE + EDIT_STYLE;
  const wrap = h("div", { class: "mdw obs " + (compact ? "mdp" : "mdm") });
  root.replaceChildren(style, wrap);
  let ix: ModelIndex | null = null, sel = opt.selected ?? "", lens: V.Lens = opt.lens ?? "dashboard", loading = "Reading notes…", msg = "", undo: (() => Promise<string>) | null = null;
  let workArea: "document" | "define" | "structure" | "verify" = opt.area ?? "document", reviewReturn: V.Lens = "note", searchText = "", discoveryAll = false;
  let scope: "selected" | "all" = "selected", table: "notes" | "relationships" | "usages" = "relationships", text = "", spec: Partial<V.ViewSpec> = {}, revFilter = "", pinned = !!opt.fixedContext, inherit: V.InheritFrom[] = [];   // D-0101

  const note = (p: string | null | undefined): Note | undefined => (p ? ix?.notes.get(p) : undefined);
  const link = (p: string | null | undefined, label?: string, cls = ""): Node => {
    const n = note(p);
    if (!p || !n) return h("span", { class: cls || "mut" }, label ?? "(not in vault)");
    return h("a", { href: "#", class: "lnk", onclick: (e: Event) => { e.preventDefault(); host.openNote(p); } }, label ?? n.title);
  };
  const empty = (m: string): HTMLElement => h("div", { class: "empty", style: "padding:16px 0" }, m);
  const tag = (t: string): HTMLElement => h("span", { class: "tag" }, t);
  /** Per-result workflow handoff; never alters sel, lens, Pin, or the originating view. */
  const relatedWorkflow = (path: string): HTMLElement | null => {
    if (!host.openWorkflow || !note(path)) return null;
    return h("select", { class: "relation-workflow", "aria-label": "Open related element in workflow: " + note(path)!.title,
      title: "Show this related engineering element in the existing Workbench",
      onchange: (e: Event) => {
        const el = e.target as HTMLSelectElement, target = el.value as EngineeringWorkflow;
        el.value = "";
        if (!target) return;
        void navigateToWorkflow(host, target, path).catch((err) => {
          msg = "Could not open related element: " + String((err as Error)?.message ?? err); draw();
        });
      }
    }, h("option", { value: "", selected: true }, "↗ Workflow…"),
      ...([["Document", "document"], ["Define", "define"], ["Structure", "structure"], ["Verify", "verify"]] as const)
        .map(([label, id]) => h("option", { value: id }, label)));
  };

  /* ---- generic table renderer ---- */
  const cellNode = (c: V.TableCell | undefined): Child => {
    if (c === undefined) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.length ? h("div", { class: "cellist" }, ...c.map((x) => link(x.path, x.text))) : "";
    if (c.action) { const ref = c.action; return host.edit || host.editRelationship ? h("button", { class: "sm", title: "Change, add properties to, or remove this relationship", onclick: () => (compact ? openEditor(ref) : host.editRelationship?.(ref)) }, c.text) : ""; }
    return c.path !== undefined ? link(c.path, c.text, c.cls) : h("span", { class: c.cls ?? "" }, c.text);
  };
  const cellText = (c: V.TableCell | undefined): string => (c === undefined ? "" : typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text).join("; ") : c.text);
  let memberOwner = "", memberFilter = "", memberLimit = 40; const expandedMembers = new Set<string>();
  let cmpOther = "", cmpText = "", tree: "full" | "direct" = "full", canvasSel: string[] = [], tickKey = "", tickCount: HTMLElement | null = null; const rowTicks = new Set<string>(); let  pickText = "", pickType = "", pickRel = true, pickGroup = true; const pickSel = new Set<string>();
  let membershipLoading = false, membershipReady = false, membershipEpoch = 0;
  let membershipContext = ""; let activeCanvasName: string | null = null;
  /** Read the actual Canvas before presenting membership checkboxes. Avoid treating an unchecked
   * list row as an instruction to delete it until the current Canvas was successfully read. */
  function loadIncluded(context: string, force = false): void {
    if (!host.canvasIncluded) return;
    if (!force && membershipContext === context) return;
    membershipContext = context;
    membershipReady = false; membershipLoading = true;
    rowTicks.clear();
    const epoch = ++membershipEpoch;
    void host.canvasIncluded().then((snapshot) => {
      if (epoch !== membershipEpoch) return;
      activeCanvasName = snapshot.canvas;
      rowTicks.clear(); for (const p of snapshot.included) rowTicks.add(p);
      membershipLoading = false; membershipReady = true;
      draw();
    }, (error) => {
      if (epoch !== membershipEpoch) return;
      membershipLoading = false; membershipReady = false;
      msg = "Cannot read Canvas inclusion: " + String(error);
      draw();
    });
  }
  async function applyIncluded(anchor: string, eligible: string[], children: string[] = []): Promise<string> {
    if (!membershipReady || !host.updateIncluded) return "The current Canvas inclusion has not been loaded.";
    const checked = eligible.filter((p) => rowTicks.has(p));
    const result = await host.updateIncluded(anchor, eligible, checked, children);
    loadIncluded(membershipContext, true);
    return result;
  }
  const includeCheck = (p: string, label: string): HTMLElement => h("input", {
    type: "checkbox", "aria-label": "Include " + label, checked: rowTicks.has(p),
    disabled: !membershipReady || undefined,
    onchange: (e: Event) => {
      if ((e.target as HTMLInputElement).checked) rowTicks.add(p); else rowTicks.delete(p);
      if (tickCount) tickCount.textContent = `${rowTicks.size} currently selected`;
    }
  });
  // Disposable, batched inverted index. Rebuilt only when the authoritative vault index is replaced.
  let termCatalog: TD.TermCatalog | null = null, termSource: ModelIndex | null = null, termBuilding: ModelIndex | null = null;
  let termProgress = 0, termDestroyed = false, termQuery = "", termType = "", termPerType = 25;
  let termCommon: TD.TermFrequency[] = [], termTypes: string[] = [];
  const termPicked = new Set<string>();
  function ensureTermCatalog(): void {
    if (!ix || termSource === ix || termBuilding === ix || termDestroyed) return;
    const source = ix, catalog = TD.emptyTermCatalog(), iterator = source.notes.values(), kinds = new Set<string>();
    termBuilding = source; termProgress = 0; termCatalog = null; termCommon = []; termTypes = [];
    const next = (): void => {
      if (termDestroyed || ix !== source || termBuilding !== source) return;
      let done = false;
      for (let i = 0; i < 200; i++) {
        const entry = iterator.next();
        if (entry.done) { done = true; break; }
        TD.addTermNote(catalog, entry.value);
        kinds.add(entry.value.type);
        termProgress++;
      }
      if (done) {
        termCatalog = catalog; termSource = source; termBuilding = null;
        termTypes = [...kinds].sort();
        termCommon = TD.commonTerms(catalog, 36, 2, true);
        for (const path of termPicked) if (!source.notes.has(path)) termPicked.delete(path);
        draw();
      } else setTimeout(next, 0); // Yield to Obsidian between chunks even for large legacy models.
    };
    setTimeout(next, 0);
  }
  let editEl: HTMLElement | null = null, editSel = "";                                     // the Edit lens keeps its form while the index refreshes
  function openEditor(ref: EdgeRef): void { if (!host.edit) return; pinned = true; editEl = null; setEditRef(ref); lens = "edit"; msg = ""; undo = null; draw(); }
  const CAP = compact ? 25 : Infinity;
  const outlineState = new Map<string, Set<string>>();                                    // collapsed row keys of each outline table, kept across redraws (D-0150)
  const pages = new Map<string, number>();
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
    const tick = (r: Record<string, V.TableCell>): HTMLElement => {
      const p = rowNote(t, r); if (!p) return h("td", {});
      return h("td", {}, includeCheck(p, ix!.notes.get(p)?.title ?? p));
    };
    /* D-0150: an outline table (the indented BOM) can fold each assembly, fold or unfold everything, or show down to one level */
    const okey = [lens, sel, t.id, tree].join("|");
    const lvlOf = (r: Record<string, V.TableCell>): number => Number(cellText(r.level));
    const first = cols[0] ? cols[0].key : "";
    const ol = t.outline && first ? OL.buildOutline(t.rows.map((r) => { const c = r[first], one = c && typeof c === "object" && !Array.isArray(c) ? c : null; return { level: lvlOf(r), id: one?.path ?? cellText(c).replace(/^\u00a0+/, ""), notice: one?.cls === "gap" }; })) : null;
    const folded = (): Set<string> => outlineState.get(okey) ?? new Set<string>();
    const tbody = h("tbody", {}), moreEl = h("div", { class: "more" }), status = h("span", { class: "mut" });
    const pager = h("div", { class: "row", style: "display:flex;gap:8px;align-items:center" });
    const pageKey = [lens, sel, t.id, scope, tree, table].join("|");
    const rowEl = (i: number): HTMLElement => {
      const r = t.rows[i]!;
      return h("tr", {}, tickable ? tick(r) : null, ...cols.map((c, ci) => h("td", {}, ol && ci === 0 ? outlineCell(i, r[c.key]) : cellNode(r[c.key]))));
    };
    const outlineCell = (i: number, cell: V.TableCell | undefined): HTMLElement => {
      const o = ol!, parts = o.parts[i]!, open = !folded().has(o.key[i]!);
      const label = cell && typeof cell === "object" && !Array.isArray(cell) ? { ...cell, text: cell.text.replace(/^\u00a0+/, "") } : cell;
      const tg = parts ? h("button", { class: "oltg", "aria-expanded": String(open), title: open ? `Fold the ${parts} part line(s) under this one` : `Unfold the ${parts} part line(s) under this one`, onclick: () => { outlineState.set(okey, OL.toggled(o, folded(), i)); paint(); } }, open ? "\u25be" : "\u25b8") : h("span", { class: "oltg" }, "");
      return h("span", { class: "olc", style: `padding-left:${o.level[i]! * 14}px` }, tg, cellNode(label), !open ? h("span", { class: "mut" }, ` (+${parts})`) : null);
    };
    function paint(): void {
      const vis = ol ? OL.visibleRows(ol, folded()) : t.rows.map((_, i) => i);
      const count = Number.isFinite(CAP) ? Math.max(1, Math.ceil(vis.length / CAP)) : 1;
      const page = Math.min(pages.get(pageKey) ?? 0, count - 1);
      pages.set(pageKey, page);
      const shown = vis.slice(page * CAP, (page + 1) * CAP);
      tbody.replaceChildren(...shown.map(rowEl));
      moreEl.textContent = compact && count > 1 ? `Page ${page + 1} of ${count} · ${vis.length} accessible rows` : "";
      moreEl.style.display = moreEl.textContent ? "" : "none";
      pager.replaceChildren();
      if (compact && count > 1) {
        pager.append(
          h("button", { class: "sm", disabled: page === 0 || undefined, onclick: () => { pages.set(pageKey, page - 1); paint(); } }, "Previous page"),
          h("button", { class: "sm", disabled: page >= count - 1 || undefined, onclick: () => { pages.set(pageKey, page + 1); paint(); } }, "Next page")
        );
      }
      if (ol) status.textContent = vis.length === t.rows.length ? `${t.rows.length} rows` : `${vis.length} of ${t.rows.length} rows shown`;
    }
    if (ol && ol.max > 0) {
      const levels = h("select", { "aria-label": "Show down to level", title: "Show the parts down to this level and fold everything below", onchange: (e: Event) => { const el = e.target as HTMLSelectElement, n = Number(el.value); el.value = ""; if (n) { outlineState.set(okey, OL.collapseFromLevel(ol, n)); paint(); } } }, h("option", { value: "" }, "Show to level\u2026"), ...Array.from({ length: ol.max }, (_, k) => h("option", { value: String(k + 1) }, k + 1 === ol.max ? `Level ${k + 1} (all)` : `Level ${k + 1}`)));
      box.append(h("div", { class: "row", style: "display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0" },
        h("button", { class: "sm", title: "Unfold every assembly in this table: show every level of parts (the Expand all above folds page sections, not parts)", onclick: () => { outlineState.set(okey, new Set()); paint(); } }, "Expand all parts"),
        h("button", { class: "sm", title: "Fold every assembly in this table: show only this note and its direct parts (the Collapse all above folds page sections, not parts)", onclick: () => { outlineState.set(okey, OL.collapseFromLevel(ol, 1)); paint(); } }, "Collapse all parts"),
        levels, status));
    }
    box.append(h("table", {}, h("thead", {}, h("tr", {}, tickable ? h("th", { title: "Checked = included in the current Canvas. Uncheck and update to remove the card from this view." }, "In view") : null, ...cols.map((c) => h("th", {}, c.label)))), tbody));
    box.append(moreEl, pager); paint();
    box.append(h("button", { class: "sm", onclick: () => download(`${t.id}.csv`, [t.columns.filter((c) => c.label).map((c) => csvCell(c.label)).join(","), ...t.rows.map((r) => t.columns.filter((c) => c.label).map((c) => csvCell(cellText(r[c.key]))).join(","))].join("\n")) }, "Export CSV"));
    return t.title ? wrapSec() : box;
  }

  /* D-0089: apply the layout rules to the open canvas. Adding notes never moves anything; this does, when asked. */
  const layoutButton = (cls = "sm"): HTMLElement | null => { if (!host.autoLayout) return null; const b = h("button", { class: cls, title: "Rearrange the note cards on the canvas that is open in the main window by the layout rules: assemblies over parts, general over specialized, use cases left of requirements, functions and tests below requirements, objects below functions" }, "Auto-layout canvas"); b.addEventListener("click", () => busy(b, "Laying out…", () => host.autoLayout!())); return b; };
  const collapseButtons = (cls = "sm"): HTMLElement | null => {
    if (!host.cardAction) return null;
    const mk = (label: string, kind: "collapseLayer" | "expandLayer" | "collapseAll" | "expandAll", tip: string): HTMLElement => { const b = h("button", { class: cls, title: tip + " Applies to the note cards chosen on the canvas in the main window. Nothing in the vault changes." }, label); b.addEventListener("click", () => busy(b, "Working…", () => host.cardAction!(kind))); return b; };
    return h("span", { style: "display:inline-flex;gap:4px;flex-wrap:wrap" }, mk("Collapse layer", "collapseLayer", "Hide the deepest layer of parts shown under each chosen card."), mk("Expand layer", "expandLayer", "Show the next layer of parts under each chosen card."), mk("Collapse all", "collapseAll", "Hide every part under each chosen card; the card shows '+N hidden'."), mk("Expand all", "expandAll", "Show every layer of parts under each chosen card, up to 200 cards on the canvas."));
  };
  const refreshButton = (cls = "sm"): HTMLElement | null => { if (!host.refreshCanvas) return null; const b = h("button", { class: cls, title: "Re-read the vault and update the canvas open in the main window: cards show the notes\' current names, retired notes show red, lines follow the relationships. Nothing moves." }, "Refresh canvas"); b.addEventListener("click", () => busy(b, "Refreshing…", () => host.refreshCanvas!())); return b; };
  function layoutView(): HTMLElement {
    const btn = layoutButton("sm pri");
    return h("div", {}, h("p", {}, "Adding notes to a canvas never moves a card that is already there. Auto-layout is the one action that does: it rearranges the note cards of the canvas open in the main window by these rules."),
      h("ul", {}, h("li", {}, "An assembly is above its parts, centred over them; a general element is above the specialized one."), h("li", {}, "A use case is to the left of the requirement it relates to, in the same row."), h("li", {}, "A function and a test case are below the requirement they relate to; an object is below the function."), h("li", {}, "Where rules disagree, ownership and specialization win."), h("li", {}, "Notes with no relationship to another note on the canvas go to a grid below. Cards that are not notes (text, groups, images) stay where they are.")),
      btn ? h("div", { class: "row" }, btn, refreshButton(), collapseButtons()) : h("div", { class: "mut" }, "The canvas needs Obsidian."), h("div", { class: "mut" }, "Refresh canvas re-reads the vault and updates the cards and lines of the open canvas without moving anything."), h("div", { class: "mut" }, "There is no undo here beyond Obsidian's own; save a copy of the canvas first if you have arranged it by hand."));
  }
  /* D-0085: on the Structure, Function, States, Requirements, Design types and Internal structure views, put some or all of the notes shown on the canvas. */
  const ADDABLE = new Set<V.Lens>(["structure", "functional", "states", "requirements", "design", "internal"]);
  function addBar(ts: V.TableData[]): HTMLElement | null {
    if (!host.addToCanvas) return null;
    const shown = [...new Set(ts.flatMap((t) => t.rows.map((r) => rowNote(t, r))).filter((p): p is string => !!p))];
    if (!shown.length && lens !== "structure") return null;
    const root = sel && ix!.notes.has(sel) ? sel : "", anchor = root || shown[0]!;
    const kidsOf = lens === "structure" && root ? [...new Set(ix!.edges.filter((e) => e.kind === "hasPart" && e.from === root && e.to && !e.reverse && e.to !== root && ix!.notes.has(e.to)).map((e) => e.to!))] : [];
    const eligible = root && !shown.includes(root) ? [root, ...shown] : shown;
    const some = h("button", { class: "sm pri", disabled: !membershipReady || undefined,
      title: "Apply these checkboxes to the active Canvas: add checked missing cards, remove unchecked existing cards in this list, leave all other Canvas elements untouched." }, "Update included elements");
    some.addEventListener("click", () => busy(some, "Updating…", () => applyIncluded(anchor, eligible, kidsOf)));
    const every = h("button", { class: "sm", disabled: !membershipReady || undefined,
      title: "Check every item in the current list; use Update included elements to apply." }, `Check all ${eligible.length} listed`);
    every.addEventListener("click", () => { for (const p of eligible) rowTicks.add(p); draw(); });
    tickCount = h("span", { class: "mut" }, membershipReady
      ? `${eligible.filter((p) => rowTicks.has(p)).length} of ${eligible.length} included/selected`
      : membershipLoading ? "Reading Canvas inclusion…" : "Canvas inclusion unavailable");
    const mk = (label: string, title: string, go: () => Promise<string>): HTMLElement => { const b = h("button", { class: "sm pri", title }, label); b.addEventListener("click", () => busy(b, "Creating…", go)); return b; };
    const fresh: HTMLElement[] = [];
    if (kidsOf.length && host.addChildren) { const cb = h("button", { class: "sm pri", title: "Put every direct part of this assembly on the open canvas as one row below its card, joined bottom to top" }, `Add all ${kidsOf.length} children to canvas`); cb.addEventListener("click", () => busy(cb, "Adding…", () => host.addChildren!(root, kidsOf))); fresh.push(cb); }
    if (lens === "structure" && root && host.openStructureCanvas) fresh.push(
      mk("Canvas: direct parts", "A new canvas: this note, the assemblies it is directly in above it, and its direct parts in a row below, joined bottom of assembly to top of part", () => host.openStructureCanvas!(root, "direct")),
      mk("Canvas: complete BOM", "A new canvas: this note, the assemblies it is directly in above it, and every layer of parts under it, joined bottom of assembly to top of part", () => host.openStructureCanvas!(root, "full")));
    else if (host.newCanvasFrom) fresh.push(mk("Canvas of this view", "A new canvas, replacing the preview, of this note and the notes this view lists, placed by how they relate", () => host.newCanvasFrom!(anchor, root && !shown.includes(root) ? [root, ...shown] : shown)));
    return h("div", { class: "chips", style: "display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0" }, ...fresh, some, every, layoutButton(), refreshButton(), collapseButtons(), h("button", { class: "sm", disabled: !membershipReady || undefined, onclick: () => { for (const p of eligible) rowTicks.delete(p); draw(); } }, "Uncheck listed"), tickCount);
  }

  /** D-0086: the Merge tab of the Edit lens, from the Note menu, from a note, or with two notes chosen on the canvas. */
  /* D-0092: compare the selected note with another: what differs, and the structure down to the parts that differ. */
  function openCompare(other: string): void { pinned = true; cmpOther = other; lens = "compare"; editEl = null; draw(); }
  function compareBar(): HTMLElement {
    const found = V.pickRows(ix!, cmpText, "", 60).notes.filter((x) => x.path !== sel);
    const pick = h("select", { "aria-label": "Note to compare with", style: "max-width:100%", onchange: (e: Event) => { cmpOther = (e.target as HTMLSelectElement).value; draw(); } },
      h("option", { value: "" }, found.length ? "Choose the note to compare with…" : "No note matches"), ...found.map((x) => h("option", { value: x.path, selected: x.path === cmpOther || undefined }, `${x.title}  (${x.type}${x.id ? ", " + x.id : ""})`)));
    if (cmpOther && !found.some((x) => x.path === cmpOther) && ix!.notes.has(cmpOther)) pick.insertBefore(h("option", { value: cmpOther, selected: true }, ix!.notes.get(cmpOther)!.title), pick.children[1] ?? null);
    return h("div", { style: "display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:4px 0" }, h("span", { class: "mut" }, "Compare with"),
      h("input", { type: "search", placeholder: "Search by name, id or part number", value: cmpText, "aria-label": "Search for the note to compare with", style: "flex:1;min-width:140px", onchange: (e: Event) => { cmpText = (e.target as HTMLInputElement).value; cmpOther = ""; draw(); } }), pick);
  }
  function openMerge(other: string): void { if (!host.edit) return; pinned = true; setEditMode("merge"); setMergeWith(other); editEl = null; lens = "edit"; draw(); }

  /* ---- lenses ---- */
  function dashboardView(): HTMLElement {
    const d = V.dashboard(ix!), pct = (a: number, b: number): string => (b ? Math.round((100 * a) / b) + "%" : "n/a");
    const card = (k: string, v: string, sub = ""): HTMLElement => h("div", { class: "card" }, h("b", {}, v), h("span", { class: "mut" }, k), sub ? h("div", { class: "mut", style: "font-size:11px" }, sub) : null);
    const bars = (title: string, rows: Array<[string, number]>): HTMLElement => { const max = Math.max(1, ...rows.map((r) => r[1])); return h("div", {}, h("h3", {}, title), ...rows.slice(0, compact ? 8 : 20).map(([k, n]) => h("div", { style: "display:grid;grid-template-columns:minmax(80px,1fr) 2fr 36px;gap:6px;align-items:center;font-size:12.5px" }, h("span", {}, k), h("div", { class: "bar" }, h("i", { style: `width:${(100 * n) / max}%` })), h("span", { style: "text-align:right" }, String(n))))); };
    return h("div", {}, h("div", { class: "cards" }, card("notes", String(d.notes), `${d.blocks} with SysML`), card("requirements satisfied", pct(d.requirements.satisfied, d.requirements.total), `${d.requirements.satisfied} of ${d.requirements.total}`), card("requirements verified", pct(d.requirements.verified, d.requirements.total), `${d.requirements.verified} of ${d.requirements.total}`),
      card("unresolved references", String(d.dangling)), card("unconnected notes", String(d.orphans)), card("objects without a port", String(d.noPort)), card("SysML warnings", String(d.warnings), d.parser === "passed" ? "parser checked" : d.parser === "failed" ? "parser check failed" : "not parser-checked")),
      bars("Notes by type", d.byType), bars("Status", d.byStatus), bars("Flags", d.flags), bars("Relationship kinds", d.edgeKinds));
  }
  function memberInspector(n: Note): HTMLElement {
    if (memberOwner !== n.path) { memberOwner = n.path; memberFilter = ""; memberLimit = 40; expandedMembers.clear(); }
    const members = MN.memberDetails(ix!, n.path), query = memberFilter.toLowerCase();
    const matches = members.filter((m) => !query ||
      [m.kind, m.name, m.type, m.head, m.doc, ...m.subsets, ...m.redefines,
        ...m.props.map((p) => p.name + " " + p.value), ...m.connections.map((c) => c.statement)]
        .some((s) => s.toLowerCase().includes(query)));
    const visible = matches.slice(0, memberLimit), area = h("div", {});
    area.append(h("label", { class: "mut" }, "Filter members / connections ",
      h("input", { class: "member-search", type: "search", value: memberFilter,
        placeholder: "Name, port, connected endpoint, SysML…",
        onchange: (e: Event) => { memberFilter = (e.target as HTMLInputElement).value; memberLimit = 40; draw(); } })));
    area.append(h("div", { class: "mut", style: "font-size:11px" },
      `Showing ${visible.length} of ${matches.length} matching usages (${members.length} total). Each usage remains owned by this note.`));
    for (const m of visible) {
      const d = h("details", { class: "member-entry", open: expandedMembers.has(m.key) },
        h("summary", {}, tag(m.kind), " ", h("b", {}, m.name), " ",
          h("span", { class: "mut" }, [m.ref ? "ref" : "", m.dir, m.mult, m.type ? ": " + m.type : "(untyped)"].filter(Boolean).join(" ")),
          m.connections.length ? h("span", { class: "mut" }, ` · ${m.connections.length} explicit connection(s)`) : null));
      const info = h("div", { class: "member-info" });
      if (host.openMemberCanvas) {
        const btn = h("button", { class: "sm", title: "Visualize only this member's explicit SysML connections in a new scratch Canvas tab" }, "Canvas connections");
        btn.addEventListener("click", () => busy(btn, "Opening…", () => host.openMemberCanvas!(n.path, m.key)));
        info.append(h("div", { style: "margin:0 0 6px" }, btn));
      }
      if (m.type) info.append(h("div", {}, "Type definition: ", m.typePath ? link(m.typePath) : h("span", { class: "gap" }, m.type + " (not in vault)"),
        m.typePath ? relatedWorkflow(m.typePath) : null));
      else info.append(h("div", { class: "gap" }, "Untyped usage — no type definition to navigate to."));
      info.append(h("div", {}, "Declaration: ", h("code", {}, m.head)));
      if (m.ref || m.conj || m.end) info.append(h("div", { class: "mut" }, [m.ref ? "reference usage" : "", m.conj ? "conjugated type" : "", m.end ? "interface end" : ""].filter(Boolean).join(" · ")));
      if (m.subsets.length) info.append(h("div", {}, "Subsets: " + m.subsets.join(", ")));
      if (m.redefines.length) info.append(h("div", {}, "Redefines: " + m.redefines.join(", ")));
      if (m.doc) info.append(h("div", { style: "white-space:pre-wrap" }, "Documentation: " + m.doc));
      for (const p of m.props) info.append(h("div", {}, h("code", {}, p.name + " = " + p.value)));
      if (!m.connections.length) info.append(h("div", { class: "mut" }, "No explicit connect, bind or flow involving this usage."));
      for (const c of m.connections) {
        const other = c.otherEnd;
        info.append(h("div", { class: "member-link" },
          h("div", {}, tag(c.kind + (c.form && c.form !== "plain" ? " / " + c.form : "")), " ",
            h("b", {}, c.thisEnd.text), " ↔ ", h("b", {}, other.text),
            other.resolved ? null : h("span", { class: "gap" }, " (unresolved endpoint)")),
          h("div", { class: "mut" }, h("code", {}, c.statement)),
          other.path ? h("div", {}, "Endpoint type: ", link(other.path), relatedWorkflow(other.path)) : null));
      }
      d.append(info);
      d.addEventListener("toggle", () => {
        if ((d as HTMLDetailsElement).open) expandedMembers.add(m.key);
        else expandedMembers.delete(m.key);
      });
      area.append(d);
    }
    if (matches.length > memberLimit)
      area.append(h("button", { class: "sm", onclick: () => { memberLimit += 40; draw(); } }, `Show next ${Math.min(40, matches.length - memberLimit)} members`));
    return area;
  }
  function noteView(): HTMLElement {
    const n = note(sel); if (!n) return empty("Open a model note in Obsidian.");
    const box = h("div", {});
    box.append(h("div", {}, tag(n.type + (n.subtype ? "/" + n.subtype : "")), tag(n.id), tag(n.status || "no status"), h("button", { class: "sm", style: "margin-left:8px", onclick: () => host.openNote(n.path) }, "Open note"), host.edit && n.type === "Object" ? h("button", { class: "sm", style: "margin-left:4px", title: "Merge this part with another note, for example a BOM part with the model element it is", onclick: () => openMerge("") }, "Merge with another note…") : null, h("button", { class: "sm", style: "margin-left:4px", title: "List what differs between this note and another, with the structure down to the parts that differ", onclick: () => openCompare("") }, "Compare with another note…")));
    for (const f of n.flags) box.append(h("div", { class: "callout " + f.type }, h("b", {}, f.type.replace("flag", "") + ": " + f.title), f.detail ? h("div", {}, f.detail) : null));
    if (n.def?.doc) box.append(h("div", { class: "reqtext", style: "white-space:pre-wrap;margin:8px 0;padding:6px 10px;border-left:3px solid var(--text-accent,#b25e00)" }, n.def.doc));
    const rel = (edges: ReturnType<typeof outgoing>, dir: "out" | "in"): HTMLElement => {
      const by = new Map<string, typeof edges>(); for (const e of edges) (by.get(e.kind) ?? by.set(e.kind, []).get(e.kind)!).push(e);
      if (!by.size) return h("div", { class: "mut" }, "None.");
      return h("div", {}, ...[...by].map(([k, list]) => h("div", { style: "margin:2px 0" }, h("span", { class: "tag k" }, k), " ", ...list.flatMap((e, i) => { const other = dir === "out" ? e.to : e.reverse ? null : e.from; return [i ? ", " : "", e.reverse && dir === "out" ? h("span", { class: "gap" }, "← " + e.toSymbol + " (not in vault)") : other ? link(other) : h("span", { class: "gap" }, e.toSymbol + " (not in vault)"), other ? relatedWorkflow(other) : null, e.label ? h("span", { class: "mut" }, " " + e.label) : null]; }))));
    };
    box.append(sec("rel-out", "Relates to", [rel(outgoing(ix!, n.path), "out")], { count: outgoing(ix!, n.path).length }), sec("rel-in", "Related from", [rel(incoming(ix!, n.path), "in")], { count: incoming(ix!, n.path).length }));
    const rn = relatedNotes(ix!, n.path);
    if (host.addToCanvas && rn.length) {       // D-0082
      if (host.newCanvasFrom) { const nb = h("button", { class: "sm pri", title: "A new canvas, replacing the preview, of this note and every note related to it, placed by how they relate" }, "Canvas of this note and its related notes"); nb.addEventListener("click", () => busy(nb, "Creating…", () => host.newCanvasFrom!(n.path, rn.map((r) => r.path)))); box.append(h("div", { class: "row" }, nb)); }
      const eligible = [n.path, ...rn.map((r) => r.path)];
      const update = h("button", { class: "sm pri", disabled: !membershipReady || undefined,
        title: "Synchronize this related-element list with the current Canvas. Unchecked related cards are removed only from the Canvas." }, "Update included elements");
      update.addEventListener("click", () => busy(update, "Updating…", () => applyIncluded(n.path, eligible)));
      const all = h("button", { class: "sm", disabled: !membershipReady || undefined,
        onclick: () => { for (const p of eligible) rowTicks.add(p); draw(); } }, "Check all related");
      box.append(sec("rel-add", "Related elements — Canvas inclusion", [
        h("div", { class: "mut" }, membershipReady ? `Checked elements are already in ${activeCanvasName ?? "the current view"} or staged for inclusion. Changes apply only after Update.` : "Reading Canvas membership…"),
        h("div", { class: "row" }, update, all),
        h("div", {}, includeCheck(n.path, n.title), " ", link(n.path), h("span", { class: "mut" }, " (selected element)")),
        ...rn.map((r) => h("div", { style: "margin:2px 0" }, includeCheck(r.path, note(r.path)?.title ?? r.path), " ", link(r.path), relatedWorkflow(r.path), " ", h("span", { class: "mut" }, r.kinds.join(", "))))
      ], { count: rn.length, open: true }));
    }
    if (n.def?.usages.length) box.append(sec("usages", "Members and explicit connections", [memberInspector(n)], { count: n.def.usages.length }));
    return box;
  }
  const chip = (label: string, on: boolean, fn: (v: boolean) => void): HTMLElement => h("label", {}, h("input", { type: "checkbox", checked: on, onchange: (e: Event) => { fn((e.target as HTMLInputElement).checked); draw(); } }), " " + label);
  function scopeBar(): HTMLElement | null {
    if (lens === "structure") return h("div", { class: "chips" }, h("select", { "aria-label": "How much of the structure", title: "The whole tree of parts below this note, or only the parts it owns directly", onchange: (e: Event) => { tree = (e.target as HTMLSelectElement).value as typeof tree; draw(); } }, h("option", { value: "full", selected: tree === "full" }, "Full tree"), h("option", { value: "direct", selected: tree === "direct" }, "Direct parts only")));
    if (lens === "internal") return h("div", { class: "chips", style: "flex-wrap:wrap" }, h("span", { class: "mut" }, "Also show ports and parts inherited"), ...V.INHERIT_FROM.map(([k, group, label]) => h("label", { title: `${group}: ${label}` }, h("input", { type: "checkbox", "aria-label": `Inherit ${label}`, checked: inherit.includes(k), onchange: (e: Event) => { inherit = (e.target as HTMLInputElement).checked ? [...inherit, k] : inherit.filter((x) => x !== k); draw(); } }), ` ${group === "Assembly" ? (k === "parent" ? "parent assembly" : "child parts") : k === "general" ? "general" : "specific"} `, h("span", { class: "mut" }, group === "Assembly" ? "(assembly)" : "(specialization)"))));
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
  /* D-0146: the parts a BOM import left in Uncategorized, by the word their description starts with. Pick a category for a word, see what it would do, then apply. */
  let kwPick = new Map<string, string>(), kwOpen = "", kwFilter = "";
  function keywordsView(): HTMLElement {
    const box = h("div", {}), text = host.categoryRules?.() ?? null, parsed = text === null ? { rules: DEFAULT_CATEGORY_RULES, problems: [] as string[] } : parseCategoryRules(text);
    const rules = parsed.rules ?? DEFAULT_CATEGORY_RULES, k = keywordGroups(ix!), cats = [...new Set([...rules.map((r) => r.category), ...k.byCategory.map((c) => c.category)])].filter((c) => c !== UNCATEGORIZED).sort();
    box.append(h("div", { class: "callout" }, h("b", {}, `${k.uncategorized} of ${k.total} parts are Uncategorized`), " — grouped by the first word of the description. Pick a category for a word to see how many parts it would place and how many already-placed parts it would move; Apply adds the word to the category list and files the parts it places. Parts keep their folders; a re-import files new parts by the new list.", text === null && host.applyCategoryWord ? " The vault has no category list yet: Apply writes one." : ""));
    if (parsed.problems?.length) box.append(h("div", { class: "callout" }, h("b", {}, "The category list has problems: "), parsed.problems.join("; ")));
    const f = h("input", { type: "search", placeholder: "Filter words", value: kwFilter, "aria-label": "Filter words" }) as HTMLInputElement;
    f.addEventListener("input", () => { kwFilter = f.value; draw(); }); box.append(f);
    const groups = k.groups.filter((g) => !kwFilter || g.key.includes(kwFilter.toUpperCase())), shown = groups.slice(0, compact ? 40 : 300);
    const rows = shown.map((g) => {
      const sel = h("select", { "aria-label": `Category for ${g.key}` }, h("option", { value: "" }, "— category —"), ...cats.map((c) => h("option", { value: c, selected: (kwPick.get(g.key) ?? "") === c }, c)), h("option", { value: "\u0000new" }, "New category…")) as HTMLSelectElement;
      sel.addEventListener("change", () => { let c = sel.value; if (c === "\u0000new") { c = (typeof prompt === "function" ? prompt(`New category for ${g.key}`) ?? "" : "").trim(); } if (c) kwPick.set(g.key, c); else kwPick.delete(g.key); kwOpen = c ? g.key : ""; draw(); });
      const word = g.key.split(" ")[0]!, why = g.evidence.slice(0, 2).map((e) => `${e.category} ${e.count}`).join(", ");
      const tr = [h("tr", {}, h("td", {}, h("b", {}, g.key)), h("td", {}, String(g.parts.length)), h("td", {}, g.examples.map((e) => { const p = ix!.byName.get(e.toLowerCase()); return p ? link(p) : e; }).flatMap((x, i) => i ? [", ", x] : [x])), h("td", { class: "mut" }, why || "—"), h("td", {}, sel))];
      const c = kwPick.get(g.key);
      if (c && kwOpen === g.key) {
        const pv = previewWord(ix!, rules, word, c);
        const moved = pv.movedTotal ? `would move ${pv.movedTotal} placed part${pv.movedTotal === 1 ? "" : "s"} (${pv.moved.slice(0, 4).map((m) => `${m.count} from ${m.from}`).join(", ")}${pv.moved.length > 4 ? ", …" : ""})` : "moves no placed part";
        tr.push(h("tr", {}, h("td", { colspan: "5" }, h("b", {}, `${word} → ${c}: `), `places ${pv.placed} Uncategorized part${pv.placed === 1 ? "" : "s"}; ${moved}. `, host.applyCategoryWord ? h("button", { class: "sm", title: "Add the word to the category list and set the category on the parts it places", disabled: pv.placed === 0 || undefined, onclick: () => applyWord(word, c, pv.placedPaths) }, "Apply") : null, host.addToCanvas || host.openPickCanvas ? h("button", { class: "sm", onclick: async () => { msg = (await host.openPickCanvas?.(g.parts, `${g.key} (Uncategorized)`, false, false, false)) ?? ""; draw(); } }, "Open the parts as a canvas") : null)));
      }
      return tr;
    }).flat();
    box.append(h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Word"), h("th", {}, "Parts"), h("th", {}, "Examples"), h("th", {}, "Placed parts that start so"), h("th", {}, "Category"))), h("tbody", {}, ...rows)));
    if (groups.length > shown.length) box.append(h("div", { class: "more" }, `… ${groups.length - shown.length} more words. Filter to find them.`));
    return box;
  }
  async function applyWord(word: string, category: string, paths: string[]): Promise<void> {
    if (!host.applyCategoryWord) return;
    try { const r = await host.applyCategoryWord(word, category, paths); msg = r.message; undo = r.undo; kwPick.delete(word); kwOpen = ""; } catch (e) { msg = "Not applied: " + String((e as Error)?.message ?? e); undo = null; }
    draw();
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
    const upd = (): void => { count.textContent = `${pickSel.size} ticked`; };
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

  /* Shared-term discovery: evidence by governed type, with explicit Canvas placement only.
   * Nothing in this view writes SysML. A common word is never treated as a relationship. */
  function termsView(): HTMLElement {
    ensureTermCatalog();
    const box = h("div", { class: "term-discovery" },
      h("div", { class: "mut" }, "Search governed engineering note names, aliases, descriptions, Markdown bodies and SysML text. Complete words are AND-matched. Shared words are candidate evidence, not modeled links."));
    if (!termCatalog || termSource !== ix) {
      box.append(h("div", { class: "mut", role: "status" },
        `Building the local term index without freezing Obsidian… ${termProgress} of ${ix!.notes.size} governed notes examined.`));
      return box;
    }
    const catalog = termCatalog;
    const input = h("input", { type: "search", class: "member-search",
      "aria-label": "Search words across engineering element types", value: termQuery,
      placeholder: "e.g. cooling fan, battery, CANH",
      onchange: (e: Event) => { termQuery = (e.target as HTMLInputElement).value; termPerType = 25; draw(); } });
    box.append(input);
    const result = TD.searchTermCatalog(catalog, termQuery, termPerType, termType);
    const setQuery = (w: string) => { termQuery = w; termType = ""; termPerType = 25; draw(); };
    const related = h("div", { class: "chips term-suggestions" },
      h("span", { class: "mut" }, "Common terms across element types (documents, not occurrences): "),
      ...termCommon.slice(0, 24).map((f) => h("button", { class: "sm", type: "button",
        title: f.byType.map((x) => x.type + ": " + x.count).join("; "), onclick: () => setQuery(f.word) },
        `${f.word} · ${f.notes} notes / ${f.types} types`)));
    box.append(related);
    if (!termCommon.length) box.append(h("div", { class: "mut" }, "No words currently appear in two or more governed element types."));
    const chooser = h("select", { "aria-label": "Filter term matches by element type", onchange: (e: Event) => {
      termType = (e.target as HTMLSelectElement).value; termPerType = 25; draw();
    } }, h("option", { value: "", selected: !termType }, "All element types"),
      ...termTypes.map((t) => h("option", { value: t, selected: t === termType }, t)));
    box.append(h("div", { class: "chips" }, chooser,
      h("span", { class: "mut", role: "status" },
        termQuery.trim() ? `${result.total} matching governed elements across ${result.groups.length} shown types.` :
          `${catalog.indexed} governed elements indexed; choose a common term or enter a search.`)));
    const selected = (): string[] => [...termPicked].filter((path) => ix!.notes.has(path));
    const actionBar = h("div", { class: "chips", style: "display:flex;gap:6px;flex-wrap:wrap" });
    const makeButton = (label: string, hint: string, fn: () => Promise<string>) => {
      const button = h("button", { class: "sm", type: "button", title: hint }, label);
      button.addEventListener("click", () => {
        if (!selected().length) { msg = "Select at least one matching engineering element."; draw(); return; }
        busy(button, "Placing…", fn);
      });
      return button;
    };
    const count = h("span", { class: "mut" }, `${selected().length} selected`);
    const displayed = result.groups.flatMap((g) => g.matches.map((x) => x.path));
    actionBar.append(
      h("button", { class: "sm", type: "button", onclick: () => { for (const p of displayed) termPicked.add(p); draw(); } }, "Select displayed"),
      h("button", { class: "sm", type: "button", onclick: () => { termPicked.clear(); draw(); } }, "Clear selection"),
      count);
    if (host.openPickCanvas) actionBar.append(makeButton("New grouped Canvas",
      "Open a new scratch Canvas grouped by element type. Lines come only from existing authoritative relationships.",
      () => host.openPickCanvas!(selected(), `Shared terms: ${termQuery.trim() || "selected elements"}`, true, true, true)));
    if (host.addToCanvas) actionBar.append(makeButton("Add to current Canvas",
      "Explicitly add these cards to the currently active Canvas. This can modify a saved Canvas. Only existing governed relationships are drawn.",
      () => host.addToCanvas!(sel && ix!.notes.has(sel) ? sel : selected()[0]!, selected())));
    box.append(actionBar);
    if (!termQuery.trim()) return box;
    if (!result.total) { box.append(empty("No governed elements contain every searched term. Try a single word, a synonym, or a broader requirement phrase.")); return box; }
    for (const group of result.groups) {
      const items = group.matches.map((hit) => {
        const n = ix!.notes.get(hit.path)!;
        return h("div", { class: "term-hit", style: "display:flex;gap:7px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--line)" },
          h("input", { type: "checkbox", checked: termPicked.has(hit.path),
            "aria-label": "Select " + n.title + " for Canvas",
            onchange: (e: Event) => {
              if ((e.target as HTMLInputElement).checked) termPicked.add(hit.path); else termPicked.delete(hit.path);
              count.textContent = `${selected().length} selected`;
            } }),
          h("div", {}, link(hit.path), " ", relatedWorkflow(hit.path), " ", tag(n.type + (n.subtype ? "/" + n.subtype : "")),
            h("span", { class: "mut" }, " " + n.id),
            h("div", { class: "mut", style: "font-size:11px" }, `Matched in: ${hit.fields.join(", ")} · ${hit.excerpt}`)));
      });
      box.append(sec("terms-" + group.type, group.type, items, { count: group.total, open: true }));
    }
    if (result.truncated) box.append(h("button", { class: "sm", type: "button",
      onclick: () => { termPerType += 25; draw(); } }, `Show up to ${termPerType + 25} per type`));
    box.append(h("div", { class: "mut" }, "Only existing SysML/approved model connections appear between cards. To propose a new relationship, draw and approve it through the governed editor."));
    return box;
  }

  /* Find similar: the notes that share a relationship with the selected note, grouped by relationship and direction. */
  let simKinds: string[] = [];
  function similarView(): HTMLElement {
    const n = sel ? note(sel) : null; if (!n) return empty("Select a note to find the notes that share a relationship with it.");
    const all = findSimilar(ix!, sel), kinds = similarKinds(all), r = simKinds.length ? findSimilar(ix!, sel, { kinds: simKinds }) : all;
    const addBtn = (label: string, paths: string[], cls = "sm"): HTMLElement => { const b = h("button", { class: cls, title: "Put on the canvas preview, beside the selected note" }, label); b.addEventListener("click", () => busy(b, "Adding…", () => host.addToCanvas!(sel, paths))); return b; };
    const box = h("div", {}, h("div", { class: "chips" }, h("span", { class: "mut" }, "Relationship"), h("select", { "aria-label": "Relationship kind", onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; simKinds = v ? [v] : []; draw(); } }, h("option", { value: "" }, "all"), ...kinds.map((k) => h("option", { value: k, selected: simKinds[0] === k }, k)))));
    if (!r.groups.length) { box.append(h("div", { class: "mut" }, all.groups.length ? "No similar notes for this relationship." : "No other note shares a relationship with this one.")); return box; }
    if (host.addToCanvas) box.append(h("div", { class: "row" }, addBtn(`Add all ${r.peers.length} to canvas`, r.peers.map((x) => x.path), "sm pri")));
    for (const g of r.groups) box.append(sec(`sim-${g.direction}-${g.kind}-${g.via}`, `${g.direction === "out" ? "also" : "same source:"} ${g.kind} ${g.direction === "out" ? "→" : "←"} ${note(g.via)!.title}`, [h("div", { class: "mut", style: "font-size:12px" }, g.direction === "out" ? `${n.title} and these notes all ${g.kind} ${note(g.via)!.title}` : `${note(g.via)!.title} ${g.kind} ${n.title} and these notes`), ...g.peers.map((p) => h("div", { style: "margin:3px 0" }, host.addToCanvas ? addBtn("+", [p]) : null, " ", link(p), relatedWorkflow(p), " ", tag(note(p)!.type)))], { count: g.peers.length }));
    return box;
  }

  /* D-0084: the notes related to every note chosen on the canvas. */
  function commonView(): HTMLElement {
    const given = canvasSel.filter((p) => ix!.notes.has(p));
    if (given.length < 2) return empty("Choose two or more note cards on the canvas (hold Shift to add to a choice) and the notes related to all of them are listed here.");
    const c = commonRelated(ix!, given), kindsOf = (by: Array<{ from: string; kinds: string[] }>): string => by.map((b) => `${note(b.from)!.title}: ${b.kinds.join(", ")}`).join(" · ");
    const addBtn = (label: string, paths: string[], cls = "sm"): HTMLElement => { const b = h("button", { class: cls, title: "Put on the canvas preview, between the chosen cards when they are there" }, label); b.addEventListener("click", () => busy(b, "Adding…", () => host.addToCanvas!(given[0]!, paths))); return b; };
    const row = (r: { path: string; by: Array<{ from: string; kinds: string[] }> }): HTMLElement => h("div", { style: "margin:3px 0" }, host.addToCanvas ? addBtn("+", [r.path]) : null, " ", link(r.path), relatedWorkflow(r.path), " ", tag(note(r.path)!.type), h("div", { class: "mut", style: "font-size:12px;margin-left:26px" }, kindsOf(r.by)));
    const mergeBtn = host.edit && given.length === 2 && given.every((p) => note(p)!.type === "Object") ? h("button", { class: "sm", title: "Mark these two notes as the same part and merge them. When one is a BOM part, it is the one that stays.", onclick: () => { sel = given[0]!; openMerge(given[1]!); } }, "Merge these two…") : null;
    const cmpBtn = given.length === 2 ? h("button", { class: "sm pri", title: "List what differs between these two notes, with the structure down to the parts that differ", onclick: () => { sel = given[0]!; openCompare(given[1]!); } }, "Compare these two") : null;
    const box = h("div", {}, h("div", { class: "mut" }, "Chosen on the canvas"), cmpBtn || mergeBtn ? h("div", { class: "row" }, cmpBtn, mergeBtn) : null, h("div", {}, ...given.flatMap((p, i) => [i ? ", " : "", link(p)])));
    box.append(sec("com-all", `Related to all ${given.length}`, c.all.length ? [host.addToCanvas ? h("div", { class: "row" }, addBtn(`Add all ${c.all.length} to canvas`, c.all.map((r) => r.path), "sm pri")) : null, ...c.all.map(row)] : [h("div", { class: "mut" }, "No note is related to all of them.")], { count: c.all.length }));
    box.append(sec("com-some", "Related to fewer than all (most common first)", c.some.length ? [host.addToCanvas ? h("div", { class: "row" }, addBtn(`Add all ${c.some.length} to canvas`, c.some.map((r) => r.path))) : null, ...c.some.slice(0, 200).map((r) => h("div", { style: "margin:3px 0" }, host.addToCanvas ? addBtn("+", [r.path]) : null, " ", link(r.path), relatedWorkflow(r.path), " ", tag(note(r.path)!.type), h("span", { class: "mut" }, ` ${r.count} of ${given.length}`), h("div", { class: "mut", style: "font-size:12px;margin-left:26px" }, kindsOf(r.by))))] : [h("div", { class: "mut" }, "None.")], { count: c.some.length, open: true }));
    return box;
  }

  /* ---- canvas settings (compact) ---- */
  function canvasSettings(): HTMLElement {
    const prof = V.PROFILES.find((p) => p.name === V.LENS_PROFILE[lens])!, sp: V.ViewSpec = { ...V.defaultSpec(prof), ...spec };
    const set = (patch: Partial<V.ViewSpec>): void => { spec = { ...spec, ...patch }; draw(); };
    const types = new Map<string, number>(); for (const n of ix!.notes.values()) types.set(n.type, (types.get(n.type) ?? 0) + 1);
    const kinds = V.edgeKinds(ix!), flip = (l: string[], v: string, on: boolean): string[] => (on ? l.filter((x) => x !== v) : l.includes(v) ? l : [...l, v]);
    return h("details", { class: "vsbox" }, h("summary", {}, "Canvas settings"),
      h("div", { class: "chips" }, h("label", {}, "connections away ", h("input", { type: "number", min: 1, value: sp.depth, style: "width:48px", onchange: (e: Event) => set({ depth: Math.max(1, +(e.target as HTMLInputElement).value || prof.depth) }) })), h("label", {}, "max notes ", h("input", { type: "number", min: 5, max: 500, value: sp.cap, style: "width:56px", onchange: (e: Event) => set({ cap: Math.max(5, +(e.target as HTMLInputElement).value || prof.cap) }) })),
        h("button", { class: "sm", onclick: () => { spec = {}; draw(); } }, "Reset")),
      h("div", { class: "mut" }, "Note types shown"), h("div", { class: "chips" }, ...[...types].sort().map(([k, n]) => chip(`${k} ${n}`, !sp.hideTypes.includes(k), (on) => { spec = { ...spec, hideTypes: flip(sp.hideTypes, k, on) }; }))),
      h("div", { class: "mut" }, `Relationships followed (none ticked = the ${prof.name} profile's own)`), h("div", { class: "chips" }, ...kinds.map(([k, n]) => chip(`${k} ${n}`, sp.kinds.includes(k), (on) => { spec = { ...spec, kinds: on ? [...sp.kinds, k] : sp.kinds.filter((x) => x !== k) }; }))),
      h("div", { class: "chips" }, h("span", { class: "mut" }, "Group similar notes by"), h("select", { "aria-label": "Classifier", onchange: (e: Event) => set({ collapse: (e.target as HTMLSelectElement).value as V.Classifier }) }, ...V.CLASSIFIERS.map(([v, l]) => h("option", { value: v, selected: v === sp.collapse }, l))), h("label", {}, "when more than ", h("input", { type: "number", min: 1, max: 50, value: sp.collapseOver, style: "width:44px", onchange: (e: Event) => set({ collapseOver: Math.max(1, +(e.target as HTMLInputElement).value || 6) }) }))),
      h("label", { class: "mut" }, h("input", { type: "checkbox", checked: sp.ghosts, onchange: (e: Event) => { spec = { ...spec, ghosts: (e.target as HTMLInputElement).checked }; } }), " show references to notes not in the vault"));
  }

  /* ---- shell ---- */
  const busy = (btn: HTMLElement, label: string, job: () => Promise<string>): void => { btn.setAttribute("disabled", ""); btn.textContent = label; job().then((m) => { msg = m; undo = null; }, (e) => { msg = "Failed: " + String((e as Error)?.message ?? e); }).finally(() => draw()); };
  const setContextPinned = (nextPinned: boolean): void => {
    if (lens === "edit" && !nextPinned) { msg = "Editing keeps this engineering item pinned. Leave Edit to enable Follow."; draw(); return; }
    pinned = nextPinned;
    if (!pinned) sel = followSelection(ix, sel, host.currentSelection?.(), false, false);
    draw();
  };
  function draw(): void {
    const n = note(sel);
    const contextMode = h("div", { class: "contextmode", role: "group", "aria-label": "Engineering item selection mode" },
      h("span", { class: "mut", style: "font-size:12px" }, "Selection:"),
      h("button", { type: "button", "aria-pressed": !pinned ? "true" : "false", disabled: lens === "edit" || undefined,
        title: "Follow engineering items selected in other notes and Canvases", onclick: () => setContextPinned(false) }, "Follow"),
      h("button", { type: "button", "aria-pressed": pinned ? "true" : "false",
        title: "Keep this engineering item fixed while working elsewhere", onclick: () => setContextPinned(true) }, "Pin"),
      pinned ? h("span", { class: "mut", style: "font-size:12px" }, "Item stays fixed") : null);
    if (n && host.openWorkflow) contextMode.append(
      h("label", { class: "mut", style: "font-size:12px", title: "Show the selected engineering item in the existing Workbench" },
        "Open item in ", h("select", {
          "aria-label": "Show selected item in workflow",
          onchange: (e: Event) => {
            const pick = e.target as HTMLSelectElement;
            const area = pick.value as EngineeringWorkflow; pick.value = "";
            if (!area) return;
            void navigateToWorkflow(host, area, n.path).catch((err) => {
              msg = "Could not open new workflow: " + String((err as Error)?.message ?? err); draw();
            });
          }
        },
        h("option", { value: "", selected: true }, "workflow…"),
        ...([["Document", "document"], ["Define", "define"], ["Structure", "structure"], ["Verify", "verify"]] as const)
          .map(([label, id]) => h("option", { value: id }, label)))));
    const header = h("header", {}, n ? h("div", {}, h("b", {}, n.title), " ", tag(n.type + (n.subtype ? "/" + n.subtype : "")), " ", h("span", { class: "mut" }, n.id)) : h("div", { class: "mut" }, ix ? "No model note selected. Open a note in Obsidian and this view follows it." : loading),
      ix ? h("div", { class: "mut", style: "font-size:12px" }, `${ix.notes.size} notes · ${ix.edges.length} links · ` + (ix.parser === "passed" ? "SysML checked" : ix.parser === "failed" ? "SysML check failed" : "SysML not parser-checked")) : null,
      contextMode);
    const lenses = h("div", { class: "lenses" }, ...V.LENS_GROUPS.map((g) => {                       // D-0084: three menus
      const items = g.lenses.filter((k) => (k !== "edit" && k !== "merge") || !!host.edit).map((k) => [k, V.LENSES.find(([x]) => x === k)![1]] as const), here = g.lenses.includes(lens);
      return h("select", { "aria-label": `${g.label} menu`, title: g.id === "note" ? "Ways to see the selected note" : g.id === "model" ? "Ways to see the whole model" : "Tools for the canvas", class: here ? "cur" : "", onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value as V.Lens; if (!v) return; if (v === "merge") openMerge(""); else { lens = v; if (v === "edit") pinned = true; else editEl = null; draw(); } } },
        h("option", { value: "", selected: !here }, `${g.label} ▾`), ...items.map(([k, label]) => h("option", { value: k, selected: lens === k }, label)));
    }));
    // D-0143: one drop-down of the functions, grouped, in place of a column of icon buttons; what it opens is read below it
    const fnSelect = h("select", { "aria-label": "Workbench function", class: "fn", title: "Choose what to look at or do" },
      ...V.TOOLBAR_GROUPS.map((g) => h("optgroup", { label: g.label }, ...g.items.map((it) => { const off = !!it.needsEdit && !host.edit; return h("option", { value: it.lens, selected: lens === it.lens, disabled: off || undefined }, off ? `${it.label} (not available here)` : it.label); }))));
    fnSelect.addEventListener("change", () => {
      const v = (fnSelect as HTMLSelectElement).value as V.Lens;
      if (v === "merge") { openMerge(""); return; }
      const area = lensArea(v) ?? workArea;
      workArea = area; lens = v; if (v === "edit") pinned = true; else editEl = null; draw();
    });
    // UX pass 08R: Document / Define / Structure / Verify are the four work areas.
    // Review is contextual; the importer stays external and publishing remains under Document.
    const lensArea = (v: V.Lens): typeof workArea | null => {
      if (v === "review") return null;
      // Discovery and canvas utilities are cross-workflow; they must not reset an active work-area filter.
      if (["common", "pick", "terms", "similar", "layout", "compare"].includes(v)) return workArea;
      // Requirements is shared: Define edits intent; Verify initially examines verification coverage.
      if (v === "requirements" && workArea === "verify") return "verify";
      if (["structure", "internal", "keywords", "compare", "merge", "layout"].includes(v)) return "structure";
      if (["functional", "states", "design", "requirements", "edit"].includes(v)) return "define";
      return "document";
    };
    // Align the active work area when an existing advanced function is chosen.
    // The Review lens retains the prior work area so returning is predictable.
    if (lens !== "review") workArea = lensArea(lens)!;
    const goArea = (area: typeof workArea, next: V.Lens): void => {
      if (area === workArea && next === lens) return;
      workArea = area;
      lens = next;
      if (next === "edit") pinned = true; else editEl = null;
      draw();
    };
    const workareas = h("nav", { class: "workareas", "aria-label": "MDSE work areas" },
      ...([["Document", "document", WORKFLOW_ENTRY_LENS.document], ["Define", "define", WORKFLOW_ENTRY_LENS.define], ["Structure", "structure", WORKFLOW_ENTRY_LENS.structure], ["Verify", "verify", WORKFLOW_ENTRY_LENS.verify]] as const)
        .map(([label, id, next]) => h("button", {
          type: "button", "aria-pressed": workArea === id ? "true" : "false",
          title: id === "verify" ? "Requirements verification trace; test plans and execution are not yet implemented" : undefined,
          onclick: () => goArea(id, next)
        }, label)),
      h("button", { type: "button", class: "review", "aria-label": "Review findings for current work",
        "aria-pressed": lens === "review" ? "true" : "false", onclick: () => {
          if (lens === "review") lens = reviewReturn;
          else { reviewReturn = lens; lens = "review"; }
          draw();
        } }, lens === "review" ? "Back from Review" : "Review"));
    if (host.quickCreate) {
      const available = QC.quickTemplatesFor(workArea);
      const menu = h("select", { "aria-label": "New item from workflow template",
        title: "Create a note using a workflow-specific template. Governed model records require UID, ID and a preview; ordinary Markdown notes do not.",
        onchange: (e: Event) => {
          const pick = e.target as HTMLSelectElement, id = pick.value; pick.value = "";
          if (!id) return;
          void host.quickCreate!(id, sel).then((result) => { if (result) { msg = result; draw(); } },
            (err) => { msg = "Could not start New: " + String((err as Error)?.message ?? err); draw(); });
        } },
        h("option", { value: "", selected: true }, "+ New…"),
        ...available.map((t) => h("option", { value: t.id }, t.label + (t.kind === "plain" ? " (Markdown)" : " (model)"))));
      workareas.append(menu);
    }
    // Reuse the existing ranked model-note search for this first navigation increment.
    // Full search unification, structured result metadata and performance tests remain separate passes.
    const searchInput = h("input", { type: "search", "aria-label": "Search engineering information",
      placeholder: "Search names, aliases, IDs, part numbers or note text…", value: searchText,
      oninput: (e: Event) => {
        const inp = e.target as HTMLInputElement, pos = inp.selectionStart;
        searchText = inp.value;
        draw();
        const next = wrap.querySelector(".globalsearch input") as HTMLInputElement | null;
        next?.focus(); if (pos !== null) next?.setSelectionRange(pos, pos);
      }
    });
    const searchBox = h("div", { class: "globalsearch" }, searchInput);
    if (ix && searchText.trim()) {
      const found = V.search(ix, searchText, 21), limited = found.slice(0, 20);
      const hits = h("div", { class: "searchhits", role: "group", "aria-label": "Search matches" },
        ...limited.map((hit) => h("button", { type: "button",
          onclick: () => {
            sel = hit.path; searchText = ""; workArea = "document"; lens = "note"; editEl = null;
            host.openNote(hit.path); draw();
          }
        }, hit.title, h("small", {}, [hit.id, hit.type, String(hit.meta.partNumber ?? "")].filter(Boolean).join(" · ")))));
      if (!limited.length) hits.append(h("div", { class: "mut", style: "padding:7px" }, "No matching model notes."));
      if (found.length > limited.length) hits.append(h("div", { class: "mut", style: "padding:7px" }, "More matches exist; refine the search."));
      searchBox.append(hits);
    }
    const toolbar = h("div", { class: "fnrow" }, fnSelect);
    const acts = h("div", { class: "acts" });
    if (compact && ix) {
      // A direct, all-relationships canvas launcher on the Workbench home screen.
      // "tables" deliberately selects the Everything profile: all relationship kinds,
      // incoming and outgoing, rather than the current lens's restricted trace.
      const allProfile = V.PROFILES.find((p) => p.name === "Everything")!;
      const allDepth = Math.max(1, Number(spec.depth ?? allProfile.depth) || allProfile.depth);
      const allControls = h("div", { class: "chips", style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" },
        h("label", {}, "Connections away ", h("input", {
          type: "number", min: 1, value: allDepth, "aria-label": "All connections canvas depth",
          style: "width:54px", onchange: (e: Event) => {
            spec = { ...spec, depth: Math.max(1, Number((e.target as HTMLInputElement).value) || allProfile.depth) };
            draw();
          }
        })),
        h("button", { class: "sm pri", disabled: !n || undefined, onclick: (e: Event) => {
          const b = e.currentTarget as HTMLElement;
          busy(b, "Creating…", () => host.openCanvas("tables", {
            ...spec, depth: Math.max(1, Number(spec.depth ?? allProfile.depth) || allProfile.depth),
            kinds: [] // Empty = all kinds in the Everything profile.
          }));
        } }, "All connections canvas"));
      acts.append(allControls);
      if (host.discoverRelated && n) {
        const active = !!host.discoveryActive?.();
        const sources = canvasSel.length >= 2 ? [...new Set(canvasSel)] : [n.path];
        const b = h("button", {
          class: "sm pri", "aria-pressed": active ? "true" : "false",
          title: active ? "Stop live discovery; remove temporary candidates while keeping retained notes" : "Discover direct modeled neighbors on a scratch Canvas"
        }, active ? "Stop discovering" : "Discover neighbors");
        b.addEventListener("click", () => busy(b, active ? "Stopping…" : "Discovering…", () =>
          active && host.stopDiscovery ? host.stopDiscovery() : host.discoverRelated!(sources, { workflow: workArea, all: discoveryAll })));
        acts.append(b, h("label", { class: "sm", title: "Ignore workflow relationship filters and discover every resolved relationship kind" },
          h("input", { type: "checkbox", "aria-label": "All relationships", checked: discoveryAll, disabled: active || undefined,
            onchange: (e: Event) => { discoveryAll = (e.target as HTMLInputElement).checked; draw(); } }), " All relationships"));
      }
      if (host.hasPreview?.()) {
        for (const [label, action] of [["Keep selected", host.keepSelectedDiscovery], ["Dismiss selected", host.dismissSelectedDiscovery]] as const) {
          if (!action) continue;
          const b = h("button", { class: "sm", title: "Select candidate cards in the scratch Canvas first" }, label);
          b.addEventListener("click", () => busy(b, "Updating…", () => action()));
          acts.append(b);
        }
      }
      // Tables render in the persistent Workbench, not in new editor tabs.
      if (V.lensHasCanvas(lens)) { const b = h("button", { class: "sm pri", disabled: !n || (lens === "compare" && !cmpOther) || undefined }, lens === "compare" ? "Canvas of unique parts" : "Canvas in main window"); b.addEventListener("click", () => busy(b, "Creating…", () => host.openCanvas(lens, lens === "internal" ? ({ ...spec, inherit } as Partial<V.ViewSpec>) : lens === "compare" ? ({ ...spec, other: cmpOther } as Partial<V.ViewSpec>) : spec))); acts.append(b); }
      if (host.saveCanvas && host.hasPreview?.()) { const b = h("button", { class: "sm" }, "Save canvas…"); b.addEventListener("click", () => busy(b, "Saving…", () => host.saveCanvas!())); acts.append(b); }
    }
    const status = msg ? h("div", { class: "msg" }, msg, undo ? h("button", { class: "sm", style: "margin-left:8px", onclick: async () => { const u = undo!; undo = null; try { msg = await u(); markEditStale(); } catch (e) { msg = "Undo failed: " + String((e as Error)?.message ?? e); } draw(); } }, "Undo") : null) : null;
    if (ix && (lens === "note" || ADDABLE.has(lens)) && host.canvasIncluded) loadIncluded(lens + "|" + sel);
    const body = h("div", { class: "body" });
    if (!ix) body.append(empty(loading));
    else try {
      if (compact && V.lensHasCanvas(lens) && n) body.append(canvasSettings());
      const bar = scopeBar(); if (bar) body.append(bar);
      if (lens !== "dashboard" && lens !== "edit") body.append(h("div", { class: "secbar", style: "display:flex;gap:6px;justify-content:flex-end" }, h("button", { class: "sm", onclick: () => wrap.querySelectorAll("details.sec").forEach((d) => { (d as HTMLDetailsElement).open = false; }) }, "Collapse all"), h("button", { class: "sm", onclick: () => wrap.querySelectorAll("details.sec").forEach((d) => { (d as HTMLDetailsElement).open = true; }) }, "Expand all")));
      if (lens === "dashboard") body.append(dashboardView());
      else if (lens === "note") body.append(noteView());
      else if (lens === "review") body.append(reviewView());
      else if (lens === "keywords") body.append(keywordsView());
      else if (lens === "pick") body.append(pickView());
      else if (lens === "terms") body.append(termsView());
      else if (lens === "common") body.append(commonView());
      else if (lens === "layout") body.append(layoutView());
      else if (lens === "similar") body.append(similarView());
      else if (lens === "edit" && host.edit) { if (!editEl || editSel !== sel) { editSel = sel; editEl = editView({ getIx: () => ix!, getSel: () => sel, host: host.edit, done: (m, u) => { msg = m; undo = u; editEl = null; draw(); }, open: (p) => host.openNote(p) }); } body.append(editEl); }
      else {
        const key = lens + "|" + sel; if (key !== tickKey) { tickKey = key; }
        const ts = V.lensTables(ix, lens, sel, { scope, table, text, tree, other: cmpOther, inherit }), canAdd = ADDABLE.has(lens), ab = canAdd ? addBar(ts) : null;
        if (ab) body.append(ab); else tickCount = null;
        if (lens === "compare" && n) body.append(compareBar());
        for (const t of ts) body.append(tableView(t, canAdd));
      }
    } catch (e) { body.append(h("div", { class: "callout flagConflict" }, h("b", {}, "This view failed to draw"), String((e as Error)?.message ?? e))); console.error(e); }
    if (compact) { wrap.classList.remove("tb"); wrap.replaceChildren(header, workareas, searchBox, toolbar, acts, ...(status ? [status] : []), body); }
    else wrap.replaceChildren(header, searchBox, lenses, ...(status ? [status] : []), body);
  }
  draw();

  return {
    setIndex(i, l = "") { if (i !== ix) { termCatalog = null; termSource = null; termBuilding = null; termProgress = 0; termCommon = []; termTypes = []; } ix = i; loading = l || (i ? "" : "Reading notes…"); if (ix && sel && !ix.notes.has(sel)) sel = ""; if (!ix) editEl = null; if (lens === "edit" && editEl && ix) { editRefresh(editEl); return; } draw(); },
    editRelationship(ref) { openEditor(ref); },
    select(p) { const next = followSelection(ix, sel, p, pinned, lens === "edit"); if (next === sel) return; sel = next; draw(); },
    setCanvasSelection(paths) {
      if (pinned || lens === "edit") return; // Pinned or editing views are independent of Canvas selection.
      const same = paths.length === canvasSel.length && paths.every((p, i) => p === canvasSel[i]); canvasSel = paths; if (same) return;
      if (paths.length === 1) { if (lens === "common") lens = "note"; sel = followSelection(ix, sel, paths[0]!, pinned, false); }
      else if (paths.length >= 2) lens = "common";
      editEl = lens === "edit" ? editEl : null; draw();
    },
    setLens(l) { lens = l; if (l === "edit") pinned = true; editEl = null; draw(); },
    setWorkflow(area, nextLens, selected) {
      workArea = area; lens = nextLens; if (selected) sel = selected;
      if (nextLens === "edit") pinned = true;
      editEl = null; draw();
    },
    area: () => workArea,
    isPinned: () => pinned,
    setPinned: (next) => setContextPinned(next),
    refresh() { draw(); },
    reloadCanvasIncluded() { if (ix && (lens === "note" || ADDABLE.has(lens))) loadIncluded(lens + "|" + sel, true); },
    lens: () => lens, selected: () => sel,
    destroy() { termDestroyed = true; termBuilding = null; termCatalog = null; wrap.remove(); style.remove(); },
  };
}
