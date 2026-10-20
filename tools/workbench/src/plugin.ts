/* Obsidian shell. Everything of substance is in ui.ts / views.ts / index.ts / canvas.ts; this file only supplies the vault's
 * files, the open-note action and the canvas writer. Startup does no model work until Obsidian's layout is ready, and
 * indexing yields to the UI. The Workbench never edits model notes; the only files it writes are generated canvases in
 * 99_System/12_Views, which can be deleted and regenerated at any time. */
declare const require: (id: string) => any;
declare const CLASSES: any;
declare const WB: { mountWorkbench: (root: HTMLElement, host: unknown) => any; buildIndexAsync: (files: Map<string, string>, o: unknown) => Promise<any>; toCanvas: (ix: any, start: string, profile: any) => any; CANVAS_DIR: string; PROFILES: Array<{ name: string; description: string }> };
const obsidian = require("obsidian");
const VIEW = "mdse-workbench";
const PARSER_REPORT = "99_System/11_Import/Parser Check.md";

async function readVault(app: any): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const list = app.vault.getMarkdownFiles();
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async (f: any) => { files.set(f.path, await app.vault.cachedRead(f)); }));
    await new Promise((r) => setTimeout(r, 0));
  }
  const pc = app.vault.getAbstractFileByPath(PARSER_REPORT);
  if (pc) files.set(pc.path, await app.vault.cachedRead(pc));
  return files;
}

/** Writes (or regenerates) a canvas under 99_System/12_Views and opens it. */
async function writeCanvas(app: any, r: { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean }): Promise<string> {
  const dir = WB.CANVAS_DIR, path = `${dir}/${r.fileName}`;
  let at = "";
  for (const part of dir.split("/")) { at = at ? `${at}/${part}` : part; if (!app.vault.getAbstractFileByPath(at)) await app.vault.createFolder(at); }
  const text = JSON.stringify(r.doc, null, 2);
  let file = app.vault.getAbstractFileByPath(path);
  if (file) await app.vault.modify(file, text); else file = await app.vault.create(path, text);
  await app.workspace.getLeaf("tab").openFile(file);
  return `Canvas opened (${r.notes} notes${r.unresolved ? `, ${r.unresolved} not in vault` : ""}${r.capped ? ", capped" : ""})`;
}

class ProfileModal extends obsidian.FuzzySuggestModal<any> {
  onPick: (name: string) => void;
  constructor(app: any, onPick: (name: string) => void) { super(app); this.onPick = onPick; this.setPlaceholder("Choose a view profile for the canvas"); }
  getItems() { return WB.PROFILES; }
  getItemText(p: any) { return `${p.name} — ${p.description}`; }
  onChooseItem(p: any) { this.onPick(p.name); }
}

class WorkbenchView extends obsidian.ItemView {
  plugin: any; app_: any = null; pendingSelect = "";
  constructor(leaf: any, plugin: any) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW; }
  getDisplayText() { return "MDSE Workbench"; }
  getIcon() { return "network"; }
  async onOpen() {
    this.contentEl.empty(); this.contentEl.style.padding = "0"; this.contentEl.style.height = "100%";
    this.app_ = WB.mountWorkbench(this.contentEl, {
      classes: CLASSES,
      openNote: (p: string) => this.app.workspace.openLinkText(p, "", false),
      makeCanvas: (r: any) => writeCanvas(this.app, r),
    });
    this.plugin.view = this;
    await this.refresh();
  }
  async onClose() { this.app_?.destroy(); this.plugin.view = null; }
  async refresh() {
    await this.app_.setFiles(await readVault(this.app));
    if (this.pendingSelect) { this.app_.select(this.pendingSelect); this.pendingSelect = ""; }
  }
  show(path: string) { if (this.app_?.index()) this.app_.select(path); else this.pendingSelect = path; }
}

module.exports = class MdseWorkbench extends obsidian.Plugin {
  view: any = null; timer: any = null;
  async onload() {
    this.registerView(VIEW, (leaf: any) => new WorkbenchView(leaf, this));
    this.addRibbonIcon("network", "Open MDSE Workbench", () => this.open());
    this.addCommand({ id: "open", name: "Open MDSE Workbench", callback: () => this.open() });
    this.addCommand({ id: "refresh", name: "Refresh MDSE Workbench index", callback: () => this.view?.refresh() });
    this.addCommand({ id: "show-note", name: "Show current note in MDSE Workbench", checkCallback: (chk: boolean) => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) this.open(f.path); return true; } });
    this.addCommand({ id: "canvas", name: "Create canvas from current note", checkCallback: (chk: boolean) => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) this.canvasFor(f.path); return true; } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu: any, f: any) => {
      if (f?.extension !== "md") return;
      menu.addItem((i: any) => i.setTitle("Show in MDSE Workbench").setIcon("network").onClick(() => this.open(f.path)));
      menu.addItem((i: any) => i.setTitle("Create MDSE canvas").setIcon("layout-dashboard").onClick(() => this.canvasFor(f.path)));
    }));
    const later = () => { if (!this.view) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.view?.refresh(), 3000); };
    this.app.workspace.onLayoutReady(() => { for (const ev of ["modify", "create", "delete", "rename"]) this.registerEvent(this.app.vault.on(ev, (f: any) => { if (!String(f?.path ?? "").startsWith(WB.CANVAS_DIR)) later(); })); });
  }
  async open(path = "") {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf("tab"); await leaf.setViewState({ type: VIEW, active: true }); }
    this.app.workspace.revealLeaf(leaf);
    if (path) leaf.view.show(path);
  }
  /** Canvas for a note: pick a profile, build an index (reusing the open view's when present), write and open. */
  canvasFor(path: string) {
    new ProfileModal(this.app, async (name: string) => {
      try {
        const ix = this.view?.app_?.index() ?? await WB.buildIndexAsync(await readVault(this.app), { classes: CLASSES });
        if (!ix.notes.has(path)) { new obsidian.Notice("MDSE: this note is not a governed model note."); return; }
        const prof = WB.PROFILES.find((p) => p.name === name)!;
        new obsidian.Notice("MDSE: " + await writeCanvas(this.app, WB.toCanvas(ix, path, prof)));
      } catch (e) { new obsidian.Notice("MDSE canvas failed: " + String((e as Error)?.message ?? e), 8000); console.error(e); }
    }).open();
  }
  onunload() { clearTimeout(this.timer); }
};
