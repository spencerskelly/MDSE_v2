/* Obsidian shell. Everything of substance is in ui.ts / views.ts / index.ts; this file only supplies the vault's files and
 * the open-note action. Startup does no model work until Obsidian's layout is ready, and indexing yields to the UI. */
declare const require: (id: string) => any;
declare const CLASSES: any;
declare const WB: { mountWorkbench: (root: HTMLElement, host: unknown) => any };
const obsidian = require("obsidian");
const VIEW = "mdse-workbench";

class WorkbenchView extends obsidian.ItemView {
  plugin: any; app_: any = null;
  constructor(leaf: any, plugin: any) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW; }
  getDisplayText() { return "MDSE Workbench"; }
  getIcon() { return "network"; }
  async onOpen() {
    this.contentEl.empty(); this.contentEl.style.padding = "0"; this.contentEl.style.height = "100%";
    this.app_ = WB.mountWorkbench(this.contentEl, { classes: CLASSES, openNote: (p: string) => this.app.workspace.openLinkText(p, "", false) });
    this.plugin.view = this;
    await this.refresh();
  }
  async onClose() { this.app_?.destroy(); this.plugin.view = null; }
  async refresh() {
    const files = new Map<string, string>();
    const list = this.app.vault.getMarkdownFiles();
    for (let i = 0; i < list.length; i += 50) {
      await Promise.all(list.slice(i, i + 50).map(async (f: any) => { files.set(f.path, await this.app.vault.cachedRead(f)); }));
      await new Promise((r) => setTimeout(r, 0));
    }
    const pc = this.app.vault.getAbstractFileByPath("99_System/11_Import/Parser Check.md");
    if (pc) files.set(pc.path, await this.app.vault.cachedRead(pc));
    await this.app_.setFiles(files);
  }
}

module.exports = class MdseWorkbench extends obsidian.Plugin {
  view: any = null; timer: any = null;
  async onload() {
    this.registerView(VIEW, (leaf: any) => new WorkbenchView(leaf, this));
    this.addRibbonIcon("network", "Open MDSE Workbench", () => this.open());
    this.addCommand({ id: "open", name: "Open MDSE Workbench", callback: () => this.open() });
    this.addCommand({ id: "refresh", name: "Refresh MDSE Workbench index", callback: () => this.view?.refresh() });
    const later = () => { if (!this.view) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.view?.refresh(), 3000); };
    this.app.workspace.onLayoutReady(() => { this.registerEvent(this.app.vault.on("modify", later)); this.registerEvent(this.app.vault.on("create", later)); this.registerEvent(this.app.vault.on("delete", later)); this.registerEvent(this.app.vault.on("rename", later)); });
  }
  async open() {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  onunload() { clearTimeout(this.timer); }
};
