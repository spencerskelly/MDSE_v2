/* Obsidian shell. Everything of substance is in panel.ts / views.ts / index.ts / canvas.ts; this file supplies the vault's
 * files, the one shared index, selection following, the main-window views and the few writes.
 *
 * - The Workbench lives in the RIGHT sidebar and follows the note that is open. Obsidian's own file explorer is the browser.
 * - Tables and canvases open in the MAIN window for the selected note and lens.
 * - A canvas preview is one scratch file in 99_System/22_Views, overwritten by every preview and deleted when the plugin
 *   loads or unloads; a canvas is kept only when the person saves it (D-0022, D-0023).
 * - The only edits to model notes are the two Review actions, each a click by the person, each undoable: set an Issue's
 *   `status`, or resolve (remove) one flag in the user zone (D-0025). */
declare const require: (id: string) => any;
declare const CLASSES: any;
declare const MDSE: any;
declare const WB: {
  mountPanel: (root: HTMLElement, host: unknown, opt: { mode: "panel" | "main"; lens?: string }) => any;
  buildIndexAsync: (files: Map<string, string>, o: unknown) => Promise<any>;
  toCanvas: (ix: any, start: string, profile: any, spec?: unknown) => any;
  addToCanvas: (doc: any, ix: any, anchor: string | null, paths: string[], o?: { relations?: boolean }) => { doc: any; added: number; present: number; lineIds: string[] };
  cardNotePath: (node: any) => string | null;
  structureCanvas: (ix: any, path: string, mode: "direct" | "full") => any;
  addChildren: (doc: any, ix: any, parent: string, paths: string[], o?: { relations?: boolean }) => { doc: any; added: number; present: number; lineIds: string[] };
  autoLayout: (doc: any, ix: any) => { doc: any; moved: number; kept: number };
  pickCanvas: (ix: any, paths: string[], o: { relations: boolean; label: string; group: boolean }) => any;
  PREVIEW_DIR: string; PREVIEW_PATH: string; SAVED_DIR: string;
  edAuthor: (yaml: string) => string; edgeRefOfId: (id: string) => any;
  cdEdgeIds: (doc: any) => Set<string>; cdDrawnLines: (doc: any, known: Set<string>) => Array<{ id: string; from: string | null; to: string | null }>;
  cdChoices: (ix: any, files: Map<string, string>, from: string, to: string) => Array<{ rel: { id: string; label: string; help: string; inputs: string[] }; ok: boolean; usageKind: string }>;
  cdWhyNot: (ix: any, files: Map<string, string>, from: string, to: string) => string; cdOtherWay: (ix: any, files: Map<string, string>, from: string, to: string) => string[]; cdDropLine: (text: string, id: string) => string | null; cdLabelLine: (text: string, id: string, label: string) => string | null;
  planAddRelationship: (ix: any, files: Map<string, string>, o: any) => any; edDiff: (before: string | null, after: string) => { removed: string[]; added: string[] };
  PROFILES: Array<{ name: string; description: string }>; LENSES: Array<[string, string]>; LENS_PROFILE: Record<string, string>; lensHasCanvas: (l: string) => boolean;
};
const obsidian = require("obsidian");
const PANEL = "mdse-panel", TABLE = "mdse-table", OLD_VIEW = "mdse-workbench";
const PARSER_REPORT = "99_System/11_Import/Parser Check.md";
const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

async function readVault(app: any, onProgress?: (d: number, t: number) => void): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const list = app.vault.getMarkdownFiles();
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async (f: any) => { files.set(f.path, await app.vault.cachedRead(f)); }));
    onProgress?.(Math.min(i + 50, list.length), list.length);
    await tick();
  }
  const pc = app.vault.getAbstractFileByPath(PARSER_REPORT);
  if (pc) files.set(pc.path, await app.vault.cachedRead(pc));
  return files;
}

/** A leaf in the main editor area (not a sidebar), whichever pane has focus now. */
function mainLeaf(app: any): any {
  const recent = app.workspace.getMostRecentLeaf?.(app.workspace.rootSplit);
  if (recent) app.workspace.setActiveLeaf?.(recent, { focus: false });
  return app.workspace.getLeaf("tab");
}

const ensureFolder = async (app: any, dir: string): Promise<void> => {
  let at = "";
  for (const part of dir.split("/").filter(Boolean)) { at = at ? `${at}/${part}` : part; if (!app.vault.getAbstractFileByPath(at)) await app.vault.createFolder(at); }
};
const parseDoc = (text: string): any => { try { const d = JSON.parse(text); return { nodes: d.nodes ?? [], edges: d.edges ?? [], ...d }; } catch { return { nodes: [], edges: [] }; } };
const removePreview = async (app: any): Promise<void> => { const f = app.vault.getAbstractFileByPath(WB.PREVIEW_PATH); if (f) await app.vault.delete(f); };

/** Writes the preview (one scratch file, overwritten each time) and shows it in the main window. Nothing is kept until the person saves. */
async function writePreview(plugin: any, r: { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number }): Promise<string> {
  const app = plugin.app, path = WB.PREVIEW_PATH;
  await ensureFolder(app, path.slice(0, path.lastIndexOf("/")));
  const text = JSON.stringify(r.doc, null, 2);
  let file = app.vault.getAbstractFileByPath(path);
  if (file) await app.vault.modify(file, text); else file = await app.vault.create(path, text);
  plugin.preview = { fileName: r.fileName, edgeIds: WB.cdEdgeIds(r.doc) };       // lines the Workbench drew; any other line on the canvas was drawn by the person
  const open = app.workspace.getLeavesOfType("canvas").find((l: any) => l.view?.file?.path === path);
  if (open) app.workspace.revealLeaf(open); else await mainLeaf(app).openFile(file);
  return `Canvas preview opened in the main window, not saved (${r.notes} notes${r.groups ? `, ${r.groups} groups` : ""}${r.unresolved ? `, ${r.unresolved} not in vault` : ""}${r.capped ? ", capped" : ""}). Use Save canvas to keep it.`;
}

/** Copies the preview as it is now (including any rearranging the person did) into the chosen folder, never overwriting. */
async function savePreview(plugin: any, folder: string): Promise<string> {
  const app = plugin.app, src = app.vault.getAbstractFileByPath(WB.PREVIEW_PATH);
  if (!src || !plugin.preview) throw new Error("No preview to save. Open a canvas preview first.");
  await ensureFolder(app, folder);
  const base = plugin.preview.fileName.replace(/\.canvas$/, "");
  let path = `${folder}/${base}.canvas`;
  for (let i = 2; app.vault.getAbstractFileByPath(path); i++) path = `${folder}/${base} (${i}).canvas`;
  const saved = await app.vault.create(path, await app.vault.read(src));
  plugin.settings.lastFolder = folder; await plugin.saveSettings();
  await mainLeaf(app).openFile(saved);
  return `Saved to ${path}`;
}

class PickModal extends obsidian.FuzzySuggestModal<any> {
  items: any[]; label: (x: any) => string; onPick: (x: any) => void;
  constructor(app: any, placeholder: string, items: any[], label: (x: any) => string, onPick: (x: any) => void) { super(app); this.items = items; this.label = label; this.onPick = onPick; this.setPlaceholder(placeholder); }
  getItems() { return this.items; }
  getItemText(x: any) { return this.label(x); }
  onChooseItem(x: any) { this.onPick(x); }
}

/** The dropdown a drawn canvas line opens (D-0043): the relationship kinds the two notes allow, the inputs that kind takes, and the diff. Closing without Apply cancels. */
class RelateModal extends obsidian.Modal {
  plugin: any; line: { from: string; to: string }; settle: (r: { plan: any; label: string } | null) => void; result: { plan: any; label: string } | null = null;
  constructor(app: any, plugin: any, line: { from: string; to: string }, settle: (r: { plan: any; label: string } | null) => void) { super(app); this.plugin = plugin; this.line = line; this.settle = settle; }
  onOpen() {
    const p = this.plugin, ix = p.ix, { from, to } = this.line, el = this.contentEl;
    const choices = WB.cdChoices(ix, p.files, from, to).filter((c) => c.ok);
    const st = { rel: choices[0]!.rel.id, name: "", mult: "", dir: "" };
    const cur = () => choices.find((c) => c.rel.id === st.rel)!;
    el.empty();
    el.createEl("h3", { text: "New relationship" });
    el.createEl("p", { text: `${ix.notes.get(from).title}  →  ${ix.notes.get(to).title}` });
    const other = WB.cdOtherWay(ix, p.files, from, to);
    if (other.length) el.createEl("p", { cls: "setting-item-description", text: `Drawn the other way, this line could be: ${other.join("; ")}. Cancel and draw it from the other card if that is what you meant.` });
    new obsidian.Setting(el).setName("Relationship").setDesc("Only the kinds these two notes allow are listed.").addDropdown((d: any) => {
      for (const c of choices) d.addOption(c.rel.id, c.rel.label);
      d.setValue(st.rel).onChange((v: string) => { st.rel = v; st.name = ""; st.mult = ""; st.dir = ""; inputs(); show(); });
    });
    const help = el.createEl("p", { cls: "setting-item-description" }), box = el.createDiv(), pre = el.createEl("pre"), bar = el.createDiv({ cls: "modal-button-container" });
    pre.style.whiteSpace = "pre-wrap"; pre.style.maxHeight = "14em"; pre.style.overflow = "auto";
    const apply = bar.createEl("button", { text: "Apply", cls: "mod-cta" }), cancel = bar.createEl("button", { text: "Cancel" });
    let plan: any = null;
    const inputs = () => {
      box.empty(); const c = cur(); help.setText(c.rel.help);
      if (c.rel.inputs.includes("name")) new obsidian.Setting(box).setName("Name").setDesc("Optional. Blank takes the target's name.").addText((t: any) => t.setValue(st.name).onChange((v: string) => { st.name = v; show(); }));
      if (c.rel.inputs.includes("mult")) new obsidian.Setting(box).setName("Quantity").setDesc("Optional, like 4 or 0..1 or 1..*.").addText((t: any) => t.setValue(st.mult).onChange((v: string) => { st.mult = v; show(); }));
      if (c.rel.inputs.includes("dir") && c.usageKind === "item") new obsidian.Setting(box).setName("Direction").addDropdown((d: any) => { d.addOption("", "none"); for (const x of ["in", "out", "inout"]) d.addOption(x, x); d.setValue(st.dir).onChange((v: string) => { st.dir = v; show(); }); });
    };
    const show = () => {
      plan = WB.planAddRelationship(ix, p.files, { rel: st.rel, from, to, name: st.name, mult: st.mult, usageKind: cur().usageKind, dir: st.dir });
      const w = plan.writes[0];
      if (plan.problems.length || !w) { pre.setText(plan.problems[0] ?? "Nothing to write."); apply.disabled = true; return; }
      const d = WB.edDiff(w.before, w.after);
      pre.setText([`${w.path}`, ...d.removed.map((l: string) => `- ${l}`), ...d.added.map((l: string) => `+ ${l}`)].join("\n")); apply.disabled = false;
    };
    apply.onclick = () => { if (plan && !plan.problems.length) { this.result = { plan, label: cur().rel.label }; this.close(); } };
    cancel.onclick = () => this.close();
    inputs(); show();
  }
  onClose() { this.contentEl.empty(); this.settle(this.result); }
}

class MdseSettingTab extends obsidian.PluginSettingTab {
  plugin: any;
  constructor(app: any, plugin: any) { super(app, plugin); this.plugin = plugin; }
  display() {
    this.containerEl.empty();
    new obsidian.Setting(this.containerEl).setName("Default folder for saved canvases").setDesc("Canvas previews are never kept automatically. Save canvas offers this folder first, then your recent and project folders.")
      .addText((t: any) => t.setPlaceholder(WB.SAVED_DIR).setValue(this.plugin.settings.defaultFolder).onChange(async (v: string) => { this.plugin.settings.defaultFolder = v.trim().replace(/\/+$/, "") || WB.SAVED_DIR; await this.plugin.saveSettings(); }));
  }
}

/** Host callbacks shared by the panel (right) and the table view (main). */
function hostFor(plugin: any): any {
  return {
    openNote: (p: string) => plugin.app.workspace.openLinkText(p, "", false),
    openTable: (lens: string) => plugin.openTable(lens),
    openCanvas: (lens: string, spec: unknown) => plugin.openCanvas(lens, spec),
    addToCanvas: (anchor: string, paths: string[]) => plugin.addToCanvasPreview(anchor, paths),
    openPickCanvas: (paths: string[], label: string, relations: boolean, group: boolean, replace: boolean) => plugin.openPickCanvas(paths, label, relations, group, replace),
    openStructureCanvas: (path: string, mode: "direct" | "full") => plugin.openStructureCanvas(path, mode),
    autoLayout: () => plugin.autoLayoutCanvas(),
    addChildren: (parent: string, paths: string[]) => plugin.addToCanvasPreview(parent, paths, true, false, parent),
    newCanvasFrom: (anchor: string, paths: string[]) => plugin.addToCanvasPreview(anchor, paths, true, true),
    saveCanvas: () => plugin.saveWithPicker(),
    hasPreview: () => !!plugin.preview,
    updateNote: (path: string, change: any) => plugin.updateNote(path, change),
    editRelationship: (ref: unknown) => plugin.editRelationship(ref),
    edit: {
      files: () => plugin.files,
      classes: () => CLASSES,
      author: () => plugin.author,
      folders: () => [...new Set<string>([...(plugin.ix?.notes?.values?.() ?? [])].map((n: any) => n.folder as string))].sort(),
      applyPlan: (plan: any) => plugin.applyPlan(plan),
    },
  };
}

class PanelView extends obsidian.ItemView {
  plugin: any; app_: any = null;
  constructor(leaf: any, plugin: any) { super(leaf); this.plugin = plugin; }
  getViewType() { return PANEL; }
  getDisplayText() { return "MDSE Workbench"; }
  getIcon() { return "network"; }
  async onOpen() {
    this.contentEl.empty(); this.contentEl.style.padding = "0"; this.contentEl.style.height = "100%";
    this.app_ = WB.mountPanel(this.contentEl, hostFor(this.plugin), { mode: "panel" });
    this.plugin.apps.add(this.app_);
    await this.plugin.ensureIndex();
    this.plugin.syncSelection();
  }
  async onClose() { this.plugin.apps.delete(this.app_); this.app_?.destroy(); }
}

class TableView extends obsidian.ItemView {
  plugin: any; app_: any = null; lens = "tables";
  constructor(leaf: any, plugin: any) { super(leaf); this.plugin = plugin; }
  getViewType() { return TABLE; }
  getDisplayText() { return "MDSE " + (WB.LENSES.find(([k]) => k === this.lens)?.[1] ?? "table"); }
  getIcon() { return "table"; }
  getState() { return { lens: this.lens }; }
  async setState(state: any, result: any) { if (state?.lens) { this.lens = state.lens; this.app_?.setLens(this.lens); } await super.setState?.(state, result); }
  async onOpen() {
    this.contentEl.empty(); this.contentEl.style.padding = "0"; this.contentEl.style.height = "100%";
    this.app_ = WB.mountPanel(this.contentEl, hostFor(this.plugin), { mode: "main", lens: this.lens });
    this.plugin.apps.add(this.app_);
    await this.plugin.ensureIndex();
    this.plugin.syncSelection();
  }
  async onClose() { this.plugin.apps.delete(this.app_); this.app_?.destroy(); }
}

module.exports = class MdseWorkbench extends obsidian.Plugin {
  files: Map<string, string> = new Map(); ix: any = null; building: Promise<void> | null = null; apps: Set<any> = new Set(); selected = ""; rebuildTimer: any = null;
  preview: { fileName: string; edgeIds: Set<string> } | null = null; settings: { defaultFolder: string; lastFolder: string } = { defaultFolder: "", lastFolder: "" };
  author = ""; drawTimer: any = null; drawBusy: Set<string> = new Set(); drawQueue: Promise<void> = Promise.resolve();

  /* ---- draw a line, get a relationship (D-0043) ---- */
  /** Changes the scratch canvas file; a line that is not found leaves it as it is. */
  async editPreview(fn: (text: string) => string | null): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(WB.PREVIEW_PATH);
    if (f) await this.app.vault.process(f, (t: string) => fn(t) ?? t);
  }
  /** The canvas file changed (Obsidian saves a moment after a line is drawn or a card is moved). Any line the Workbench did not draw is the person's. */
  previewChanged() {
    clearTimeout(this.drawTimer);
    this.drawTimer = setTimeout(async () => {
      const f = this.app.vault.getAbstractFileByPath(WB.PREVIEW_PATH);
      if (!f || !this.preview) return;
      let doc: any; try { doc = JSON.parse(await this.app.vault.read(f)); } catch { return; }
      for (const line of WB.cdDrawnLines(doc, this.preview.edgeIds)) {
        if (this.drawBusy.has(line.id)) continue;
        this.drawBusy.add(line.id);
        this.drawQueue = this.drawQueue.then(() => this.relateDrawnLine(line)).catch(() => {}).finally(() => { this.drawBusy.delete(line.id); });
      }
    }, 700);
  }
  async relateDrawnLine(line: { id: string; from: string | null; to: string | null }): Promise<void> {
    const drop = () => this.editPreview((t) => WB.cdDropLine(t, line.id)).catch(() => {});
    try {
      await this.ensureIndex();
      if (!line.from || !line.to) { new obsidian.Notice("MDSE: a relationship joins two notes. This line has a card that is not a note in the vault, so it was removed.", 8000); await drop(); return; }
      const why = WB.cdWhyNot(this.ix, this.files, line.from, line.to);
      if (why) { new obsidian.Notice("MDSE: " + why, 10000); await drop(); return; }
      const picked: { plan: any; label: string } | null = await new Promise((resolve) => new RelateModal(this.app, this, { from: line.from!, to: line.to! }, resolve).open());
      if (!picked) { await drop(); return; }
      const res = await this.applyPlan(picked.plan);
      this.preview?.edgeIds.add(line.id);
      await this.editPreview((t) => WB.cdLabelLine(t, line.id, picked.label));
      const frag = document.createDocumentFragment(), btn = document.createElement("button");
      btn.textContent = "Undo"; btn.style.marginLeft = "0.5em";
      btn.onclick = async () => { try { new obsidian.Notice("MDSE: " + (await res.undo())); this.preview?.edgeIds.delete(line.id); await drop(); } catch (e: any) { new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000); } };
      frag.append("MDSE: " + res.message + " ", btn);
      new obsidian.Notice(frag, 15000);
    } catch (e: any) { new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000); await drop(); }
  }
  /** Opens the Edit lens in the right panel on one relationship (from a main-window table or a canvas line). */
  async editRelationship(ref: unknown): Promise<void> {
    await this.openPanel(); await this.ensureIndex();
    this.apps.forEach((a: any) => a.editRelationship?.(ref));
  }
  /** Relationship refs for the lines selected on the open canvas (Obsidian's canvas keeps its selection on view.canvas). */
  canvasSelectionRefs(): any[] {
    const view = this.app.workspace.getActiveViewOfType?.(obsidian.ItemView) ?? this.app.workspace.activeLeaf?.view;
    const sel = view?.getViewType?.() === "canvas" ? view.canvas?.selection : null;
    const out: any[] = [];
    if (sel) for (const it of sel) { const r = it?.id ? WB.edgeRefOfId(String(it.id)) : null; if (r) out.push(r); }
    return out;
  }
  async saveSettings() { await this.saveData(this.settings); }

  /* ---- the one shared index ---- */
  ensureIndex(): Promise<void> {
    if (this.ix) return Promise.resolve();
    if (!this.building) {
      this.building = (async () => {
        const say = (m: string) => this.apps.forEach((a: any) => a.setIndex(null, m));
        this.files = await readVault(this.app, (d, t) => say(`Reading notes… ${d}/${t}`));
        try { this.author = WB.edAuthor(await this.app.vault.adapter.read(".vault.yaml")); } catch { this.author = ""; }
        await this.rebuild();
      })().finally(() => { this.building = null; });
    }
    return this.building;
  }
  async rebuild() {
    const pr = this.files.get(PARSER_REPORT);
    this.ix = await WB.buildIndexAsync(this.files, { classes: CLASSES, ...(pr ? { parserReport: pr } : {}), yieldEvery: 300, yieldFn: tick });
    this.apps.forEach((a: any) => a.setIndex(this.ix));
    this.syncSelection();
  }
  laterRebuild(ms = 1500) { clearTimeout(this.rebuildTimer); if (this.ix) this.rebuildTimer = setTimeout(() => this.rebuild(), ms); }
  async track(path: string, file: any) {
    if (!this.ix || !/\.md$/i.test(path) || path.startsWith("99_System/22_Views") ) return;
    if (file) this.files.set(path, await this.app.vault.cachedRead(file)); else this.files.delete(path);
    this.laterRebuild();
  }

  /* ---- selection follows the open note ---- */
  syncSelection() {
    const f = this.app.workspace.getActiveFile?.();
    if (f && f.extension === "md" && this.ix?.notes.has(f.path)) this.selected = f.path;
    if (this.selected) this.apps.forEach((a: any) => a.select(this.selected));
  }
  /** D-0082, D-0084: the note cards chosen on a canvas. Obsidian has no event for it, so the chosen cards are read from the canvas's own `selection` (an undocumented internal) every 300 ms while a canvas has been in front, and after a click or key press.
   *  The canvas stays the source when the Workbench panel is clicked: the last canvas that was in front is the one read. One card selects that note; two or more are handed to the panel's Common related lens. */
  canvasLeaf: any = null; canvasKey = "";
  canvasSelection() {
    const act = this.app.workspace.activeLeaf ?? this.app.workspace.getMostRecentLeaf?.();
    if (act?.view?.getViewType?.() === "canvas") this.canvasLeaf = act;
    const leaf = this.canvasLeaf, view = leaf?.view; if (!view || view.getViewType?.() !== "canvas" || !view.canvas || (view.containerEl && !view.containerEl.isConnected)) return;
    const sel = view.canvas.selection; if (!sel) return;
    const paths: string[] = [];
    for (const node of sel) {
      let data: any; try { data = node?.getData?.() ?? node?.unknownData ?? node; } catch { continue; }
      const p = WB.cardNotePath({ type: data?.type, file: typeof data?.file === "string" ? data.file : data?.file?.path, text: data?.text });
      if (p && this.ix?.notes.has(p) && !paths.includes(p)) paths.push(p);
    }
    const key = paths.join("\n"); if (key === this.canvasKey) return; this.canvasKey = key;
    if (!paths.length) { this.apps.forEach((a: any) => a.setCanvasSelection?.([])); return; }
    this.selected = paths[0]!; this.apps.forEach((a: any) => { a.setCanvasSelection?.(paths); });
  }
  onFileOpen(f: any) { if (f && f.extension === "md" && this.ix?.notes.has(f.path)) { this.selected = f.path; this.apps.forEach((a: any) => a.select(f.path)); } }

  /* ---- views ---- */
  async openPanel() {
    let leaf = this.app.workspace.getLeavesOfType(PANEL)[0];
    if (!leaf) { leaf = this.app.workspace.getRightLeaf(false); await leaf.setViewState({ type: PANEL, active: true }); }
    this.app.workspace.revealLeaf(leaf);
  }
  async openTable(lens: string) {
    await this.ensureIndex();
    let leaf = this.app.workspace.getLeavesOfType(TABLE)[0];
    if (!leaf) leaf = mainLeaf(this.app);
    await leaf.setViewState({ type: TABLE, state: { lens }, active: true });
    this.app.workspace.revealLeaf(leaf);
    this.syncSelection();
  }
  async openCanvas(lens: string, spec: unknown): Promise<string> {
    await this.ensureIndex();
    if (!this.selected || !this.ix.notes.has(this.selected)) throw new Error("Open a model note first.");
    const prof = WB.PROFILES.find((p) => p.name === WB.LENS_PROFILE[lens]);
    if (!prof) throw new Error("No canvas for this view.");
    return writePreview(this, WB.toCanvas(this.ix, this.selected, prof, spec));
  }

  /** D-0089: the canvas the person has open in the main window: the last canvas that was in front, else the preview. */
  canvasTarget(): { path: string; leaf: any } | null {
    const act = this.app.workspace.activeLeaf ?? this.app.workspace.getMostRecentLeaf?.();
    if (act?.view?.getViewType?.() === "canvas") this.canvasLeaf = act;
    const leaf = this.canvasLeaf, v = leaf?.view, path: string | undefined = v?.file?.path;
    if (path && v.getViewType?.() === "canvas" && (!v.containerEl || v.containerEl.isConnected) && this.app.vault.getAbstractFileByPath(path)) return { path, leaf };
    const open = this.app.workspace.getLeavesOfType("canvas").find((l: any) => l.view?.file?.path === WB.PREVIEW_PATH);
    return open && this.preview ? { path: WB.PREVIEW_PATH, leaf: open } : null;
  }
  /** Changes a canvas file; an open canvas is saved first so a card the person just moved is not lost. */
  async editTarget(t: { path: string; leaf: any }, fn: (text: string) => string | null): Promise<void> {
    try { await t.leaf?.view?.save?.(); } catch { /* an older canvas view without save */ }
    const f = this.app.vault.getAbstractFileByPath(t.path);
    if (f) await this.app.vault.process(f, (x: string) => fn(x) ?? x);
  }
  /** D-0089: apply the layout rules to the cards of the open canvas. */
  async autoLayoutCanvas(): Promise<string> {
    await this.ensureIndex();
    const t = this.canvasTarget(); if (!t) return "Open a canvas in the main window first.";
    let res: { moved: number; kept: number } | null = null;
    await this.editTarget(t, (text) => { const r = WB.autoLayout(parseDoc(text), this.ix); res = r; return r.moved ? JSON.stringify(r.doc, null, 2) : null; });
    const r = res as { moved: number; kept: number } | null;
    if (!r) return "Could not read that canvas.";
    this.app.workspace.revealLeaf(t.leaf);
    return r.moved ? `Laid out ${r.moved} card${r.moved === 1 ? "" : "s"} on ${t.path}${r.kept ? `; ${r.kept} other card${r.kept === 1 ? "" : "s"} (not notes) left where ${r.kept === 1 ? "it was" : "they were"}` : ""}.` : "Nothing moved: the cards already follow the layout rules.";
  }

  /** D-0088: a new canvas preview of one assembly: the note, its parent assemblies above, its direct parts or every layer of parts below. */
  async openStructureCanvas(path: string, mode: "direct" | "full"): Promise<string> {
    await this.ensureIndex();
    if (!this.ix.notes.has(path)) throw new Error("Select a note first.");
    return writePreview(this, WB.structureCanvas(this.ix, path, mode));
  }

  /** D-0083: with a preview open, the picked notes are added to it and nothing already there moves; `replace` (or no preview) starts a new one. */
  async openPickCanvas(paths: string[], label: string, relations: boolean, group: boolean, replace: boolean): Promise<string> {
    await this.ensureIndex();
    if (!replace && this.canvasTarget()) return this.addToCanvasPreview(null, paths, relations);
    return writePreview(this, WB.pickCanvas(this.ix, paths, { relations, label, group }));
  }

  /** D-0082: put notes on the canvas preview next to the selected note's card. With no preview open, the selected note and these make a new one. */
  async addToCanvasPreview(anchor: string | null, paths: string[], relations = true, replace = false, rowUnder: string | null = null): Promise<string> {
    await this.ensureIndex();
    const place = (doc: any) => rowUnder ? WB.addChildren(doc, this.ix, rowUnder, paths, { relations }) : WB.addToCanvas(doc, this.ix, anchor, paths, { relations });
    const target = replace ? null : this.canvasTarget();
    if (target && target.path !== WB.PREVIEW_PATH) {                                // D-0089: the canvas that is open in the main window, whichever file it is
      let res: { added: number; present: number } | null = null;
      await this.editTarget(target, (text) => { const r = place(parseDoc(text)); res = r; return r.added ? JSON.stringify(r.doc, null, 2) : null; });
      const r = res as { added: number; present: number } | null;
      if (!r) return "Could not read that canvas.";
      this.app.workspace.revealLeaf(target.leaf);
      return r.added ? `Added ${r.added} note${r.added === 1 ? "" : "s"} to ${target.path}${r.present ? ` (${r.present} already there)` : ""}. Nothing else on it moved.` : r.present ? "Those notes are already on the canvas." : "Nothing to add.";
    }
    const f = this.app.vault.getAbstractFileByPath(WB.PREVIEW_PATH);
    if (replace || !f || !this.preview) {                                                      // no preview yet: start one with the same placement rules (D-0085)
      const all = [...(anchor ? [anchor] : []), ...paths], r = rowUnder ? place({ nodes: [], edges: [] }) : WB.addToCanvas({ nodes: [], edges: [] }, this.ix, anchor, all, { relations });
      return writePreview(this, { doc: r.doc, fileName: `Canvas - ${(anchor ? this.ix.notes.get(anchor)?.title : "") || "picked notes"}.canvas`.replace(/[\\/:*?"<>|#^[\]]/g, " "), notes: r.added, unresolved: 0, capped: false, groups: 0 });
    }
    let res: { added: number; present: number } | null = null;
    await this.editPreview((text) => {
      const r = place(JSON.parse(text)); res = r;
      if (!r.added) return null;
      for (const id of r.lineIds) this.preview!.edgeIds.add(id);                 // lines the Workbench drew, so they are not mistaken for the person's
      return JSON.stringify(r.doc, null, 2);
    });
    const r = res as { added: number; present: number } | null;
    if (!r) return "Could not read the canvas preview.";
    const open = this.app.workspace.getLeavesOfType("canvas").find((l: any) => l.view?.file?.path === WB.PREVIEW_PATH); if (open) this.app.workspace.revealLeaf(open);
    return r.added ? `Added ${r.added} note${r.added === 1 ? "" : "s"} to the canvas preview${r.present ? ` (${r.present} already there)` : ""}. Not saved.` : r.present ? "Those notes are already on the canvas." : "Nothing to add.";
  }

  /* ---- saving a preview ---- */
  folderChoices(): string[] {
    const def = this.settings.defaultFolder || WB.SAVED_DIR, skip = (f: string) => f === "" || f === "/" || f.startsWith(".") || f === WB.PREVIEW_DIR || f.startsWith(WB.PREVIEW_DIR + "/");
    const all = this.app.vault.getAllLoadedFiles().filter((f: any) => f.children !== undefined).map((f: any) => String(f.path)).filter((f: string) => !skip(f)).sort();
    return [...new Set([def, ...(this.settings.lastFolder ? [this.settings.lastFolder] : []), ...all])];
  }
  saveWithPicker(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.preview) { reject(new Error("No preview to save. Open a canvas preview first.")); return; }
      let chosen = false;
      const m = new PickModal(this.app, "Save canvas in which folder?", this.folderChoices(), (f: string) => f, (f: string) => { chosen = true; savePreview(this, f).then(resolve, reject); });
      const close = m.onClose?.bind(m); m.onClose = () => { close?.(); setTimeout(() => { if (!chosen) resolve("Save cancelled. The preview is still open."); }, 150); };
      m.open();
    });
  }

  /* ---- Review actions (D-0025): the only edits to model notes ---- */
  async updateNote(path: string, change: any): Promise<{ message: string; undo: () => Promise<string> }> {
    const note = this.ix?.notes.get(path), file = this.app.vault.getAbstractFileByPath(path);
    if (!note || !file) throw new Error("That note is not in the index. Refresh and try again.");
    if (change.kind === "status" && note.type !== "Issue") throw new Error("Status can be changed here for Issue notes only.");
    if (change.kind !== "status" && change.kind !== "removeFlag") throw new Error("Unsupported change.");
    let before = "", after = "";
    await this.app.vault.process(file, (text: string) => {
      before = text;
      const r = change.kind === "status" ? MDSE.setFrontmatterField(text, "status", change.value) : MDSE.removeFlag(text, change.type, change.title, change.nth);
      if (!(r.changed ?? r.removed)) throw new Error(r.reason === "FLAG_NOT_FOUND" ? "That flag is no longer in the note." : r.reason ? `Not changed (${r.reason}).` : "Nothing to change.");
      after = r.text; return after;
    });
    this.files.set(path, after); this.laterRebuild(200);
    const undo = async (): Promise<string> => {
      await this.app.vault.process(file, (cur: string) => { if (cur !== after) throw new Error("The note changed since; not undone."); return before; });
      this.files.set(path, before); this.laterRebuild(200); return "Undone.";
    };
    return { message: change.kind === "status" ? `Set status of "${note.title}" to ${change.value}.` : `Resolved flag "${change.title}" in "${note.title}".`, undo };
  }

  /* ---- Edit lens (D-0030): apply a previewed plan; every file is checked against what the preview was built from ---- */
  async applyPlan(plan: { summary: string; writes: Array<{ path: string; before: string | null; after: string; remove?: boolean }>; problems: string[] }): Promise<{ message: string; undo: () => Promise<string> }> {
    if (plan.problems.length || !plan.writes.length) throw new Error(plan.problems[0] ?? "Nothing to write.");
    const done: Array<{ path: string; before: string | null; after: string; remove?: boolean }> = [];
    const back = async (): Promise<void> => {
      for (const w of done.reverse()) {
        if ((w as { remove?: boolean }).remove) { await restoreRemoved(w); continue; }
        const f = this.app.vault.getAbstractFileByPath(w.path);
        if (!f) continue;
        if (w.before === null) await this.app.vault.delete(f); else await this.app.vault.process(f, () => w.before);
        if (w.before === null) this.files.delete(w.path); else this.files.set(w.path, w.before);
      }
    };
    const restoreRemoved = async (w: { path: string; before: string | null }): Promise<void> => {          // a removed file comes back
      if (this.app.vault.getAbstractFileByPath(w.path)) return;
      await ensureFolder(this.app, w.path.includes("/") ? w.path.slice(0, w.path.lastIndexOf("/")) : "");
      await this.app.vault.create(w.path, w.before ?? ""); this.files.set(w.path, w.before ?? "");
    };
    try {
      for (const w of plan.writes) {
        if ((w as { remove?: boolean }).remove) {
          const f = this.app.vault.getAbstractFileByPath(w.path);
          if (!f) throw new Error(`${w.path} is gone. Preview again.`);
          if ((await this.app.vault.read(f)) !== w.before) throw new Error(`"${w.path}" changed since the preview. Preview again.`);
          await this.app.vault.delete(f); this.files.delete(w.path);
        } else if (w.before === null) {
          if (this.app.vault.getAbstractFileByPath(w.path)) throw new Error(`${w.path} already exists. Preview again.`);
          await ensureFolder(this.app, w.path.includes("/") ? w.path.slice(0, w.path.lastIndexOf("/")) : "");
          await this.app.vault.create(w.path, w.after);
        } else {
          const f = this.app.vault.getAbstractFileByPath(w.path);
          if (!f) throw new Error(`${w.path} is gone. Preview again.`);
          await this.app.vault.process(f, (cur: string) => { if (cur !== w.before) throw new Error(`"${w.path}" changed since the preview. Preview again.`); return w.after; });
        }
        if (!(w as { remove?: boolean }).remove) this.files.set(w.path, w.after);
        done.push(w);
      }
    } catch (e) { await back(); this.laterRebuild(200); throw e; }
    this.laterRebuild(200);
    const applied = [...done];
    const undo = async (): Promise<string> => {
      for (const w of applied) {
        const f = this.app.vault.getAbstractFileByPath(w.path);
        if ((w as { remove?: boolean }).remove) { if (f) throw new Error(`"${w.path}" exists again; not undone.`); continue; }
        if (!f) continue;
        const cur = await this.app.vault.read(f);
        if (cur !== w.after) throw new Error(`"${w.path}" changed since; not undone.`);
      }
      done.length = 0; done.push(...applied); await back(); this.laterRebuild(200); return "Undone.";
    };
    return { message: plan.summary, undo };
  }

  /* ---- lifecycle ---- */
  async onload() {
    const saved = (await this.loadData()) ?? {};
    this.settings = { defaultFolder: String(saved.defaultFolder || WB.SAVED_DIR), lastFolder: String(saved.lastFolder || "") };
    this.addSettingTab(new MdseSettingTab(this.app, this));
    this.registerView(PANEL, (leaf: any) => new PanelView(leaf, this));
    this.registerView(TABLE, (leaf: any) => new TableView(leaf, this));
    this.addRibbonIcon("network", "Open MDSE Workbench", () => this.openPanel());
    const noteOpen = (chk: boolean, fn: (f: any) => void): boolean => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) fn(f); return true; };
    const lensPick = (placeholder: string, only: (l: string) => boolean, fn: (l: string) => void) => new PickModal(this.app, placeholder, WB.LENSES.filter(([k]) => only(k)), (x: any) => x[1], (x: any) => fn(x[0])).open();
    this.addCommand({ id: "open", name: "Open MDSE Workbench (right panel)", callback: () => this.openPanel() });
    this.addCommand({ id: "edit-canvas-line", name: "Edit the relationship selected on the canvas", checkCallback: (chk: boolean) => {
      const refs = this.canvasSelectionRefs(); if (!refs.length) return false;
      if (!chk) { if (refs.length > 1) new obsidian.Notice("Several lines are selected; editing the first."); this.editRelationship(refs[0]); }
      return true;
    } });
    try { this.registerEvent(this.app.workspace.on("canvas:edge-menu", (menu: any, edge: any) => { const r = edge?.id ? WB.edgeRefOfId(String(edge.id)) : null; if (r) menu.addItem((i: any) => i.setTitle("Edit relationship (MDSE)").setIcon("pencil").onClick(() => this.editRelationship(r))); })); } catch { /* older Obsidian: the command still works */ }
    this.addCommand({ id: "refresh", name: "Refresh MDSE Workbench index", callback: async () => { this.files = await readVault(this.app); await this.rebuild(); } });
    this.addCommand({ id: "show-note", name: "Show current note in MDSE Workbench", checkCallback: (chk: boolean) => noteOpen(chk, async () => { await this.openPanel(); await this.ensureIndex(); this.syncSelection(); }) });
    this.addCommand({ id: "table", name: "Open MDSE table in main window…", callback: () => lensPick("Which table?", (k) => k !== "dashboard" && k !== "note", (l) => this.openTable(l)) });
    this.addCommand({ id: "canvas", name: "Preview canvas from current note", checkCallback: (chk: boolean) => noteOpen(chk, () => lensPick("Which view for the canvas?", WB.lensHasCanvas, (l) => this.openCanvas(l, {}).then((m) => new obsidian.Notice("MDSE: " + m, 8000), (e: any) => new obsidian.Notice("MDSE canvas failed: " + String(e?.message ?? e), 8000)))) });
    this.addCommand({ id: "save-canvas", name: "Save preview canvas…", checkCallback: (chk: boolean) => { if (!this.preview || !this.app.vault.getAbstractFileByPath(WB.PREVIEW_PATH)) return false; if (!chk) this.saveWithPicker().then((m) => new obsidian.Notice("MDSE: " + m), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)); return true; } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu: any, f: any) => {
      if (f?.extension !== "md") return;
      menu.addItem((i: any) => i.setTitle("Show in MDSE Workbench").setIcon("network").onClick(async () => { await this.openPanel(); await this.ensureIndex(); this.selected = f.path; this.apps.forEach((a: any) => a.select(f.path)); }));
      menu.addItem((i: any) => i.setTitle("Preview MDSE canvas").setIcon("layout-dashboard").onClick(() => { this.selected = f.path; lensPick("Which view for the canvas?", WB.lensHasCanvas, (l) => this.openCanvas(l, {}).then((m) => new obsidian.Notice("MDSE: " + m, 8000), (e: any) => new obsidian.Notice("MDSE canvas failed: " + String(e?.message ?? e), 8000))); }));
    }));
    this.registerEvent(this.app.workspace.on("file-open", (f: any) => this.onFileOpen(f)));
    for (const ev of ["pointerup", "keyup"]) this.registerDomEvent(document, ev, () => setTimeout(() => this.canvasSelection(), 60));
    this.registerInterval(window.setInterval(() => { try { this.canvasSelection(); } catch { /* a canvas internal that moved must never break the plugin */ } }, 300));
    this.registerEvent(this.app.vault.on("modify", (f: any) => { if (f?.path === WB.PREVIEW_PATH) this.previewChanged(); }));
    this.app.workspace.onLayoutReady(() => {
      removePreview(this.app).catch(() => {});                                  // a stale preview from an earlier session
      this.app.workspace.detachLeavesOfType?.(OLD_VIEW);                          // the pre-0.6 main-window view
      for (const [ev, fn] of [["modify", (f: any) => this.track(f.path, f)], ["create", (f: any) => this.track(f.path, f)], ["delete", (f: any) => this.track(f.path, null)], ["rename", (f: any, old: string) => { this.track(old, null); this.track(f.path, f); }]] as Array<[string, (f: any, o?: any) => void]>)
        this.registerEvent(this.app.vault.on(ev, fn));
    });
  }
  onunload() { clearTimeout(this.rebuildTimer); clearTimeout(this.drawTimer); removePreview(this.app).catch(() => {}); }
};
