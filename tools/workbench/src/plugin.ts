/* Obsidian shell. Everything of substance is in ui.ts / views.ts / index.ts / canvas.ts; this file only supplies the vault's
 * files, the open-note action and the canvas writer. Startup does no model work until Obsidian's layout is ready, and
 * indexing yields to the UI. The Workbench never edits model notes. A canvas preview is one scratch file that every preview
 * overwrites and that is deleted when the plugin loads or unloads; a canvas is kept only when the person saves it. */
declare const require: (id: string) => any;
declare const CLASSES: any;
declare const WB: { mountWorkbench: (root: HTMLElement, host: unknown) => any; buildIndexAsync: (files: Map<string, string>, o: unknown) => Promise<any>; toCanvas: (ix: any, start: string, profile: any) => any; CANVAS_DIR: string; PREVIEW_PATH: string; PROFILES: Array<{ name: string; description: string }> };
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

const ensureFolder = async (app: any, dir: string): Promise<void> => {
  let at = "";
  for (const part of dir.split("/").filter(Boolean)) { at = at ? `${at}/${part}` : part; if (!app.vault.getAbstractFileByPath(at)) await app.vault.createFolder(at); }
};
const removePreview = async (app: any): Promise<void> => { const f = app.vault.getAbstractFileByPath(WB.PREVIEW_PATH); if (f) await app.vault.delete(f); };

/** Writes the preview (one scratch file, overwritten each time) and shows it. Nothing is kept until the person saves. */
async function writePreview(plugin: any, r: { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number }): Promise<string> {
  const app = plugin.app, path = WB.PREVIEW_PATH;
  await ensureFolder(app, path.slice(0, path.lastIndexOf("/")));
  const text = JSON.stringify(r.doc, null, 2);
  let file = app.vault.getAbstractFileByPath(path);
  if (file) await app.vault.modify(file, text); else file = await app.vault.create(path, text);
  plugin.preview = { fileName: r.fileName };
  const open = app.workspace.getLeavesOfType("canvas").find((l: any) => l.view?.file?.path === path);
  if (open) app.workspace.revealLeaf(open); else await app.workspace.getLeaf("tab").openFile(file);
  return `Preview opened, not saved (${r.notes} notes${r.groups ? `, ${r.groups} groups` : ""}${r.unresolved ? `, ${r.unresolved} not in vault` : ""}${r.capped ? ", capped" : ""}). Use Save canvas to keep it.`;
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
  await app.workspace.getLeaf("tab").openFile(saved);
  return `Saved to ${path}`;
}

class ProfileModal extends obsidian.FuzzySuggestModal<any> {
  onPick: (name: string) => void;
  constructor(app: any, onPick: (name: string) => void) { super(app); this.onPick = onPick; this.setPlaceholder("Choose a view profile for the canvas"); }
  getItems() { return WB.PROFILES; }
  getItemText(p: any) { return `${p.name} — ${p.description}`; }
  onChooseItem(p: any) { this.onPick(p.name); }
}

class FolderModal extends obsidian.FuzzySuggestModal<string> {
  items: string[]; onPick: (folder: string) => void;
  constructor(app: any, items: string[], onPick: (folder: string) => void) { super(app); this.items = items; this.onPick = onPick; this.setPlaceholder("Save canvas in which folder?"); }
  getItems() { return this.items; }
  getItemText(f: string) { return f; }
  onChooseItem(f: string) { this.onPick(f); }
}

class MdseSettingTab extends obsidian.PluginSettingTab {
  plugin: any;
  constructor(app: any, plugin: any) { super(app, plugin); this.plugin = plugin; }
  display() {
    this.containerEl.empty();
    new obsidian.Setting(this.containerEl).setName("Default folder for saved canvases").setDesc("Canvas previews are never kept automatically. Save canvas offers this folder first, then your recent and project folders.")
      .addText((t: any) => t.setPlaceholder(WB.CANVAS_DIR).setValue(this.plugin.settings.defaultFolder).onChange(async (v: string) => { this.plugin.settings.defaultFolder = v.trim().replace(/\/+$/, "") || WB.CANVAS_DIR; await this.plugin.saveSettings(); }));
  }
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
      makeCanvas: (r: any) => writePreview(this.plugin, r),
      saveCanvas: () => this.plugin.saveWithPicker(),
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
  view: any = null; timer: any = null; preview: { fileName: string } | null = null; settings: { defaultFolder: string; lastFolder: string } = { defaultFolder: "", lastFolder: "" };
  async saveSettings() { await this.saveData(this.settings); }
  /** Folder choices: default first, then the last one used, then every other folder (project folders). The scratch folder is never offered. */
  folderChoices(): string[] {
    const def = this.settings.defaultFolder || WB.CANVAS_DIR, skip = (f: string) => f === "" || f === "/" || f.startsWith(".") || f.startsWith(WB.CANVAS_DIR + "/Preview");
    const all = this.app.vault.getAllLoadedFiles().filter((f: any) => f.children !== undefined).map((f: any) => String(f.path)).filter((f: string) => !skip(f)).sort();
    return [...new Set([def, ...(this.settings.lastFolder ? [this.settings.lastFolder] : []), ...all])];
  }
  saveWithPicker(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.preview) { reject(new Error("No preview to save. Open a canvas preview first.")); return; }
      let chosen = false;
      const m = new FolderModal(this.app, this.folderChoices(), (f: string) => { chosen = true; savePreview(this, f).then(resolve, reject); });
      const close = m.onClose?.bind(m); m.onClose = () => { close?.(); setTimeout(() => { if (!chosen) resolve("Save cancelled. The preview is still open."); }, 150); };
      m.open();
    });
  }
  async onload() {
    const saved = (await this.loadData()) ?? {};
    this.settings = { defaultFolder: String(saved.defaultFolder || WB.CANVAS_DIR), lastFolder: String(saved.lastFolder || "") };
    this.addSettingTab(new MdseSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => { removePreview(this.app).catch(() => {}); });      // a stale preview from an earlier session
    this.registerView(VIEW, (leaf: any) => new WorkbenchView(leaf, this));
    this.addRibbonIcon("network", "Open MDSE Workbench", () => this.open());
    this.addCommand({ id: "open", name: "Open MDSE Workbench", callback: () => this.open() });
    this.addCommand({ id: "refresh", name: "Refresh MDSE Workbench index", callback: () => this.view?.refresh() });
    this.addCommand({ id: "show-note", name: "Show current note in MDSE Workbench", checkCallback: (chk: boolean) => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) this.open(f.path); return true; } });
    this.addCommand({ id: "save-canvas", name: "Save preview canvas…", checkCallback: (chk: boolean) => { if (!this.preview || !this.app.vault.getAbstractFileByPath(WB.PREVIEW_PATH)) return false; if (!chk) this.saveWithPicker().then((m) => new obsidian.Notice("MDSE: " + m), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)); return true; } });
    this.addCommand({ id: "canvas", name: "Preview canvas from current note", checkCallback: (chk: boolean) => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) this.canvasFor(f.path); return true; } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu: any, f: any) => {
      if (f?.extension !== "md") return;
      menu.addItem((i: any) => i.setTitle("Show in MDSE Workbench").setIcon("network").onClick(() => this.open(f.path)));
      menu.addItem((i: any) => i.setTitle("Preview MDSE canvas").setIcon("layout-dashboard").onClick(() => this.canvasFor(f.path)));
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
        new obsidian.Notice("MDSE: " + await writePreview(this, WB.toCanvas(ix, path, prof)), 8000);
      } catch (e) { new obsidian.Notice("MDSE canvas failed: " + String((e as Error)?.message ?? e), 8000); console.error(e); }
    }).open();
  }
  onunload() { clearTimeout(this.timer); removePreview(this.app).catch(() => {}); }
};
