/* Testbench Obsidian shell (D-0170). Everything of substance is in tb_view.ts and the shared modules; this file supplies
 * the vault's notes, the model index, this computer's database (.mdse/testbench.db), file writes with compare-before-write
 * and Undo, the capture inbox (a folder in or outside the vault) and the phone capture server. Desktop only. */
declare const require: (id: string) => any;
declare const TB: any;
declare const CLASSES: any;
declare const initSqlJs: (o: { wasmBinary: Uint8Array }) => Promise<any>;
declare const SQLJS_WASM_B64: string;
declare const qrcode: any;
const obsidian = require("obsidian");
const VIEW = "mdse-testbench";
const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const DEFAULTS = { reportFolder: "Test Reports", inboxFolder: "", keepOriginals: false, port: 0, minutes: 15, testedBy: "" };

async function ensureFolder(app: any, dir: string): Promise<void> {
  if (!dir) return; let cur = "";
  for (const part of dir.split("/")) { cur = cur ? cur + "/" + part : part; if (!app.vault.getAbstractFileByPath(cur)) { try { await app.vault.createFolder(cur); } catch { /* made meanwhile */ } } }
}
const isAbsolute = (p: string): boolean => /^([A-Za-z]:[\\/]|\/|\\\\)/.test(p);

class TestbenchView extends obsidian.ItemView {
  plugin: any; ui: any = null;
  constructor(leaf: any, plugin: any) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW; }
  getDisplayText() { return "Testbench"; }
  getIcon() { return "flask-conical"; }
  async onOpen() { this.ui = TB.mountTestbench(this.contentEl, this.plugin.host()); this.plugin.views.add(this); }
  async onClose() { this.plugin.views.delete(this); this.ui?.destroy(); this.ui = null; }
}

class TestbenchSettingTab extends obsidian.PluginSettingTab {
  plugin: any;
  constructor(app: any, plugin: any) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl, p = this.plugin, save = async () => { await p.saveData(p.settings); };
    el.empty(); el.createEl("h2", { text: "MDSE Testbench" });
    new obsidian.Setting(el).setName("Report folder").setDesc("Each run gets its own folder here: the report note and its evidence files.")
      .addText((t: any) => t.setPlaceholder(DEFAULTS.reportFolder).setValue(p.settings.reportFolder).onChange(async (v: string) => { p.settings.reportFolder = v.trim() || DEFAULTS.reportFolder; await save(); }));
    new obsidian.Setting(el).setName("Capture inbox").setDesc("The folder this bench's scope or DAQ saves to: a full path on this computer or a network share, or a folder in the vault. New files are offered for the current step.")
      .addText((t: any) => t.setPlaceholder("for example D:\\ScopeExports").setValue(p.settings.inboxFolder).onChange(async (v: string) => { p.settings.inboxFolder = v.trim(); await save(); }));
    new obsidian.Setting(el).setName("Tested by").setDesc("Filled in on new runs.")
      .addText((t: any) => t.setValue(p.settings.testedBy).onChange(async (v: string) => { p.settings.testedBy = v.trim(); await save(); }));
    new obsidian.Setting(el).setName("Keep original photos").setDesc("Off: photos are shrunk to 2000 px (JPEG) before they are stored, which keeps the vault small.")
      .addToggle((t: any) => t.setValue(p.settings.keepOriginals).onChange(async (v: boolean) => { p.settings.keepOriginals = v; await save(); }));
    new obsidian.Setting(el).setName("Phone capture port").setDesc("0 picks a free port each time. Set a fixed port if IT opens one in the firewall for this computer.")
      .addText((t: any) => t.setValue(String(p.settings.port)).onChange(async (v: string) => { const n = Number(v); p.settings.port = Number.isInteger(n) && n >= 0 && n < 65536 ? n : 0; await save(); }));
    new obsidian.Setting(el).setName("Phone capture time limit (minutes)")
      .addText((t: any) => t.setValue(String(p.settings.minutes)).onChange(async (v: string) => { const n = Number(v); p.settings.minutes = n > 0 && n <= 240 ? n : 15; await save(); }));
  }
}

module.exports = class MdseTestbench extends obsidian.Plugin {
  settings: any = { ...DEFAULTS }; files: Map<string, string> = new Map(); ix: any = null; db: any = null; author = ""; selected = "";
  views: Set<any> = new Set(); rebuildTimer: any = null; dbTimer: any = null; pairSession: any = null;

  async onload() {
    this.settings = { ...DEFAULTS, ...((await this.loadData()) ?? {}) };
    this.registerView(VIEW, (leaf: any) => new TestbenchView(leaf, this));
    this.addRibbonIcon("flask-conical", "Open MDSE Testbench", () => this.open());
    this.addCommand({ id: "open", name: "Open Testbench", callback: () => this.open() });
    this.addCommand({ id: "open-report", name: "Open this test report in Testbench", checkCallback: (chk: boolean) => {
      const f = this.app.workspace.getActiveFile?.(); const ok = !!f && /\.md$/.test(f.path) && String(this.files.get(f.path) ?? "").includes("```mdse-run");
      if (ok && !chk) this.open().then((v: any) => { const err = v?.ui?.openRun(f.path); if (err) new obsidian.Notice("MDSE: " + err); });
      return ok; } });
    this.addSettingTab(new TestbenchSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on("file-open", (f: any) => { if (f?.extension === "md") this.selected = f.path; }));
    this.app.workspace.onLayoutReady(async () => {
      await this.readVault(); await this.loadDb();
      for (const [ev, fn] of [["modify", (f: any) => this.track(f.path, f)], ["create", (f: any) => this.track(f.path, f)], ["delete", (f: any) => this.track(f.path, null)],
        ["rename", (f: any, old: string) => { this.track(old, null); this.track(f.path, f); }]] as Array<[string, (...a: any[]) => void]>) this.registerEvent(this.app.vault.on(ev, fn));
    });
  }
  onunload() { clearTimeout(this.rebuildTimer); clearTimeout(this.dbTimer); this.saveDb().catch(() => {}); this.pairSession?.close?.(); }

  async open() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf(true); await leaf.setViewState({ type: VIEW, active: true }); }
    this.app.workspace.revealLeaf(leaf);
    return leaf.view;
  }
  async readVault() {
    const files = new Map<string, string>(); let i = 0;
    for (const f of this.app.vault.getMarkdownFiles()) { files.set(f.path, await this.app.vault.cachedRead(f)); if (++i % 300 === 0) await tick(); }
    this.files = files;
    try { this.author = TB.edAuthor(await this.app.vault.adapter.read(".vault.yaml")); } catch { this.author = ""; }
    await this.rebuild();
  }
  async rebuild() {
    this.ix = await TB.buildIndexAsync(this.files, { classes: CLASSES, yieldEvery: 300, yieldFn: tick });
    if (this.db) { try { TB.indexRuns(this.db, this.files); this.saveDbLater(); } catch (e) { console.error(e); } }
    this.views.forEach((v) => v.ui?.refresh());
  }
  async track(path: string, file: any) {
    if (!/\.md$/i.test(path)) return;
    if (file) this.files.set(path, await this.app.vault.cachedRead(file)); else this.files.delete(path);
    clearTimeout(this.rebuildTimer); this.rebuildTimer = setTimeout(() => this.rebuild(), 1200);
  }

  /* ---- this computer's database ---- */
  async loadDb() {
    try {
      const SQL = await initSqlJs({ wasmBinary: TB.base64Bytes(SQLJS_WASM_B64) });
      const a = this.app.vault.adapter, p = TB.TB_DB_PATH;
      this.db = TB.openTestbenchDb(SQL, (await a.exists(p)) ? new Uint8Array(await a.readBinary(p)) : null);
      if (this.db.opened === "reset") new obsidian.Notice("MDSE Testbench: the local database could not be read and was started again. Reports in the vault are unaffected; runs that were never saved to the vault were lost.");
      TB.indexRuns(this.db, this.files); this.saveDbLater();
      this.views.forEach((v) => v.ui?.refresh());
    } catch (e) { console.error("MDSE Testbench database unavailable", e); this.db = null; }
  }
  saveDbLater(ms = 1200) { clearTimeout(this.dbTimer); this.dbTimer = setTimeout(() => { this.saveDb().catch((e: unknown) => console.error(e)); }, ms); }
  async saveDb() {
    const db = this.db; if (!db || !db.dirty) return;
    const a = this.app.vault.adapter, p = TB.TB_DB_PATH, dir = p.slice(0, p.lastIndexOf("/"));
    if (!(await a.exists(dir))) await a.mkdir(dir);
    const b = db.export(); await a.writeBinary(p, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }

  /* ---- writes ---- */
  async applyPlan(plan: { summary: string; writes: Array<{ path: string; before: string | null; after: string }>; problems: string[] }) {
    if (plan.problems.length || !plan.writes.length) throw new Error(plan.problems[0] ?? "Nothing to write.");
    const done: Array<{ path: string; before: string | null; after: string }> = [];
    const back = async () => { for (const w of done.reverse()) { const f = this.app.vault.getAbstractFileByPath(w.path); if (!f) continue; if (w.before === null) { await this.app.vault.delete(f); this.files.delete(w.path); } else { await this.app.vault.process(f, () => w.before); this.files.set(w.path, w.before); } } };
    try {
      for (const w of plan.writes) {
        const f = this.app.vault.getAbstractFileByPath(w.path);
        if (w.before === null) { if (f) throw new Error(`${w.path} already exists.`); await ensureFolder(this.app, w.path.slice(0, w.path.lastIndexOf("/"))); await this.app.vault.create(w.path, w.after); }
        else { if (!f) throw new Error(`${w.path} is gone.`); if ((await this.app.vault.read(f)) !== w.before) throw new Error(`${w.path} changed since it was read. Try again.`); await this.app.vault.process(f, () => w.after); }
        this.files.set(w.path, w.after); done.push(w);
      }
    } catch (e) { await back(); throw e; }
    this.rebuild();
    const undo = async () => { const cur = done.slice(); for (const w of cur) { const f = this.app.vault.getAbstractFileByPath(w.path); if (f && (await this.app.vault.read(f)) !== w.after) throw new Error(`${w.path} changed since; not undone.`); } await back(); this.rebuild(); return "Undone."; };
    return { message: plan.summary, undo };
  }
  async writeEvidence(path: string, bytes: Uint8Array): Promise<string> {
    const a = this.app.vault.adapter, dot = path.lastIndexOf("."), stem = dot > path.lastIndexOf("/") ? path.slice(0, dot) : path, ext = dot > path.lastIndexOf("/") ? path.slice(dot) : "";
    let p = path, i = 2; while (await a.exists(p)) p = `${stem}-${i++}${ext}`;
    await ensureFolder(this.app, p.slice(0, p.lastIndexOf("/")));
    await this.app.vault.createBinary(p, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    return p;
  }

  /* ---- capture inbox ---- */
  async inbox(since: number) {
    const dir = String(this.settings.inboxFolder || "").trim(); if (!dir) return null;
    const out: Array<{ name: string; path: string; size: number; mtime: number }> = [];
    if (isAbsolute(dir)) {
      const fs = require("fs"), path = require("path");
      for (const name of fs.readdirSync(dir)) { if (name.startsWith(".")) continue; const full = path.join(dir, name); const st = fs.statSync(full); if (st.isFile() && st.mtimeMs >= since) out.push({ name, path: full, size: st.size, mtime: st.mtimeMs }); }
    } else {
      const a = this.app.vault.adapter, list = await a.list(dir);
      for (const full of list.files) { const st = await a.stat(full); const name = full.slice(full.lastIndexOf("/") + 1); if (st && !name.startsWith(".") && st.mtime >= since) out.push({ name, path: full, size: st.size, mtime: st.mtime }); }
    }
    return out.sort((x, y) => y.mtime - x.mtime).slice(0, 50);
  }
  async inboxRead(f: { path: string }): Promise<Uint8Array> {
    if (isAbsolute(f.path)) return new Uint8Array(require("fs").readFileSync(f.path));
    return new Uint8Array(await this.app.vault.adapter.readBinary(f.path));
  }

  /* ---- phone capture ---- */
  async pair(label: string, onFile: (u: any) => Promise<string>) {
    if (this.pairSession) { await this.pairSession.close().catch(() => {}); this.pairSession = null; }
    const crypto = require("crypto");
    this.pairSession = await TB.openPairSession({ http: require("http"), os: require("os"), randomHex: (n: number) => crypto.randomBytes(n).toString("hex") },
      { label, port: this.settings.port || 0, minutes: this.settings.minutes, onFile, onClose: () => { this.pairSession = null; } });
    return this.pairSession;
  }
  qr(text: string): string { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createDataURL(6, 2); }

  host() {
    const p = this;
    return {
      ix: () => p.ix, files: () => p.files, author: () => p.author, settings: () => p.settings, db: () => p.db,
      open: (path: string) => p.app.workspace.openLinkText(path, "", true),
      applyPlan: (plan: any) => p.applyPlan(plan),
      writeEvidence: (path: string, bytes: Uint8Array) => p.writeEvidence(path, bytes),
      sha256: async (bytes: Uint8Array) => new TB.Sha256().update(bytes).hex(),
      saveDbLater: () => p.saveDbLater(),
      inbox: (since: number) => p.inbox(since), inboxRead: (f: any) => p.inboxRead(f),
      pair: (label: string, onFile: any) => p.pair(label, onFile), qr: (t: string) => p.qr(t),
      resourceUrl: (path: string) => p.app.vault.adapter.getResourcePath?.(path) ?? "",
      selected: () => p.selected,
    };
  }
};
