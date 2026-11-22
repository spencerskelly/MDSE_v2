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
  mountPanel: (root: HTMLElement, host: unknown, opt: { mode: "panel" | "main"; lens?: string; area?: string; selected?: string; fixedContext?: boolean }) => any;
  WORKFLOW_ENTRY_LENS: Record<"document" | "define" | "structure" | "verify", string>;
  quickTemplate: (id: string) => { id: string; label: string; area: string; kind: "plain" | "governed"; type?: string; subtype?: string } | undefined;
  planReplacePart: (ix: any, files: Map<string, string>, classes: any, source: string, options: any) => any;
  planPartLifecycle: (ix: any, files: Map<string, string>, source: string, state: "current" | "obsolete", replacement?: string) => any;
  planPlainNote: (template: any, title: string, folder: string, existing: ReadonlySet<string>) => { summary: string; writes: Array<{ path: string; before: null; after: string }>; problems: string[] };
  planAddElement: (ix: any, classes: any, options: { type: string; subtype: string; title: string; folder: string; text: string; author: string }) => { summary: string; writes: Array<{ path: string; before: null; after: string }>; problems: string[] };
  buildIndex: (files: Map<string, string>, options: unknown) => any;
  contextLinkChoices: (ix: any, files: Map<string, string>, origin: string, created: string) => Array<{ rel: string; label: string; from: string; to: string; help: string; inputs: readonly string[]; usageKind: string }>;
  previewContextLinks: (ix: any, files: Map<string, string>, origin: string, plan: any) => { choices: Array<{ rel: string; label: string; from: string; to: string }>; message: string; createdPath: string | null };
  buildIndexAsync: (files: Map<string, string>, o: unknown) => Promise<any>;
  toCanvas: (ix: any, start: string, profile: any, spec?: unknown) => any;
  addToCanvas: (doc: any, ix: any, anchor: string | null, paths: string[], o?: { relations?: boolean }) => { doc: any; added: number; present: number; lineIds: string[] };
  updateIncludedCanvas: (doc: any, ix: any, scope: string[], checked: string[], anchor?: string | null, directChildren?: string[]) => { doc: any; added: number; removed: number; unchanged: number };
  discoveryOverlay: (doc: any, ix: any, sources: string[], limit?: number, mode?: { workflow?: "document" | "define" | "structure" | "verify"; all?: boolean }) => { doc: any; shown: number; available: number };
  discoveryBoundary: (ix: any, sources: string[], mode?: { workflow?: "document" | "define" | "structure" | "verify"; all?: boolean }) => Set<string>;
  clearDiscovery: (doc: any) => any;
  keepDiscoveryCandidates: (doc: any, ix: any, paths: string[]) => { doc: any; kept: number };
  dismissDiscoveryCandidates: (doc: any, paths: string[]) => { doc: any; dismissed: number };
  cardNotePath: (node: any) => string | null;
  structureCanvas: (ix: any, path: string, mode: "direct" | "full") => any;
  addChildren: (doc: any, ix: any, parent: string, paths: string[], o?: { relations?: boolean }) => { doc: any; added: number; present: number; lineIds: string[] };
  refreshCanvas: (doc: any, ix: any, opts?: { completeRelationships?: boolean }) => { doc: any; redrawn: number; missing: number; linesAdded: number; linesRemoved: number };
  autoLayout: (doc: any, ix: any) => { doc: any; moved: number; kept: number };
  cardAction: (doc: any, ix: any, parent: string, kind: string) => { doc: any; action: "collapsed" | "expanded" | "none"; changed: number; capped: boolean };
  pickCanvas: (ix: any, paths: string[], o: { relations: boolean; label: string; group: boolean }) => any;
  buildWithLimit: <R extends { notes: number }>(build: () => R, ask: (count: number) => Promise<number | null>) => Promise<R | null>;
  canvasLimitMessage: (count: number) => string; canvasLimitDefault: (count: number) => number; parseCanvasLimit: (text: string) => number | null; CANVAS_WARN_AT: number; CANVAS_LIMIT_MAX: number;
  PREVIEW_DIR: string; PREVIEW_PATH: string; SAVED_DIR: string;
  edAuthor: (yaml: string) => string; edgeRefOfId: (id: string) => any;
  cdEdgeIds: (doc: any) => Set<string>; cdDrawnLines: (doc: any, known: Set<string>) => Array<{ id: string; from: string | null; to: string | null }>;
  cdChoices: (ix: any, files: Map<string, string>, from: string, to: string) => Array<{ rel: { id: string; label: string; help: string; inputs: string[] }; ok: boolean; usageKind: string }>;
  cdWhyNot: (ix: any, files: Map<string, string>, from: string, to: string) => string; cdOtherWay: (ix: any, files: Map<string, string>, from: string, to: string) => string[]; cdDropLine: (text: string, id: string) => string | null; cdLabelLine: (text: string, id: string, label: string) => string | null;
  planAddRelationship: (ix: any, files: Map<string, string>, o: any) => any; edDiff: (before: string | null, after: string) => { removed: string[]; added: string[] };
  PROFILES: Array<{ name: string; description: string }>; LENSES: Array<[string, string]>; LENS_PROFILE: Record<string, string>; lensHasCanvas: (l: string) => boolean;
  uniqueCanvas: (ix: any, a: string, b: string) => { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number; saveFolder?: string };
  internalCanvas: (ix: any, path: string, inherit?: string[]) => { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number; saveFolder?: string; placeholders?: number };
  memberConnectionCanvas: (ix: any, owner: string, key: string, limit?: number) => { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number; saveFolder?: string };
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

/** Artifacts use editor tabs; reopening a note or Canvas focuses its existing tab. */
async function openArtifact(app: any, file: any): Promise<void> {
  let existing: any = null;
  app.workspace.iterateAllLeaves?.((leaf: any) => {
    if (!existing && leaf.view?.file?.path === file.path) existing = leaf;
  });
  if (existing) { await app.workspace.revealLeaf(existing); return; }
  const leaf = mainLeaf(app);
  await leaf.openFile(file);
  await app.workspace.revealLeaf(leaf);
}

const ensureFolder = async (app: any, dir: string): Promise<void> => {
  let at = "";
  for (const part of dir.split("/").filter(Boolean)) { at = at ? `${at}/${part}` : part; if (!app.vault.getAbstractFileByPath(at)) await app.vault.createFolder(at); }
};
const parseDoc = (text: string): any => { try { const d = JSON.parse(text); return { nodes: d.nodes ?? [], edges: d.edges ?? [], ...d }; } catch { return { nodes: [], edges: [] }; } };
const removePreview = async (app: any): Promise<void> => {             // every scratch preview of an earlier session (D-0140: each view is a new canvas)
  const dir = app.vault.getAbstractFileByPath(WB.PREVIEW_DIR);
  for (const f of [...(dir?.children ?? [])]) if (/^Workbench Preview.*\.canvas$/.test(f.name)) await app.vault.delete(f);
};

/** Writes a NEW preview canvas (D-0140: a scratch file of its own, so earlier views stay open to compare) and shows it in the main window. Nothing is kept until the person saves. */
async function writePreview(plugin: any, r: { doc: unknown; fileName: string; notes: number; unresolved: number; capped: boolean; groups: number; saveFolder?: string; placeholders?: number }): Promise<string> {
  const app = plugin.app;
  await ensureFolder(app, WB.PREVIEW_DIR);
  let path = WB.PREVIEW_PATH.replace(/\.canvas$/, ` ${++plugin.previewSeq}.canvas`);
  while (app.vault.getAbstractFileByPath(path)) path = WB.PREVIEW_PATH.replace(/\.canvas$/, ` ${++plugin.previewSeq}.canvas`);
  const file = await app.vault.create(path, JSON.stringify(r.doc, null, 2));
  plugin.preview = { path, fileName: r.fileName, edgeIds: WB.cdEdgeIds(r.doc), saveFolder: r.saveFolder };       // lines the Workbench drew; any other line on the canvas was drawn by the person
  plugin.previews.set(path, plugin.preview);
  await openArtifact(app, file);
  return `Canvas preview opened in the main window, not saved (${r.notes} notes${r.groups ? `, ${r.groups} groups` : ""}${r.unresolved ? `, ${r.unresolved} not in vault` : ""}${r.capped ? ", capped" : ""}). Use Save canvas to keep it.`;
}

/** Copies the preview as it is now (including any rearranging the person did) into the chosen folder, never overwriting. */
async function savePreview(plugin: any, folder: string): Promise<string> {
  const app = plugin.app, rec = plugin.targetPreview(), src = rec ? app.vault.getAbstractFileByPath(rec.path) : null;
  if (!src || !rec) throw new Error("No preview to save. Open a canvas preview first.");
  await ensureFolder(app, folder);
  const base = rec.fileName.replace(/\.canvas$/, "");
  let path = `${folder}/${base}.canvas`;
  for (let i = 2; app.vault.getAbstractFileByPath(path); i++) path = `${folder}/${base} (${i}).canvas`;
  const raw = await app.vault.read(src);
  let doc: any;
  try { doc = JSON.parse(raw); if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) throw new Error("invalid Canvas data"); }
  catch { throw new Error("Cannot save an invalid Canvas preview."); }
  // Never publish discovery candidates: retain kept card positions and other Canvas metadata.
  const cleaned = WB.clearDiscovery(doc);
  const saved = await app.vault.create(path, JSON.stringify({ ...doc, nodes: cleaned.nodes, edges: cleaned.edges }, null, 2));
  plugin.settings.lastFolder = folder; await plugin.saveSettings();
  await openArtifact(app, saved);
  return `Saved to ${path}`;
}

class PickModal extends obsidian.FuzzySuggestModal<any> {
  items: any[]; label: (x: any) => string; onPick: (x: any) => void;
  constructor(app: any, placeholder: string, items: any[], label: (x: any) => string, onPick: (x: any) => void) { super(app); this.items = items; this.label = label; this.onPick = onPick; this.setPlaceholder(placeholder); }
  getItems() { return this.items; }
  getItemText(x: any) { return this.label(x); }
  onChooseItem(x: any) { this.onPick(x); }
}

/** Optional second transaction after creating a model note. Neither cancellation nor simply
 * opening this dialog writes SysML. Existing relationship validation owns the actual change. */
class ContextLinkModal extends obsidian.Modal {
  plugin: any; origin: string; created: string;
  constructor(plugin: any, origin: string, created: string) { super(plugin.app); this.plugin = plugin; this.origin = origin; this.created = created; }
  onOpen() {
    const p = this.plugin, el = this.contentEl;
    el.empty();
    el.createEl("h3", { text: "Review a relationship" });
    el.createEl("p", { cls: "setting-item-description",
      text: "The new note is already saved and remains independent. A relationship changes SysML only if you separately preview and apply it." });
    const ix = WB.buildIndex(p.files, { classes: CLASSES }); // Includes the newly created file, without waiting for the async UI refresh.
    const choices = WB.contextLinkChoices(ix, p.files, this.origin, this.created);
    const buttons = el.createDiv({ cls: "modal-button-container" });
    if (!choices.length) {
      el.createEl("p", { text: "No writable native SysML relationship is valid between these two notes. No link was added." });
      buttons.createEl("button", { text: "Done" }).onclick = () => this.close();
      return;
    }
    const titleOf = (path: string): string => ix.notes.get(path)?.title ?? path;
    let selected = "", name = "", mult = "", plan: any = null;
    const info = el.createEl("p", { cls: "setting-item-description" });
    const preview = el.createEl("pre"); preview.style.whiteSpace = "pre-wrap";
    preview.style.maxHeight = "260px"; preview.style.overflow = "auto";
    const choose = new obsidian.Setting(el).setName("Relationship and direction")
      .setDesc("The arrow shows which note owns the native relationship statement.")
      .addDropdown((d: any) => {
        d.addOption("", "Select a relationship…");
        choices.forEach((c: any, i: number) => d.addOption(String(i), titleOf(c.from) + " → " + titleOf(c.to) + " · " + c.label));
        d.setValue("").onChange((v: string) => { selected = v; name = ""; mult = ""; refresh(); });
      });
    const nameSetting = new obsidian.Setting(el).setName("Usage name (optional)")
      .addText((x: any) => x.onChange((v: string) => { name = v; refresh(); }));
    const multSetting = new obsidian.Setting(el).setName("Multiplicity (optional)")
      .addText((x: any) => x.setPlaceholder("e.g. 1..*").onChange((v: string) => { mult = v; refresh(); }));
    const apply = buttons.createEl("button", { text: "Apply relationship", cls: "mod-cta" }); apply.disabled = true;
    buttons.createEl("button", { text: "Leave unlinked" }).onclick = () => this.close();
    const refresh = () => {
      plan = null; apply.disabled = true; preview.setText("");
      const c = selected === "" ? null : choices[Number(selected)];
      nameSetting.settingEl.style.display = c?.inputs.includes("name") ? "" : "none";
      multSetting.settingEl.style.display = c?.inputs.includes("mult") ? "" : "none";
      info.setText(c?.help ?? "Select a valid direction and relationship kind. The new note stays unlinked until Apply.");
      if (!c) return;
      plan = WB.planAddRelationship(ix, p.files, { rel: c.rel, from: c.from, to: c.to,
        name, mult, usageKind: c.usageKind });
      if (plan.problems.length || !plan.writes.length) {
        info.setText(plan.problems[0] ?? "No change can be written."); return;
      }
      const w = plan.writes[0], d = WB.edDiff(w.before, w.after);
      preview.setText([w.path, ...d.removed.map((x: string) => "- " + x),
        ...d.added.map((x: string) => "+ " + x)].join("\n"));
      apply.disabled = false;
    };
    apply.onclick = async () => {
      if (!plan || plan.problems.length) return;
      apply.disabled = true;
      try {
        const res = await p.applyPlan(plan); // Independent, compare-before-write transaction with Undo.
        const notice = document.createDocumentFragment(), undo = document.createElement("button");
        undo.textContent = "Undo"; undo.style.marginLeft = "0.5em";
        undo.onclick = async () => {
          undo.disabled = true;
          try { new obsidian.Notice("MDSE relationship: " + (await res.undo())); }
          catch (e: any) { new obsidian.Notice("MDSE relationship undo failed: " + String(e?.message ?? e), 8000); }
        };
        notice.append("MDSE relationship: " + res.message + " ", undo);
        new obsidian.Notice(notice, 15000);
        this.close();
      } catch (e: any) {
        plan = null; info.setText("Relationship not applied: " + String(e?.message ?? e) + ". Close or select again to preview.");
      }
    };
    void choose; refresh();
  }
}

/** Part lifecycle is a separate, previewed model-metadata change. A superseded part may still
 * be used in old or current assemblies; neither its SysML definition nor usages are edited. */
class PartLifecycleModal extends obsidian.Modal {
  plugin: any; source: string; next: "obsolete" | "current";
  constructor(plugin: any, source: string, next: "obsolete" | "current") {
    super(plugin.app); this.plugin = plugin; this.source = source; this.next = next;
  }
  onOpen() {
    const p = this.plugin, el = this.contentEl, n = p.ix?.notes.get(this.source);
    el.empty();
    el.createEl("h3", { text: "Mark part " + this.next });
    el.createEl("p", { text: (n?.title ?? this.source) + " — lifecycle only. Existing BOMs, usages, model relationships and record status are unchanged." });
    const candidate = p.ix?.edges.filter((e: any) => e.kind === "supersedes" && e.to === this.source).map((e: any) => e.from) ?? [];
    const candidatePath = candidate.length === 1 ? candidate[0] : "";
    let replacement = this.next === "obsolete" ? candidatePath : "";
    if (this.next === "obsolete") {
      new obsidian.Setting(el).setName("Replacement note (optional)").setDesc("If the new part is recorded as superseding this part, it can be referenced here.")
        .addText((x: any) => x.setValue(replacement).onChange((v: string) => { replacement = v.trim(); invalidate(); }));
    }
    const view = el.createEl("pre"); view.style.whiteSpace = "pre-wrap";
    const msg = el.createEl("p"), row = el.createDiv({ cls: "modal-button-container" });
    const see = row.createEl("button", { text: "Preview" });
    const apply = row.createEl("button", { text: "Apply lifecycle", cls: "mod-cta" });
    apply.disabled = true;
    row.createEl("button", { text: "Cancel" }).onclick = () => this.close();
    let plan: any = null;
    const invalidate = () => { plan = null; apply.disabled = true; view.setText(""); msg.setText("Preview required."); };
    invalidate();
    see.onclick = () => {
      plan = WB.planPartLifecycle(p.ix, p.files, this.source, this.next, replacement || undefined);
      if (plan.problems.length) { msg.setText(plan.problems.join("; ")); apply.disabled = true; return; }
      view.setText(plan.writes.map((w: any) => w.path + "\n\n" + w.after).join("\n\n"));
      msg.setText(plan.summary); apply.disabled = false;
    };
    apply.onclick = async () => {
      if (!plan || plan.problems.length) return;
      apply.disabled = true;
      try {
        const result = await p.applyPlan(plan);
        new obsidian.Notice("MDSE: " + result.message, 8000);
        this.close();
      } catch (e: any) { msg.setText(String(e?.message ?? e)); see.disabled = false; }
    };
  }
}

/** A preview-first workflow creation dialog. New model notes reuse planAddElement/applyPlan.
 * Ordinary notes are plain Markdown and do not become SysML elements implicitly. */
class QuickCreateModal extends obsidian.Modal {
  plugin: any; template: any; origin: string;
  constructor(plugin: any, template: any, origin: string) { super(plugin.app); this.plugin = plugin; this.template = template; this.origin = origin; }
  onOpen() {
    const p = this.plugin, t = this.template, el = this.contentEl;
    el.empty(); el.createEl("h3", { text: "New " + t.label });
    el.createEl("p", { cls: "setting-item-description",
      text: t.kind === "plain" ? "Ordinary Markdown: no governed ID, UID, SysML model element or automatic relationship." :
        "Governed model record: uses the existing identity and SysML creation plan, with preview and undo." });
    const originFolder = p.ix?.notes.get(this.origin)?.folder ?? "";
    const today = new Date(), dateLabel = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
    let title = t.id === "daily" ? dateLabel : t.id === "part-replacement" ? (p.ix?.notes.get(this.origin)?.title ?? "") + " Replacement" : "", folder = originFolder, detail = "", partNumber = "";
    new obsidian.Setting(el).setName("Name").addText((x: any) =>
      x.setPlaceholder("New note title").setValue(title).onChange((v: string) => { title = v; invalidate(); }));
    new obsidian.Setting(el).setName("Folder").setDesc("Vault-relative path; leave blank for the vault root.")
      .addText((x: any) => x.setValue(folder).onChange((v: string) => { folder = v; invalidate(); }));
    if (t.id === "part-replacement") new obsidian.Setting(el).setName("New part number (optional)")
      .setDesc("Do not reuse the predecessor's part number. Leave blank until the new PN is assigned.")
      .addText((x: any) => x.setPlaceholder("New PN").setValue(partNumber).onChange((v: string) => { partNumber = v; invalidate(); }));
    if (t.kind === "governed") new obsidian.Setting(el).setName(t.id === "part-replacement" ? "What is changing? (required)" : "Description / requirement text")
      .addTextArea((x: any) => x.setValue(detail).onChange((v: string) => { detail = v; invalidate(); }));
    const preview = el.createEl("pre"); preview.style.whiteSpace = "pre-wrap";
    preview.style.maxHeight = "260px"; preview.style.overflow = "auto";
    const status = el.createEl("p", { cls: "setting-item-description" });
    const relationshipPreview = el.createDiv();
    relationshipPreview.style.maxHeight = "220px"; relationshipPreview.style.overflow = "auto";
    const buttons = el.createDiv({ cls: "modal-button-container" });
    const see = buttons.createEl("button", { text: "Preview" });
    const apply = buttons.createEl("button", { text: "Create", cls: "mod-cta" }); apply.disabled = true;
    buttons.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    let plan: any = null;
    function invalidate() { plan = null; apply.disabled = true; preview.setText(""); relationshipPreview.empty(); status.setText("Preview required before creating."); }
    invalidate();
    see.addEventListener("click", () => {
      const existing = new Set<string>([...p.files.keys(), ...[...p.ix.notes.keys()]]);
      plan = t.kind === "plain" ? WB.planPlainNote(t, title, folder, existing) : t.id === "part-replacement"
        ? WB.planReplacePart(p.ix, p.files, CLASSES, this.origin, { title, folder, change: detail, partNumber, author: p.author })
        : WB.planAddElement(p.ix, CLASSES, { type: t.type, subtype: t.subtype ?? "", title, folder, text: detail, author: p.author });
      relationshipPreview.empty();
      if (plan.problems.length) {
        status.setText(plan.problems.join("; ")); preview.setText(""); apply.disabled = true; return;
      }
      preview.setText(plan.writes[0]?.path + "\n\n" + plan.writes[0]?.after);
      if (t.kind === "governed" && t.id !== "part-replacement") {
        const proposals = WB.previewContextLinks(p.ix, p.files, this.origin, plan);
        relationshipPreview.createEl("h4", { text: "Potential relationships — preview only" });
        relationshipPreview.createEl("p", { cls: "setting-item-description", text: proposals.message });
        for (const c of proposals.choices.slice(0, 12)) {
          const source = c.from === this.origin ? "Selected element" : "New element";
          const target = c.to === this.origin ? "Selected element" : "New element";
          relationshipPreview.createEl("div", { text: source + " → " + target + " · " + c.label });
        }
        if (proposals.choices.length > 12)
          relationshipPreview.createEl("p", { cls: "setting-item-description", text: "And " + (proposals.choices.length - 12) + " more valid options after creation." });
      }
      status.setText(plan.summary); apply.disabled = false;
    });
    apply.addEventListener("click", async () => {
      if (!plan || plan.problems.length) return;
      apply.disabled = true; see.disabled = true;
      try {
        const createdPath = plan.writes[0].path;
        const result = await p.applyPlan(plan);
        const file = p.app.vault.getAbstractFileByPath(createdPath);
        if (file) await mainLeaf(p.app).openFile(file);
        const notice = document.createDocumentFragment(), undoButton = document.createElement("button");
        undoButton.textContent = "Undo"; undoButton.style.marginLeft = "0.5em";
        undoButton.onclick = async () => {
          undoButton.disabled = true;
          try { new obsidian.Notice("MDSE: " + (await result.undo())); }
          catch (err: any) { new obsidian.Notice("MDSE: undo failed: " + String(err?.message ?? err), 8000); }
        };
        notice.append("MDSE: " + result.message + " ", undoButton);
        new obsidian.Notice(notice, 15000);
        // Creating the note is complete. Link approval, if offered, is a separate operation.
        relationshipPreview.empty(); // Replace hypothetical candidates with the actual post-creation validation.
        const linkOptions = t.kind === "governed" && t.id !== "part-replacement" && p.ix?.notes.has(this.origin)
          ? WB.contextLinkChoices(WB.buildIndex(p.files, { classes: CLASSES }), p.files, this.origin, createdPath) : [];
        if (!linkOptions.length) { this.close(); return; }
        preview.setText("Created: " + createdPath + "\n\nNo SysML relationship has been added.");
        status.setText("You may leave this note independent or separately review a native relationship to " +
          (p.ix.notes.get(this.origin)?.title ?? this.origin) + ".");
        buttons.replaceChildren();
        buttons.createEl("button", { text: "Review relationship…", cls: "mod-cta" }).onclick = () => {
          this.close(); new ContextLinkModal(p, this.origin, createdPath).open();
        };
        buttons.createEl("button", { text: "Done — leave unlinked" }).onclick = () => this.close();
      } catch (err: any) {
        status.setText("Could not create: " + String(err?.message ?? err) + ". Preview again.");
        plan = null; see.disabled = false;
      }
    });
  }
}

/** D-0161: a canvas of more than 50 elements warns and asks for a limit of up to 212. Closing without choosing cancels the canvas. */
class LimitModal extends obsidian.Modal {
  count: number; settle: (n: number | null) => void; chosen = false;
  constructor(app: any, count: number, settle: (n: number | null) => void) { super(app); this.count = count; this.settle = settle; }
  onOpen() {
    const el = this.contentEl; el.empty();
    el.createEl("h3", { text: "Large canvas" });
    el.createEl("p", { text: WB.canvasLimitMessage(this.count) });
    let value = String(WB.canvasLimitDefault(this.count));
    const msg = el.createEl("p", { cls: "setting-item-description" });
    new obsidian.Setting(el).setName("Limit of elements").setDesc(`1 to ${WB.CANVAS_LIMIT_MAX}`).addText((t: any) => { t.setValue(value).onChange((v: string) => { value = v; }); });
    const bar = el.createDiv({ cls: "modal-button-container" }), go = bar.createEl("button", { text: "Create canvas", cls: "mod-cta" }), no = bar.createEl("button", { text: "Cancel" });
    go.addEventListener("click", () => { const n = WB.parseCanvasLimit(value); if (n === null) { msg.setText(`Enter a whole number from 1 to ${WB.CANVAS_LIMIT_MAX}.`); return; } this.chosen = true; this.settle(n); this.close(); });
    no.addEventListener("click", () => this.close());
  }
  onClose() { this.contentEl.empty(); if (!this.chosen) this.settle(null); }
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
    new obsidian.Setting(this.containerEl).setName("Open Workbench in a pop-out window")
      .setDesc("Use a separate Obsidian window for the Workbench. The regular command follows this preference; the explicit pop-out command always requests a window.")
      .addToggle((t: any) => t.setValue(this.plugin.settings.popout).onChange(async (v: boolean) => { this.plugin.settings.popout = v; await this.plugin.saveSettings(); }));
  }
}

/** Host callbacks shared by the panel (right) and the table view (main). */
function hostFor(plugin: any): any {
  return {
    openNote: (p: string) => {                                          // D-0158: every note opens in a new tab, so the view it came from stays one tab back
      const app = plugin.app, file = app.vault.getAbstractFileByPath(p) ?? app.metadataCache.getFirstLinkpathDest(p, "");
      if (file) void openArtifact(app, file); else void app.workspace.openLinkText(p, "", "tab");
    },
    openTable: (lens: string) => plugin.openTable(lens),
    currentSelection: () => plugin.selected || null,
    openWorkflow: (area: string, lens: string, selected: string) => plugin.showWorkflowInPanel(area, lens, selected),
    quickCreate: (templateId: string, selectedPath: string) => plugin.openQuickCreate(templateId, selectedPath),
    openCanvas: (lens: string, spec: unknown) => plugin.openCanvas(lens, spec),
    openMemberCanvas: (owner: string, key: string) => plugin.openMemberCanvas(owner, key),
    addToCanvas: (anchor: string, paths: string[]) => plugin.addToCanvasPreview(anchor, paths),
    activeCanvasPath: () => plugin.canvasTarget()?.path ?? null,
    canvasIncluded: () => plugin.canvasIncluded(),
    updateIncluded: (anchor: string, scope: string[], checked: string[], directChildren: string[]) => plugin.updateCanvasIncluded(anchor, scope, checked, directChildren),
    discoverRelated: (sources: string[], mode: { workflow: "document" | "define" | "structure" | "verify"; all: boolean }) => plugin.discoverRelatedOnCanvas(sources, mode),
    discoveryActive: () => plugin.isDiscoveryActive(),
    stopDiscovery: () => plugin.stopDiscoveryOnCanvas(),
    keepSelectedDiscovery: () => plugin.changeSelectedDiscovery("keep"),
    dismissSelectedDiscovery: () => plugin.changeSelectedDiscovery("dismiss"),
    openPickCanvas: (paths: string[], label: string, relations: boolean, group: boolean, replace: boolean) => plugin.openPickCanvas(paths, label, relations, group, replace),
    openStructureCanvas: (path: string, mode: "direct" | "full") => plugin.openStructureCanvas(path, mode),
    autoLayout: () => plugin.autoLayoutCanvas(),
    cardAction: (kind: string) => plugin.cardActionOnSelected(kind),
    refreshCanvas: () => plugin.refreshCanvasView(),
    addChildren: (parent: string, paths: string[]) => plugin.addToCanvasPreview(parent, paths, true, false, parent),
    newCanvasFrom: (anchor: string, paths: string[]) => plugin.addToCanvasPreview(anchor, paths, true, true),
    saveCanvas: () => plugin.saveWithPicker(),
    hasPreview: () => !!plugin.preview,
    updateNote: (path: string, change: any) => plugin.updateNote(path, change),
    categoryRules: () => plugin.files.get(WB.CATEGORY_RULES_PATH) ?? null,
    applyCategoryWord: (word: string, category: string, paths: string[]) => plugin.applyCategoryWord(word, category, paths),
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
    await this.plugin.attachIndex(this.app_);
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
    await this.plugin.attachIndex(this.app_);
  }
  async onClose() { this.plugin.apps.delete(this.app_); this.app_?.destroy(); }
}

module.exports = class MdseWorkbench extends obsidian.Plugin {
  files: Map<string, string> = new Map(); ix: any = null; building: Promise<void> | null = null; apps: Set<any> = new Set(); selected = ""; rebuildTimer: any = null;
  preview: { path: string; fileName: string; edgeIds: Set<string>; saveFolder?: string; discovery?: { workflow: "document" | "define" | "structure" | "verify"; all: boolean } } | null = null; previews: Map<string, { path: string; fileName: string; edgeIds: Set<string>; saveFolder?: string; discovery?: { workflow: "document" | "define" | "structure" | "verify"; all: boolean } }> = new Map(); previewSeq = 0; settings: { defaultFolder: string; lastFolder: string; popout: boolean } = { defaultFolder: "", lastFolder: "", popout: false };
  author = ""; drawTimer: any = null; drawBusy: Set<string> = new Set(); drawQueue: Promise<void> = Promise.resolve();

  /* ---- draw a line, get a relationship (D-0043) ---- */
  /** Changes the scratch canvas file; a line that is not found leaves it as it is. */
  /** The preview the person is looking at: the open canvas when it is one of ours, else the newest. */
  targetPreview() { const t = this.canvasTarget(); return (t && this.previews.get(t.path)) || (this.preview && this.app.vault.getAbstractFileByPath(this.preview.path) ? this.preview : null); }
  async editPreview(fn: (text: string) => string | null, path?: string): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(path ?? this.preview?.path ?? "");
    if (f) await this.app.vault.process(f, (t: string) => fn(t) ?? t);
  }
  /** The canvas file changed (Obsidian saves a moment after a line is drawn or a card is moved). Any line the Workbench did not draw is the person's. */
  previewChanged(path: string) {
    clearTimeout(this.drawTimer);
    this.drawTimer = setTimeout(async () => {
      const f = this.app.vault.getAbstractFileByPath(path), rec = this.previews.get(path);
      if (!f || !rec) return;
      let doc: any; try { doc = JSON.parse(await this.app.vault.read(f)); } catch { return; }
      for (const line of WB.cdDrawnLines(doc, rec.edgeIds)) {
        if (this.drawBusy.has(line.id)) continue;
        this.drawBusy.add(line.id);
        this.drawQueue = this.drawQueue.then(() => this.relateDrawnLine(line, path)).catch(() => {}).finally(() => { this.drawBusy.delete(line.id); });
      }
    }, 700);
  }
  async relateDrawnLine(line: { id: string; from: string | null; to: string | null }, path: string): Promise<void> {
    const drop = () => this.editPreview((t) => WB.cdDropLine(t, line.id), path).catch(() => {});
    const edgeIds = this.previews.get(path)?.edgeIds;
    try {
      await this.ensureIndex();
      if (!line.from || !line.to) { new obsidian.Notice("MDSE: a relationship joins two notes. This line has a card that is not a note in the vault, so it was removed.", 8000); await drop(); return; }
      const why = WB.cdWhyNot(this.ix, this.files, line.from, line.to);
      if (why) { new obsidian.Notice("MDSE: " + why, 10000); await drop(); return; }
      const picked: { plan: any; label: string } | null = await new Promise((resolve) => new RelateModal(this.app, this, { from: line.from!, to: line.to! }, resolve).open());
      if (!picked) { await drop(); return; }
      const res = await this.applyPlan(picked.plan);
      edgeIds?.add(line.id);
      await this.editPreview((t) => WB.cdLabelLine(t, line.id, picked.label), path);
      const frag = document.createDocumentFragment(), btn = document.createElement("button");
      btn.textContent = "Undo"; btn.style.marginLeft = "0.5em";
      btn.onclick = async () => { try { new obsidian.Notice("MDSE: " + (await res.undo())); edgeIds?.delete(line.id); await drop(); } catch (e: any) { new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000); } };
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
  /** A view that opens after the index exists is handed it at once (it used to wait for the next rebuild and sat on "Reading notes…"); a failed read shows the reason instead of waiting for ever. */
  async attachIndex(app_: any): Promise<void> {
    if (this.ix) app_.setIndex(this.ix);
    try { await this.ensureIndex(); } catch (e: any) { app_.setIndex(null, "Could not read the vault: " + String(e?.message ?? e)); return; }
    if (this.ix) app_.setIndex(this.ix);
    this.syncSelection();
  }
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
  discoveryTimer: any = null; discoveryEpoch = 0; discoveryBusy = false;
  discoveryBoundaryPaths: Set<string> = new Set();
  discoveryPath = "";
  isDiscoveryActive(): boolean {
    const t = this.canvasTarget();
    return !!t && t.path === this.discoveryPath && !!this.previews.get(t.path)?.discovery;
  }
  /** Explicit and automatic exit share one path; temporary candidates vanish, kept cards stay. */
  async stopDiscoveryOnCanvas(): Promise<string> {
    const path = this.discoveryPath;
    ++this.discoveryEpoch;
    clearTimeout(this.discoveryTimer);
    this.discoveryBoundaryPaths.clear();
    this.discoveryPath = "";
    const rec = this.previews.get(path);
    if (!rec?.discovery) return "Discover Related is already off.";
    delete rec.discovery;
    if (this.preview?.path === path) delete this.preview.discovery;
    this.apps.forEach((app: any) => app.refresh?.());
    const target = this.canvasTarget();
    if (target?.path === path) {
      await this.editTarget(target, (raw: string) => {
        const current = parseDoc(raw), clean = WB.clearDiscovery(current);
        return clean.nodes.length !== current.nodes.length || clean.edges.length !== current.edges.length
          ? JSON.stringify({ ...current, nodes: clean.nodes, edges: clean.edges }, null, 2) : null;
      });
    } else {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file) await this.app.vault.process(file, (raw: string) => {
        const current = parseDoc(raw), clean = WB.clearDiscovery(current);
        return clean.nodes.length !== current.nodes.length || clean.edges.length !== current.edges.length
          ? JSON.stringify({ ...current, nodes: clean.nodes, edges: clean.edges }, null, 2) : raw;
      });
    }
    return "Discover Related off. Temporary candidates removed; kept cards preserved.";
  }

  /** Refresh only an MDSE discovery preview. Never touch a saved Canvas or a temporary card being inspected.
   * The debounce epoch prevents stale selections from overwriting newer ones. */
  async refreshDiscoveryOnSelection(path: string, sources: string[], epoch: number): Promise<void> {
    if (epoch !== this.discoveryEpoch) return;
    if (this.discoveryBusy) {
      this.discoveryTimer = setTimeout(() => { void this.refreshDiscoveryOnSelection(path, sources, epoch); }, 180);
      return;
    }
    const rec = this.previews.get(path), t = this.canvasTarget();
    if (!rec?.discovery || !t || t.path !== path) return;
    this.discoveryBusy = true;
    try {
      await this.ensureIndex();
      if (epoch !== this.discoveryEpoch || this.canvasTarget()?.path !== path || !this.previews.get(path)?.discovery) return;
      await this.editTarget(t, (raw: string) => {
        if (epoch !== this.discoveryEpoch) return null;
        const current = parseDoc(raw);
        // Never swallow a user's newly drawn line: it must pass through the governed relationship editor.
        if (WB.cdDrawnLines(current, rec.edgeIds).length) return null;
        const existingEdges = WB.cdEdgeIds(current);
        const anchored = WB.addToCanvas(WB.clearDiscovery(current), this.ix, sources[0]!, sources).doc;
        const result = WB.discoveryOverlay(anchored, this.ix, sources, 24, rec.discovery!);
        const next = { ...current, nodes: result.doc.nodes, edges: result.doc.edges };
        // Register only lines generated by MDSE, never lines the user drew.
        for (const id of WB.cdEdgeIds(next)) if (!existingEdges.has(id)) rec.edgeIds.add(id);
        return JSON.stringify(next, null, 2);
      });
    } catch (e: any) {
      new obsidian.Notice("MDSE discovery refresh failed: " + String(e?.message ?? e), 8000);
    } finally { this.discoveryBusy = false; }
  }

  canvasSelection() {
    const act = this.app.workspace.activeLeaf ?? this.app.workspace.getMostRecentLeaf?.();
    if (act?.view?.getViewType?.() === "canvas") this.canvasLeaf = act;
    const leaf = this.canvasLeaf, view = leaf?.view; if (!view || view.getViewType?.() !== "canvas" || !view.canvas || (view.containerEl && !view.containerEl.isConnected)) return;
    const sel = view.canvas.selection; if (!sel) return;
    const paths: string[] = [];
    let candidateSelected = false, allIdsKnown = true;
    for (const node of sel) {
      let data: any; try { data = node?.getData?.() ?? node?.unknownData ?? node; } catch { continue; }
      const id: unknown = data?.id ?? node?.id;
      if (typeof id !== "string") allIdsKnown = false;
      else if (id.startsWith("mdse-discovery:")) candidateSelected = true;
      const p = WB.cardNotePath({ type: data?.type, file: typeof data?.file === "string" ? data.file : data?.file?.path, text: data?.text });
      if (p && this.ix?.notes.has(p) && !paths.includes(p)) paths.push(p);
    }
    const path = String(view.file?.path ?? "");
    const key = path + "\n" + paths.join("\n") + (candidateSelected ? "\ncandidate" : "");
    if (key === this.canvasKey) return;
    this.canvasKey = key;
    this.apps.forEach((app: any) => app.reloadCanvasIncluded?.(path));
    clearTimeout(this.discoveryTimer);
    ++this.discoveryEpoch;
    if (!paths.length) { this.apps.forEach((a: any) => a.setCanvasSelection?.([])); return; }
    this.selected = paths[0]!; this.apps.forEach((a: any) => { a.setCanvasSelection?.(paths); });
    // Candidate selection is deliberately inert: otherwise clicking Keep could remove its target.
    if (!candidateSelected && allIdsKnown && path === this.discoveryPath && this.previews.get(path)?.discovery) {
      if (paths.some((p) => !this.discoveryBoundaryPaths.has(p))) {
        void this.stopDiscoveryOnCanvas().then((message: string) => new obsidian.Notice("MDSE: " + message, 4500))
          .catch((e: any) => new obsidian.Notice("MDSE: could not stop discovery: " + String(e?.message ?? e), 8000));
        return;
      }
      const epoch = this.discoveryEpoch;
      this.discoveryTimer = setTimeout(() => { void this.refreshDiscoveryOnSelection(path, [...paths], epoch); }, 220);
    }
  }
  onFileOpen(f: any) { if (f && f.extension === "md" && this.ix?.notes.has(f.path)) { this.selected = f.path; this.apps.forEach((a: any) => a.select(f.path)); } }

  /* ---- views ---- */
  async openPanel(forcePopout = false) {
    const ws = this.app.workspace;
    const requested = forcePopout || this.settings.popout;
    const wantPopout = requested && typeof ws.openPopoutLeaf === "function";
    const leaves: any[] = ws.getLeavesOfType(PANEL) || [];
    const inSidebar = (l: any) => { const root = l?.getRoot?.(); return root === ws.rightSplit || root === ws.leftSplit; };
    let leaf = leaves.find((l: any) => wantPopout ? !inSidebar(l) : inSidebar(l));
    if (!leaf) {
      // Moving a panel between an Obsidian side pane and a pop-out requires a new leaf.
      // Remove the previous panel before opening a replacement to avoid duplicate Workbenches.
      for (const old of leaves) old.detach?.();
      leaf = wantPopout ? ws.openPopoutLeaf({ size: { width: 480, height: 820 } }) : ws.getRightLeaf(false);
      await leaf.setViewState({ type: PANEL, active: true });
    }
    ws.revealLeaf(leaf);
    if (requested && !wantPopout) new obsidian.Notice("MDSE: this Obsidian version does not support pop-out windows; opened in sidebar.");
  }
  /** Show a context-specific creation dialog; source/current workspaces remain intact. */
  async openQuickCreate(templateId: string, selectedPath: string): Promise<string> {
    const template = WB.quickTemplate(templateId);
    if (!template) throw new Error("Unknown creation template: " + templateId);
    await this.ensureIndex();
    if (templateId === "part-obsolete" || templateId === "part-current")
      new PartLifecycleModal(this, selectedPath, templateId === "part-obsolete" ? "obsolete" : "current").open();
    else new QuickCreateModal(this, template, selectedPath).open();
    return "";
  }
  /** Workflow navigation stays in the one Workbench sidebar or optional pop-out. */
  async showWorkflowInPanel(area: string, lens: string, selected: string): Promise<void> {
    await this.openPanel();
    await this.ensureIndex();
    const panels = this.app.workspace.getLeavesOfType(PANEL) || [];
    const panel = panels.find((leaf: any) => leaf.view?.app_?.setWorkflow);
    if (!panel) throw new Error("MDSE Workbench panel could not be opened.");
    if (selected && !this.ix?.notes.has(selected)) throw new Error("The selected engineering item is not in the model.");
    panel.view.app_.setWorkflow(area, lens, selected);
    this.app.workspace.revealLeaf(panel);
  }
  async openTable(lens: string) {
    await this.openPanel();
    await this.ensureIndex();
    const panel = (this.app.workspace.getLeavesOfType(PANEL) || []).find((leaf: any) => leaf.view?.app_?.setLens);
    if (!panel) throw new Error("MDSE Workbench panel could not be opened.");
    panel.view.app_.setLens(lens);
    this.app.workspace.revealLeaf(panel);
    this.syncSelection();
  }
  /** Open an isolated, read-only member-connection preview; the current editor and Canvas stay unchanged. */
  async openMemberCanvas(owner: string, key: string): Promise<string> {
    await this.ensureIndex();
    if (!this.ix?.notes.has(owner)) throw new Error("The owning model note is not available.");
    const projection = WB.memberConnectionCanvas(this.ix, owner, key);
    const message = await writePreview(this, projection);
    const count = projection.doc && (projection.doc as any).edges?.length || 0;
    return `${message} Displayed ${count} explicit connection(s) for one SysML usage${projection.unresolved ? ` (${projection.unresolved} unresolved)` : ""}. This is a visual projection only; it does not create model notes or change the source.`;
  }
  /** D-0161: builds a canvas with no limit; over 50 elements the person is asked for a limit (up to 212) and it is built again within it. */
  askCanvasLimit(count: number): Promise<number | null> { return new Promise((resolve) => new LimitModal(this.app, count, resolve).open()); }
  async limited<R extends { notes: number }>(build: () => R): Promise<string> {
    const r = await WB.buildWithLimit(build, (n) => this.askCanvasLimit(n));
    return r ? writePreview(this, r as any) : "Canvas cancelled.";
  }
  async openCanvas(lens: string, spec: unknown): Promise<string> {
    await this.ensureIndex();
    if (!this.selected || !this.ix.notes.has(this.selected)) throw new Error("Open a model note first.");
    if (lens === "internal") return this.limited(() => WB.internalCanvas(this.ix, this.selected!, (spec as any)?.inherit ?? []));   // D-0097: parts inside the note, ports on its edge; saved per object, next to it
    if (lens === "compare") { const o = (spec as any)?.other; if (!o || !this.ix.notes.has(o)) throw new Error("Choose the note to compare with first."); return this.limited(() => WB.uniqueCanvas(this.ix, this.selected!, o)); }   // D-0104
    const prof = WB.PROFILES.find((p) => p.name === WB.LENS_PROFILE[lens]);
    if (!prof) throw new Error("No canvas for this view.");
    return this.limited(() => WB.toCanvas(this.ix, this.selected!, prof, spec as any));
  }

  /** D-0089: the canvas the person has open in the main window: the last canvas that was in front, else the preview. */
  canvasTarget(): { path: string; leaf: any } | null {
    const act = this.app.workspace.activeLeaf ?? this.app.workspace.getMostRecentLeaf?.();
    if (act?.view?.getViewType?.() === "canvas") this.canvasLeaf = act;
    const leaf = this.canvasLeaf, v = leaf?.view, path: string | undefined = v?.file?.path;
    if (path && v.getViewType?.() === "canvas" && (!v.containerEl || v.containerEl.isConnected) && this.app.vault.getAbstractFileByPath(path)) return { path, leaf };
    const open = this.preview && this.app.workspace.getLeavesOfType("canvas").find((l: any) => l.view?.file?.path === this.preview!.path);
    return open && this.preview ? { path: this.preview.path, leaf: open } : null;
  }
  /** Changes a canvas file; an open canvas is saved first so a card the person just moved is not lost. */
  async editTarget(t: { path: string; leaf: any }, fn: (text: string) => string | null): Promise<void> {
    try { await t.leaf?.view?.save?.(); } catch { /* an older canvas view without save */ }
    const f = this.app.vault.getAbstractFileByPath(t.path);
    if (f) await this.app.vault.process(f, (x: string) => fn(x) ?? x);
    this.apps.forEach((app: any) => app.reloadCanvasIncluded?.());
  }
  /** D-0091: re-read the vault, then bring the open canvas's note cards and Workbench lines up to date with it. */
  async refreshCanvasView(): Promise<string> {
    this.files = await readVault(this.app); await this.rebuild(); await this.ensureIndex();
    const t = this.canvasTarget(); if (!t) return "Index refreshed. Open a canvas in the main window to refresh it too.";
    let res: { redrawn: number; missing: number; linesAdded: number; linesRemoved: number } | null = null, changed = false;
    await this.editTarget(t, (text) => {
      const original = parseDoc(text), r = WB.refreshCanvas(original, this.ix);
      res = r;
      const next = JSON.stringify(r.doc, null, 2);
      changed = r.redrawn + r.linesAdded + r.linesRemoved > 0;
      if (changed) {
        const known = this.previews.get(t.path)?.edgeIds;
        if (known) {
          const oldIds = WB.cdEdgeIds(original);
          for (const edge of r.doc.edges) if (!oldIds.has(edge.id)) known.add(edge.id);
          const retained = WB.cdEdgeIds(r.doc);
          for (const edgeId of known) if (!retained.has(edgeId)) known.delete(edgeId);
        }
      }
      return changed ? next : null;
    });
    const r = res as { redrawn: number; missing: number; linesAdded: number; linesRemoved: number } | null;
    if (!r) return "Could not read that canvas.";
    this.app.workspace.revealLeaf(t.leaf);
    const bits = [r.redrawn ? `${r.redrawn} card${r.redrawn === 1 ? "" : "s"} redrawn` : "", r.linesAdded ? `${r.linesAdded} line${r.linesAdded === 1 ? "" : "s"} added` : "", r.linesRemoved ? `${r.linesRemoved} line${r.linesRemoved === 1 ? "" : "s"} removed` : "", r.missing ? `${r.missing} note${r.missing === 1 ? "" : "s"} not found (shown red)` : ""].filter(Boolean);
    return bits.length ? `Refreshed ${t.path}: ${bits.join(", ")}.` : `${t.path} already matches the vault.`;
  }
  /** The note paths of the cards chosen on the canvas in front, read the same way as canvasSelection(). */
  selectedCardPaths(): string[] {
    const t = this.canvasTarget(), view = t?.leaf?.view, sel = view?.canvas?.selection, paths: string[] = [];
    if (!sel) return paths;
    for (const node of sel) {
      let data: any; try { data = node?.getData?.() ?? node?.unknownData ?? node; } catch { continue; }
      const p = WB.cardNotePath({ type: data?.type, file: typeof data?.file === "string" ? data.file : data?.file?.path, text: data?.text });
      if (p && this.ix?.notes.has(p) && !paths.includes(p)) paths.push(p);
    }
    return paths;
  }
  /** D-0094, D-0095: apply one collapse/expand action to each card chosen on the canvas in front. Kinds: toggle, collapseLayer, expandLayer, collapseAll, expandAll. Nothing in the vault changes. */
  async cardActionOnSelected(kind: string): Promise<string> {
    await this.ensureIndex();
    const t = this.canvasTarget(); if (!t) return "Open a canvas in the main window first.";
    try { await t.leaf?.view?.save?.(); } catch { /* an older canvas view without save */ }
    const paths = this.selectedCardPaths(); if (!paths.length) return "Select one or more note cards on the canvas first.";
    const done = { collapsed: 0, expanded: 0, none: 0 }; let changed = 0, capped = false;
    await this.editTarget(t, (text) => {
      const original = parseDoc(text);
      let doc = original;
      for (const p of paths) { const r = WB.cardAction(doc, this.ix, p, kind); doc = r.doc; done[r.action]++; changed += r.changed; capped = capped || r.capped; }
      if (done.expanded) {
        doc = WB.refreshCanvas(doc, this.ix, { completeRelationships: true }).doc;
        const previous = new Set(original.edges.map((e: any) => e.id));
        const rec = this.previews.get(t.path);
        if (rec) for (const edge of doc.edges) if (!previous.has(edge.id)) rec.edgeIds.add(edge.id);
      }
      return done.collapsed + done.expanded ? JSON.stringify(doc, null, 2) : null;
    });
    this.app.workspace.revealLeaf(t.leaf);
    if (!done.collapsed && !done.expanded) return kind.startsWith("collapse") ? "Nothing to collapse: no parts are shown below the selected cards." : kind.startsWith("expand") ? "Nothing to expand: every part is already on the canvas, or the selected cards have no parts." : "Nothing to do: the selected cards have no parts.";
    const verb = done.collapsed ? `Collapsed ${done.collapsed} card${done.collapsed === 1 ? "" : "s"}, ${changed} card${changed === 1 ? "" : "s"} removed` : `Expanded ${done.expanded} card${done.expanded === 1 ? "" : "s"}, ${changed} card${changed === 1 ? "" : "s"} added`;
    return `${verb}.${capped ? " Stopped at the card limit; use Expand layer to continue." : ""}`;
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
    return this.limited(() => WB.structureCanvas(this.ix, path, mode));
  }

  /** D-0140: picked notes always open a new canvas; "Add to canvas" is the way to add to the open one (D-0083). */
  async openPickCanvas(paths: string[], label: string, relations: boolean, group: boolean, replace: boolean): Promise<string> {
    await this.ensureIndex();
    return this.limited(() => WB.pickCanvas(this.ix, paths, { relations, label, group }));
  }

  /** D-0082: put notes on the canvas preview next to the selected note's card. With no preview open, the selected note and these make a new one. */
  async addToCanvasPreview(anchor: string | null, paths: string[], relations = true, replace = false, rowUnder: string | null = null): Promise<string> {
    await this.ensureIndex();
    if (paths.length > WB.CANVAS_WARN_AT) { const n = await this.askCanvasLimit(paths.length); if (n === null) return "Canvas cancelled."; paths = paths.slice(0, n); }   // D-0161
    const place = (doc: any) => rowUnder ? WB.addChildren(doc, this.ix, rowUnder, paths, { relations }) : WB.addToCanvas(doc, this.ix, anchor, paths, { relations });
    const target = replace ? null : this.canvasTarget();
    if (target) {                                                                    // D-0089: the canvas that is open in the main window, whichever file it is
      let res: { added: number; present: number; linesAdded: number; linesRemoved: number } | null = null;
      await this.editTarget(target, (text) => {
        const original = parseDoc(text), placed = place(original);
        if (!placed.added) { res = { added: 0, present: placed.present, linesAdded: 0, linesRemoved: 0 }; return null; }
        // Rebuild all modeled relationships between the visible cards after every Workbench addition.
        // The model index is read-only, and canvas card coordinates and user-drawn edges are retained.
        const synced = WB.refreshCanvas(placed.doc, this.ix, { completeRelationships: true });
        const previous = new Set(original.edges.map((e: any) => e.id));
        const rec = this.previews.get(target.path);
        if (rec) for (const edge of synced.doc.edges) {
          if (!previous.has(edge.id)) rec.edgeIds.add(edge.id); // do not misclassify generated lines as user-drawn
        }
        res = { added: placed.added, present: placed.present, linesAdded: placed.lineIds.length + synced.linesAdded - synced.linesRemoved, linesRemoved: synced.linesRemoved };
        return JSON.stringify(synced.doc, null, 2);
      });
      const r = res as { added: number; present: number; linesAdded: number; linesRemoved: number } | null;
      if (!r) return "Could not read that canvas.";
      this.app.workspace.revealLeaf(target.leaf);
      return r.added ? `Added ${r.added} note${r.added === 1 ? "" : "s"} to ${target.path}${r.present ? ` (${r.present} already there)` : ""}. Modeled relationships refreshed automatically; existing cards stayed in place.` : r.present ? "Those notes are already on the canvas." : "Nothing to add.";
    }
    const all = [...(anchor ? [anchor] : []), ...paths], r = rowUnder ? place({ nodes: [], edges: [] }) : WB.addToCanvas({ nodes: [], edges: [] }, this.ix, anchor, all, { relations });   // no canvas open: start one with the same placement rules (D-0085)
    return writePreview(this, { doc: r.doc, fileName: `Canvas - ${(anchor ? this.ix.notes.get(anchor)?.title : "") || "picked notes"}.canvas`.replace(/[\\/:*?"<>|#^[\]]/g, " "), notes: r.added, unresolved: 0, capped: false, groups: 0 });
  }

  /** Read membership from the actual active Canvas, including saved canvases (never from a stale Workbench checkbox cache). */
  async canvasIncluded(): Promise<{ canvas: string | null; included: string[] }> {
    const target = this.canvasTarget();
    if (!target) return { canvas: null, included: [] };
    // A membership query must be read-only. Calling CanvasView.save() here can overwrite
    // the programmatic included-element update with an older in-memory Canvas snapshot,
    // and spuriously fire draw-to-relate detection on an otherwise unchanged view.
    const file = this.app.vault.getAbstractFileByPath(target.path);
    if (!file) return { canvas: null, included: [] };
    const doc = parseDoc(await this.app.vault.read(file));
    return { canvas: target.path, included: [...new Set(doc.nodes
      .filter((n: any) => n.type !== "group" && !String(n.id).startsWith("mdse-discovery:"))
      .map((n: any) => WB.cardNotePath(n)).filter((p: any) => typeof p === "string" && this.ix?.notes.has(p)))] };
  }
  /** Apply one list's checked/unchecked membership atomically to the open Canvas.
   * Only cards from that list are eligible for removal; no SysML note or relationship is edited. */
  async updateCanvasIncluded(anchor: string, scope: string[], checked: string[], directChildren: string[] = []): Promise<string> {
    await this.ensureIndex();
    const eligible = [...new Set(scope)].filter((p) => this.ix.notes.has(p));
    if (!eligible.length) return "No governed elements are available in this list.";
    const wanted = [...new Set(checked)].filter((p) => eligible.includes(p));
    const target = this.canvasTarget();
    if (!target) {
      if (!wanted.length) return "No Canvas is open and nothing is checked.";
      return this.addToCanvasPreview(wanted.includes(anchor) ? anchor : null, wanted);
    }
    let changes: { added: number; removed: number; unchanged: number } | null = null;
    await this.editTarget(target, (text) => {
      const current = parseDoc(text);
      const updated = WB.updateIncludedCanvas(current, this.ix, eligible, wanted, anchor, directChildren);
      changes = { added: updated.added, removed: updated.removed, unchanged: updated.unchanged };
      if (!updated.added && !updated.removed) return null;
      const rec = this.previews.get(target.path);
      if (rec) {
        const old = new Set(current.edges.map((e: any) => e.id));
        for (const edge of updated.doc.edges) if (!old.has(edge.id)) rec.edgeIds.add(edge.id);
        const kept = new Set(updated.doc.edges.map((e: any) => e.id));
        for (const id of rec.edgeIds) if (!kept.has(id)) rec.edgeIds.delete(id);
      }
      return JSON.stringify(updated.doc, null, 2);
    });
    this.app.workspace.revealLeaf(target.leaf);
    const c = changes as { added: number; removed: number; unchanged: number } | null;
    if (!c) return "Could not read the current Canvas.";
    return `Updated included elements on ${target.path}: ${c.added} added, ${c.removed} removed, ${c.unchanged} retained. Other cards and model notes unchanged.`;
  }

  /** Preview related candidates on a new scratch Canvas; never modify an existing saved canvas. */
  async discoverRelatedOnCanvas(paths: string[], mode: { workflow: "document" | "define" | "structure" | "verify"; all: boolean } = { workflow: "document", all: false }): Promise<string> {
    await this.ensureIndex();
    const sources = [...new Set(paths)].filter((p) => this.ix.notes.has(p));
    if (!sources.length) return "Select a governed engineering note first.";
    const target = this.canvasTarget();
    let current: any = { nodes: [], edges: [] };
    if (target) {
      try { await target.leaf?.view?.save?.(); } catch { /* Canvas view may not expose save */ }
      const file = this.app.vault.getAbstractFileByPath(target.path);
      if (file) current = parseDoc(await this.app.vault.read(file));
    }
    const kept = WB.clearDiscovery(current);
    const anchored = WB.addToCanvas(kept, this.ix, sources[0]!, sources).doc;
    const result = WB.discoveryOverlay(anchored, this.ix, sources, 24, mode);
    const name = String(this.ix.notes.get(sources[0]!)?.title ?? "Engineering elements").slice(0, 65).replace(/[\\/:*?"<>|#^[\]]/g, " ");
    const msg = await writePreview(this, { doc: { ...current, nodes: result.doc.nodes, edges: result.doc.edges },
      fileName: `Discovery - ${name}.canvas`, notes: result.doc.nodes.length, unresolved: 0,
      capped: result.shown < result.available, groups: 0 });
    if (this.preview) {
      this.preview.discovery = { ...mode }; // Only discovery previews auto-refresh.
      this.discoveryPath = this.preview.path;
      this.discoveryBoundaryPaths = WB.discoveryBoundary(this.ix, sources, mode);
    }
    this.canvasKey = ""; // A newly opened preview is a distinct selection context.
    return `${msg} ${result.shown} discovery candidate(s) shown of ${result.available} available (${mode.all ? "all relationships" : mode.workflow}). Discovery follows the original element and its directly related elements, stops outside that group, or can be turned off manually. Kept cards remain; temporary candidates are not saved.`;
  }

  /** Promote or dismiss only selected discovery candidates on the active scratch preview. */
  async changeSelectedDiscovery(action: "keep" | "dismiss"): Promise<string> {
    await this.ensureIndex();
    const t = this.canvasTarget();
    if (!t || !this.previews.has(t.path)) return "Open an MDSE discovery preview first.";
    const paths = this.selectedCardPaths();
    if (!paths.length) return "Select one or more discovery candidate cards first.";
    let changed = 0;
    await this.editTarget(t, (text) => {
      const original = parseDoc(text);
      const r = action === "keep" ? WB.keepDiscoveryCandidates(original, this.ix, paths) : WB.dismissDiscoveryCandidates(original, paths);
      changed = action === "keep" ? r.kept : r.dismissed;
      if (!changed) return null;
      return JSON.stringify({ ...original, nodes: r.doc.nodes, edges: r.doc.edges }, null, 2);
    });
    return changed ? `${action === "keep" ? "Kept" : "Dismissed"} ${changed} candidate(s). ${action === "keep" ? "They will be included when you save this canvas." : "Kept cards were not changed."}` : "No temporary candidates were selected.";
  }

  /* ---- saving a preview ---- */
  folderChoices(): string[] {
    const def = this.settings.defaultFolder || WB.SAVED_DIR, skip = (f: string) => f === "" || f === "/" || f.startsWith(".") || f === WB.PREVIEW_DIR || f.startsWith(WB.PREVIEW_DIR + "/");
    const all = this.app.vault.getAllLoadedFiles().filter((f: any) => f.children !== undefined).map((f: any) => String(f.path)).filter((f: string) => !skip(f)).sort();
    return [...new Set([...(this.preview?.saveFolder ? [this.preview.saveFolder] : []), def, ...(this.settings.lastFolder ? [this.settings.lastFolder] : []), ...all])];
  }
  saveWithPicker(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.targetPreview()) { reject(new Error("No preview to save. Open a canvas preview first.")); return; }
      let chosen = false;
      const m = new PickModal(this.app, "Save canvas in which folder?", this.folderChoices(), (f: string) => f, (f: string) => { chosen = true; savePreview(this, f).then(resolve, reject); });
      const close = m.onClose?.bind(m); m.onClose = () => { close?.(); setTimeout(() => { if (!chosen) resolve("Save cancelled. The preview is still open."); }, 150); };
      m.open();
    });
  }

  /* ---- Review actions (D-0025): the only edits to model notes ---- */
  /** D-0146: add a word to a category in the vault's category list and set that category on the parts it places. One undo puts every file back. */
  async applyCategoryWord(word: string, category: string, paths: string[]): Promise<{ message: string; undo: () => Promise<string> }> {
    const w = word.trim().toUpperCase(), cat = category.trim();
    if (!/^[A-Z][A-Z0-9]+$/.test(w)) throw new Error(`"${word}" is not a single word.`);
    if (!cat || /[\\/:*?"<>|]/.test(cat)) throw new Error("The category name cannot be used as a folder name.");
    const done: Array<{ path: string; before: string | null; after: string }> = [];
    const table = this.files.get(WB.CATEGORY_RULES_PATH) ?? null;
    let next: string;
    if (table === null) { const r = WB.DEFAULT_CATEGORY_RULES.map((x) => ({ ...x, words: [...x.words] })); const t = r.find((x) => x.category === cat); if (t) { if (!t.words.includes(w)) t.words.push(w); } else r.push({ category: cat, words: [w] }); next = WB.renderCategoryRules(r); }
    else {
      const lines = table.split("\n"), at = lines.findIndex((l) => { const m = /^- (.+?): (.*)$/.exec(l); return !!m && m[1]!.trim() === cat; });
      if (at >= 0) { if (!lines[at]!.split(/\s+/).includes(w)) lines[at] = lines[at]!.replace(/\s*$/, "") + " " + w; }
      else { let last = -1; lines.forEach((l, i) => { if (/^- .+: /.test(l) && !/ also: /.test(l)) last = i; }); lines.splice(last + 1, 0, `- ${cat}: ${w}`); }
      next = lines.join("\n");
    }
    const tf = this.app.vault.getAbstractFileByPath(WB.CATEGORY_RULES_PATH);
    const checked = WB.parseCategoryRules(next); if (checked.problems?.length) throw new Error("The category list would have problems: " + checked.problems.join("; "));
    if (tf) { let before = ""; await this.app.vault.process(tf, (t: string) => { before = t; return next; }); done.push({ path: WB.CATEGORY_RULES_PATH, before, after: next }); }
    else { await ensureFolder(this.app, WB.CATEGORY_RULES_PATH.split("/").slice(0, -1).join("/")); await this.app.vault.create(WB.CATEGORY_RULES_PATH, next); done.push({ path: WB.CATEGORY_RULES_PATH, before: null, after: next }); }
    this.files.set(WB.CATEGORY_RULES_PATH, next);
    let set = 0;
    for (const p of paths) {
      const f = this.app.vault.getAbstractFileByPath(p); if (!f) continue;
      let before = "", after = "";
      await this.app.vault.process(f, (t: string) => { before = t; const r = MDSE.setFrontmatterField(t, "bomCategory", cat); after = r.changed ? r.text : t; return after; });
      if (after !== before) { done.push({ path: p, before, after }); this.files.set(p, after); set++; }
    }
    this.laterRebuild(200);
    const undo = async (): Promise<string> => {
      for (const d of done.slice().reverse()) {
        const f = this.app.vault.getAbstractFileByPath(d.path); if (!f) continue;
        if (d.before === null) { await this.app.vault.delete(f); this.files.delete(d.path); continue; }
        await this.app.vault.process(f, (cur: string) => (cur === d.after ? d.before! : cur)); this.files.set(d.path, d.before);
      }
      this.laterRebuild(200); return "Undone.";
    };
    return { message: `Added ${w} to ${cat} and set the category on ${set} part${set === 1 ? "" : "s"}.`, undo };
  }
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
    this.settings = { defaultFolder: String(saved.defaultFolder || WB.SAVED_DIR), lastFolder: String(saved.lastFolder || ""), popout: !!saved.popout };
    this.addSettingTab(new MdseSettingTab(this.app, this));
    this.registerView(PANEL, (leaf: any) => new PanelView(leaf, this));
    // Legacy table views are retired: tools navigate inside the Workbench panel.
    this.app.workspace.detachLeavesOfType?.(TABLE);
    this.app.workspace.detachLeavesOfType?.("mdse-workflow-tab"); // retire experimental workflow tabs on upgrade
    this.addRibbonIcon("network", "Open MDSE Workbench", () => this.openPanel());
    const noteOpen = (chk: boolean, fn: (f: any) => void): boolean => { const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!chk) fn(f); return true; };
    const lensPick = (placeholder: string, only: (l: string) => boolean, fn: (l: string) => void) => new PickModal(this.app, placeholder, WB.LENSES.filter(([k]) => only(k)), (x: any) => x[1], (x: any) => fn(x[0])).open();
    this.addCommand({ id: "open", name: "Open MDSE Workbench", callback: () => this.openPanel() });
    this.addCommand({ id: "open-popout", name: "Open MDSE Workbench in a pop-out window", callback: () => this.openPanel(true) });
    this.addCommand({ id: "edit-canvas-line", name: "Edit the relationship selected on the canvas", checkCallback: (chk: boolean) => {
      const refs = this.canvasSelectionRefs(); if (!refs.length) return false;
      if (!chk) { if (refs.length > 1) new obsidian.Notice("Several lines are selected; editing the first."); this.editRelationship(refs[0]); }
      return true;
    } });
    try { this.registerEvent(this.app.workspace.on("canvas:edge-menu", (menu: any, edge: any) => { const r = edge?.id ? WB.edgeRefOfId(String(edge.id)) : null; if (r) menu.addItem((i: any) => i.setTitle("Edit relationship (MDSE)").setIcon("pencil").onClick(() => this.editRelationship(r))); })); } catch { /* older Obsidian: the command still works */ }
    this.addCommand({ id: "refresh", name: "Refresh MDSE Workbench index", callback: async () => { this.files = await readVault(this.app); await this.rebuild(); } });
    this.addCommand({ id: "show-note", name: "Show current note in MDSE Workbench", checkCallback: (chk: boolean) => noteOpen(chk, async () => { await this.openPanel(); await this.ensureIndex(); this.syncSelection(); }) });
    this.addCommand({ id: "table", name: "Show MDSE table in Workbench…", callback: () => lensPick("Which table?", (k) => k !== "dashboard" && k !== "note", (l) => this.openTable(l)) });
    this.addCommand({ id: "canvas", name: "Preview canvas from current note", checkCallback: (chk: boolean) => noteOpen(chk, () => lensPick("Which view for the canvas?", WB.lensHasCanvas, (l) => this.openCanvas(l, {}).then((m) => new obsidian.Notice("MDSE: " + m, 8000), (e: any) => new obsidian.Notice("MDSE canvas failed: " + String(e?.message ?? e), 8000)))) });
    this.addCommand({ id: "toggle-cards", name: "Collapse or expand the selected canvas cards", callback: () => this.cardActionOnSelected("toggle").then((m) => new obsidian.Notice("MDSE: " + m, 6000), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)) });
    this.addCommand({ id: "collapse-layer", name: "Collapse one layer under the selected canvas cards", callback: () => this.cardActionOnSelected("collapseLayer").then((m) => new obsidian.Notice("MDSE: " + m, 6000), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)) });
    this.addCommand({ id: "expand-layer", name: "Expand one layer under the selected canvas cards", callback: () => this.cardActionOnSelected("expandLayer").then((m) => new obsidian.Notice("MDSE: " + m, 6000), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)) });
    this.addCommand({ id: "collapse-all", name: "Collapse all layers under the selected canvas cards", callback: () => this.cardActionOnSelected("collapseAll").then((m) => new obsidian.Notice("MDSE: " + m, 6000), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)) });
    this.addCommand({ id: "expand-all", name: "Expand all layers under the selected canvas cards", callback: () => this.cardActionOnSelected("expandAll").then((m) => new obsidian.Notice("MDSE: " + m, 6000), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)) });
    this.addCommand({ id: "save-canvas", name: "Save preview canvas…", checkCallback: (chk: boolean) => { if (!this.targetPreview()) return false; if (!chk) this.saveWithPicker().then((m) => new obsidian.Notice("MDSE: " + m), (e: any) => new obsidian.Notice("MDSE: " + String(e?.message ?? e), 8000)); return true; } });
    this.registerEvent(this.app.workspace.on("file-menu", (menu: any, f: any) => {
      if (f?.extension !== "md") return;
      menu.addItem((i: any) => i.setTitle("Show in MDSE Workbench").setIcon("network").onClick(async () => { await this.openPanel(); await this.ensureIndex(); this.selected = f.path; this.apps.forEach((a: any) => a.select(f.path)); }));
      menu.addItem((i: any) => i.setTitle("Open in MDSE workflow…").setIcon("copy-plus").onClick(async () => {
        try {
          await this.ensureIndex();
          if (!this.ix?.notes.has(f.path)) { new obsidian.Notice("MDSE: this file is not a governed model note.", 6000); return; }
          const choices = (["document", "define", "structure", "verify"] as const).map((area) => ({
            area, lens: WB.WORKFLOW_ENTRY_LENS[area], label: area.charAt(0).toUpperCase() + area.slice(1),
          }));
          new PickModal(this.app, "Show note in MDSE workflow", choices, (x: any) => x.label,
            (x: any) => { void this.showWorkflowInPanel(x.area, x.lens, f.path).catch((e: any) =>
              new obsidian.Notice("MDSE: could not open workflow: " + String(e?.message ?? e), 8000)); }).open();
        } catch (e: any) { new obsidian.Notice("MDSE: could not load model index: " + String(e?.message ?? e), 8000); }
      }));
      menu.addItem((i: any) => i.setTitle("Preview MDSE canvas").setIcon("layout-dashboard").onClick(() => { this.selected = f.path; lensPick("Which view for the canvas?", WB.lensHasCanvas, (l) => this.openCanvas(l, {}).then((m) => new obsidian.Notice("MDSE: " + m, 8000), (e: any) => new obsidian.Notice("MDSE canvas failed: " + String(e?.message ?? e), 8000))); }));
    }));
    this.registerEvent(this.app.workspace.on("file-open", (f: any) => this.onFileOpen(f)));
    for (const ev of ["pointerup", "keyup"]) this.registerDomEvent(document, ev, () => setTimeout(() => this.canvasSelection(), 60));
    this.registerInterval(window.setInterval(() => { try { this.canvasSelection(); } catch { /* a canvas internal that moved must never break the plugin */ } }, 300));
    this.registerEvent(this.app.vault.on("modify", (f: any) => { if (f?.path && this.previews.has(f.path)) this.previewChanged(f.path); }));
    this.app.workspace.onLayoutReady(() => {
      removePreview(this.app).catch(() => {});                                  // a stale preview from an earlier session
      this.app.workspace.detachLeavesOfType?.(OLD_VIEW);                          // the pre-0.6 main-window view
      for (const [ev, fn] of [["modify", (f: any) => this.track(f.path, f)], ["create", (f: any) => this.track(f.path, f)], ["delete", (f: any) => this.track(f.path, null)], ["rename", (f: any, old: string) => { this.track(old, null); this.track(f.path, f); }]] as Array<[string, (f: any, o?: any) => void]>)
        this.registerEvent(this.app.vault.on(ev, fn));
    });
  }
  onunload() { ++this.discoveryEpoch; clearTimeout(this.discoveryTimer); clearTimeout(this.rebuildTimer); clearTimeout(this.drawTimer); removePreview(this.app).catch(() => {}); }
};
