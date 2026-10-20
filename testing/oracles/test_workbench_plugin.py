"""Run the built Obsidian plugin (tools/workbench/dist/plugin/main.js) in a real Chromium against a fake Obsidian API.

This is not real Obsidian: it proves the plugin's own code (view, commands, canvas writer) works against the API surface it
uses, so a failure inside real Obsidian points at the API fake, not at the plugin logic. See tools/workbench/README.md."""
import json, pathlib, unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # pragma: no cover
    sync_playwright = None

ROOT = pathlib.Path(__file__).resolve().parents[2]
MAIN = ROOT / "tools/workbench/dist/plugin/main.js"
FIX = ROOT / "testing/fixtures/golden-charger"
PCE = ROOT / "tools/workbench/test/fixtures/PCE25.md"
PCE_PATH = "00 Product Definition/MHE/PCE25/PCE25.md"

FAKE = r"""
window.__files = {}; window.__dirs = {}; window.__notices = []; window.__opened = []; window.__cmds = {}; window.__menu = 0; window.__data = null; window.__ev = {}; window.__where = []; window.__active = null; let views = {};
class ItemView { constructor(leaf) { this.leaf = leaf; this.app = window.__app; this.contentEl = document.createElement('div'); this.contentEl.empty = function () { this.replaceChildren(); }; document.body.append(this.contentEl); } }
class Plugin { constructor(app) { this.app = app; } addCommand(c) { window.__cmds[c.id] = c; } registerView(t, f) { views[t] = f; } addRibbonIcon() {} registerEvent(e) { return e; } addSettingTab(t) { window.__tab = t; } async loadData() { return window.__data; } async saveData(d) { window.__data = JSON.parse(JSON.stringify(d)); } }
class PluginSettingTab { constructor(app, plugin) { this.app = app; this.containerEl = document.createElement('div'); this.containerEl.empty = function () { this.replaceChildren(); }; } }
class Setting { constructor(el) { this.el = el; } setName() { return this; } setDesc() { return this; } addText(f) { const inp = document.createElement('input'); this.el.append(inp); const api = { setPlaceholder() { return api; }, setValue(v) { inp.value = v; return api; }, onChange(cb) { inp.oncb = cb; return api; } }; f(api); return this; } }
class FuzzySuggestModal { constructor(app) {} setPlaceholder() {} open() { window.__modal = this; } close() { this.onClose && this.onClose(); } }
class Notice { constructor(m) { window.__notices.push(m); } }
const isDir = (p) => p in window.__dirs;
const exists = (p) => p in window.__notes || p in window.__files || isDir(p);
const fileOf = (path) => isDir(path) ? { path, children: [] } : { path, extension: path.split('.').pop() };
const read = (f) => window.__notes[f.path] ?? window.__files[f.path];
const mk = (kind) => ({ kind, view: null, async setViewState(s) { this.view = views[s.type](this); this.type = s.type; if (this.view.setState) await this.view.setState(s.state || {}, {}); await this.view.onOpen(); }, async openFile(f) { window.__opened.push([kind, f.path]); } });
const leaves = { right: [], main: [] };
const rootLeaf = mk('main');
window.__app = {
  vault: {
    getMarkdownFiles: () => Object.keys(window.__notes).map(fileOf),
    cachedRead: async (f) => read(f), read: async (f) => read(f),
    getAbstractFileByPath: (p) => exists(p) ? fileOf(p) : null,
    getAllLoadedFiles: () => [{ path: '/', children: [] }, ...Object.keys(window.__dirs).map((p) => ({ path: p, children: [] })), ...Object.keys(window.__files).map((p) => ({ path: p }))],
    createFolder: async (p) => { window.__dirs[p] = 1; },
    create: async (p, t) => { if (p in window.__files || p in window.__notes) throw new Error('exists ' + p); if (p.endsWith('.md')) window.__notes[p] = t; else window.__files[p] = t; return fileOf(p); },
    adapter: { read: async (p) => { if (p in window.__files) return window.__files[p]; throw new Error('missing ' + p); } },
    modify: async (f, t) => { window.__files[f.path] = t; },
    process: async (f, fn) => { const cur = read(f); const next = fn(cur); if (f.path in window.__notes) window.__notes[f.path] = next; else window.__files[f.path] = next; return next; },
    delete: async (f) => { delete window.__files[f.path]; delete window.__notes[f.path]; },
    on: (ev, fn) => { window.__ev['vault:' + ev] = fn; return {}; },
  },
  workspace: {
    rootSplit: {}, getMostRecentLeaf: () => rootLeaf, setActiveLeaf() {},
    getLeaf: () => { const l = mk('main'); leaves.main.push(l); return l; },
    getRightLeaf: () => { const l = mk('right'); leaves.right.push(l); return l; },
    getLeavesOfType: (t) => t === 'canvas' ? [] : [...leaves.right, ...leaves.main].filter((l) => l.type === t),
    detachLeavesOfType: (t) => { window.__detached = t; }, revealLeaf() {}, onLayoutReady: (cb) => cb(),
    on: (ev, fn) => { if (ev === 'file-menu') window.__menu++; window.__ev[ev] = fn; return {}; },
    openLinkText: async () => {}, getActiveFile: () => window.__active ? fileOf(window.__active) : null,
  },
};
window.__leaves = leaves;
window.__run = async (code) => { const module = { exports: {} }; const O = { ItemView, Plugin, PluginSettingTab, Setting, FuzzySuggestModal, Notice }; new Function('module', 'require', code)(module, (id) => id === 'obsidian' ? O : {}); const P = module.exports; window.__plugin = new P(window.__app); await window.__plugin.onload(); };
undefined;
"""


@unittest.skipIf(sync_playwright is None or not MAIN.exists(), "playwright or built plugin unavailable")
class WorkbenchPlugin(unittest.TestCase):
    def test_right_panel_follows_note_and_opens_table_and_canvas_in_main_window(self):
        notes = {f"10_Model/{p.name}": p.read_text() for p in FIX.glob("*.md")}
        notes[PCE_PATH] = PCE.read_text()
        ISSUE = "10_Model/Issue Bad pin.md"
        notes[ISSUE] = "---\ntype: Issue\nid: ISS-1\nuid: uISS1\nstatus: Open\n---\n# Bad pin\n\n> [!flagNote] Check pin\n> Source: review.\n"
        errors = []
        PREVIEW = "99_System/22_Views/Workbench Preview.canvas"
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1300, "height": 850})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_default_timeout(8000)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; }", notes)
            pg.evaluate(FAKE)
            pg.evaluate("p => { window.__files[p] = '{}'; window.__dirs['99_System/22_Views'] = 1; }", PREVIEW)
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            pg.wait_for_function("p => !(p in window.__files)", arg=PREVIEW)
            self.assertEqual(pg.evaluate("window.__detached"), "mdse-workbench", "old main-window view retired")
            cmds = set(pg.evaluate("Object.keys(window.__cmds)"))
            self.assertTrue({"open", "refresh", "show-note", "table", "canvas", "save-canvas"} <= cmds, cmds)
            self.assertFalse(pg.evaluate("window.__cmds['save-canvas'].checkCallback(true)"), "nothing to save yet")

            # the panel opens in the RIGHT sidebar, with no browser of its own
            pg.evaluate("window.__active = null; window.__plugin.openPanel()")
            pg.wait_for_selector("text=No model note selected")
            self.assertEqual(pg.evaluate("window.__leaves.right.length"), 1)
            self.assertEqual(pg.locator("input[type=search]").count(), 0)

            # it follows the note Obsidian opens
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", PCE_PATH)
            pg.wait_for_selector("header >> text=PCE25")
            pg.evaluate("window.__ev['file-open']({ path: 'x.canvas', extension: 'canvas' })")
            self.assertIn("PCE25", pg.inner_text("header"))

            # table: opens in the main window for the selected note
            for lens in ("Tables", "Structure trace"):
                pg.click(f"button:has-text('{lens}')")
            pg.click("button:has-text('Table in main window')")
            pg.wait_for_function("window.__leaves.main.some(l => l.type === 'mdse-table')")
            self.assertEqual(pg.evaluate("window.__leaves.main.filter(l => l.type === 'mdse-table')[0].view.lens"), "structure")
            pg.wait_for_selector("table")

            # canvas: one scratch file in the main window, overwritten each time
            pg.click("button:has-text('Canvas in main window')")
            pg.wait_for_selector("text=/not saved/")
            pg.click("button:has-text('Canvas in main window')")
            self.assertEqual([k for k in pg.evaluate("Object.keys(window.__files)")], [PREVIEW])
            doc = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertTrue(any(n["type"] == "file" and n["file"] == PCE_PATH for n in doc["nodes"]))
            self.assertTrue(all(w[0] == "main" for w in pg.evaluate("window.__opened")), "never opened in the sidebar")

            # save: pick a folder, never overwrite, remember the choice
            self.assertTrue(pg.evaluate("window.__cmds['save-canvas'].checkCallback(true)"))
            pg.evaluate("(window.__sv = window.__plugin.saveWithPicker(), 0)")
            choices = pg.evaluate("window.__modal.getItems()")
            self.assertEqual(choices[0], "99_System/23_Saved_Views")
            self.assertNotIn("99_System/22_Views", choices)
            pg.evaluate("window.__modal.close(); window.__modal.onChooseItem('00 Product Definition/MHE')")
            pg.wait_for_function("Object.keys(window.__files).length === 2")
            pg.evaluate("(window.__sv = window.__plugin.saveWithPicker(), 0)")
            pg.evaluate("window.__modal.close(); window.__modal.onChooseItem('00 Product Definition/MHE')")
            pg.wait_for_function("Object.keys(window.__files).length === 3")
            self.assertTrue(any(k.endswith("(2).canvas") for k in pg.evaluate("Object.keys(window.__files)")))
            self.assertEqual(pg.evaluate("window.__data.lastFolder"), "00 Product Definition/MHE")
            # cancel: nothing written
            pg.evaluate("(window.__sv = window.__plugin.saveWithPicker(), 0)")
            pg.evaluate("window.__modal.close()")
            pg.wait_for_timeout(300)
            self.assertEqual(pg.evaluate("Object.keys(window.__files).length"), 3)

            # Review actions: validated, undoable, and only on notes in the index
            old = notes[ISSUE]
            msg = pg.evaluate("async p => { const r = await window.__plugin.updateNote(p, { kind: 'status', value: 'Closed' }); window.__u = r.undo; return r.message; }", ISSUE)
            self.assertIn("Closed", msg)
            self.assertIn("status: Closed", pg.evaluate("p => window.__notes[p]", ISSUE))
            self.assertEqual(pg.evaluate("window.__u()"), "Undone.")
            self.assertEqual(pg.evaluate("p => window.__notes[p]", ISSUE), old)
            pg.evaluate("async p => { const r = await window.__plugin.updateNote(p, { kind: 'removeFlag', type: 'flagNote', title: 'Check pin', nth: 0 }); window.__u = r.undo; }", ISSUE)
            self.assertNotIn("flagNote", pg.evaluate("p => window.__notes[p]", ISSUE))
            pg.evaluate("p => { window.__notes[p] += 'edited'; }", ISSUE)
            self.assertIn("changed since", pg.evaluate("async () => { try { await window.__u(); } catch (e) { return e.message; } }"))
            err = pg.evaluate("async () => { try { await window.__plugin.updateNote('nope.md', { kind: 'status', value: 'x' }); } catch (e) { return String(e.message); } }")
            self.assertIn("not in the index", err)
            err = pg.evaluate("async p => { try { await window.__plugin.updateNote(p, { kind: 'status', value: 'x' }); } catch (e) { return String(e.message); } }", PCE_PATH)
            self.assertIn("Issue notes only", err)

            pg.evaluate("window.__plugin.onunload()")
            pg.wait_for_function("p => !(p in window.__files)", arg=PREVIEW)
            b.close()
        self.assertEqual(errors, [])

    def test_edit_lens_adds_relationship_and_element_with_preview_and_undo(self):
        notes = {f"10_Model/{p.name}": p.read_text() for p in FIX.glob("*.md") if p.name != "README.md"}
        errors = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1300, "height": 900})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_default_timeout(8000)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; }", notes)
            pg.evaluate(FAKE)
            pg.evaluate("window.__files['.vault.yaml'] = 'author: skellyspencer'")
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            pg.evaluate("window.__active = null; window.__plugin.openPanel()")
            pg.wait_for_selector("text=No model note selected")
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/Charger.md")
            pg.wait_for_selector("header >> text=Charger")
            pg.click("button[role=tab]:has-text('Edit')")
            pg.click("button:has-text('Add relationship')")

            # relationship: dropdown of kinds, searchable target browser, preview diff, apply, undo
            pg.select_option("select[aria-label=Relationship]", "allocate")
            pg.fill("input[aria-label='Search targets']", "controller")
            pg.click(".pick .it:has-text('Controller')")
            pg.click("button:has-text('Preview')")
            pg.wait_for_selector(".diff .add:has-text('allocate')")
            before = pg.evaluate("p => window.__notes[p]", "10_Model/Charger.md")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /allocate .* to .*Controller/.test(window.__notes[p])", arg="10_Model/Charger.md")
            pg.wait_for_selector("button:has-text('Undo')")
            pg.click("button:has-text('Undo')")
            pg.wait_for_function("([p, t]) => window.__notes[p] === t", arg=["10_Model/Charger.md", before])
            pg.select_option("select[aria-label=Relationship]", "allocate")      # add it again and keep it for the change/remove steps below
            pg.fill("input[aria-label='Search targets']", "controller")
            pg.click(".pick .it:has-text('Controller')")
            pg.click("button:has-text('Preview')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /allocate .* to .*Controller/.test(window.__notes[p])", arg="10_Model/Charger.md")

            # "?" help: a short popover, one at a time, closed by the same button
            pg.click("button:has-text('Add relationship')")
            pg.locator(".mded .q").first.click()
            pg.wait_for_selector(".mded .hlp b")
            self.assertEqual(pg.locator(".mded .hlp").count(), 1)
            pg.locator(".mded .q").first.click()
            self.assertEqual(pg.locator(".mded .hlp").count(), 0)

            # element: folder datalist, new note appears in the vault and opens
            pg.click("button:has-text('Add element')")
            pg.select_option("select[aria-label=Class]", "Requirement")
            pg.select_option("select[aria-label=Subtype]", "functional")
            pg.fill("input[placeholder=Name]", "Fan shall run")
            pg.fill("textarea", "The fan shall run above 40 C.")
            pg.fill("input[list=mded-folders]", "10_Model/New")
            pg.click("button:has-text('Preview')")
            pg.wait_for_selector(".diff .add:has-text('requirement def')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("() => 'author: skellyspencer' && Object.keys(window.__notes).some(k => k.startsWith('10_Model/New/Fan shall run'))")
            made = pg.evaluate("() => Object.entries(window.__notes).find(([k]) => k.startsWith('10_Model/New/'))[1]")
            self.assertIn("doc /* The fan shall run above 40 C. */", made)
            self.assertRegex(made, r"uid: \d{17}skellyspencer")
            pg.click("button:has-text('Undo')")
            pg.wait_for_function("() => !Object.keys(window.__notes).some(k => k.startsWith('10_Model/New/'))")

            # change / properties / remove from the note's relationship list
            pg.click("button[role=tab]:has-text('Edit')")
            pg.click(".mded .tabs button:has-text('Relationships')")
            pg.wait_for_timeout(500)
            pg.wait_for_selector("table.rl")
            row = pg.locator("table.rl tr", has_text="allocatedTo").first
            row.locator("button:has-text('Edit')").click()
            pg.wait_for_selector("select[aria-label='Add property']")
            pg.select_option("select[aria-label='Add property']", "doc")
            pg.fill("textarea[aria-label=Description]", "Why this part exists")
            pg.select_option("select[aria-label='Add property']", "@custom")
            pg.locator(".prop input[placeholder=name]").fill("supplier")
            pg.locator(".prop input[placeholder=value]").fill("Acme")
            pg.click("button:has-text('Preview changes')")
            pg.wait_for_selector(".diff .add:has-text('attribute supplier')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /attribute supplier = \"Acme\"/.test(window.__notes[p]) && /doc \\/\\* Why this part exists/.test(window.__notes[p])", arg="10_Model/Charger.md")
            pg.click("button:has-text('Undo')")
            pg.wait_for_function("p => !/attribute supplier/.test(window.__notes[p])", arg="10_Model/Charger.md")
            # remove
            pg.click(".mded .tabs button:has-text('Relationships')")
            pg.locator("table.rl tr", has_text="allocatedTo").first.locator("button:has-text('Remove')").click()
            pg.wait_for_selector(".diff .del")
            cur = pg.evaluate("p => window.__notes[p]", "10_Model/Charger.md")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("([p, t]) => window.__notes[p] !== t && !/allocate .* to .*Controller/.test(window.__notes[p])", arg=["10_Model/Charger.md", cur])
            pg.click("button:has-text('Undo')")

            # a canvas line selected in Obsidian opens in the Edit lens
            ref = pg.evaluate("""() => { const ix = window.__plugin.ix; const e = ix.edges.find((x) => x.ref && x.ref.kind === 'member' && x.kind === 'allocatedTo' && x.to); return e.ref; }""")
            pg.evaluate("""r => { window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', canvas: { selection: new Set([{ id: 'e3~r~' + encodeURIComponent(JSON.stringify(r)) }]) } } }; }""", ref)
            self.assertTrue(pg.evaluate("window.__cmds['edit-canvas-line'].checkCallback(true)"))
            pg.evaluate("window.__cmds['edit-canvas-line'].checkCallback(false)")
            pg.wait_for_selector("select[aria-label='Add property']")
            b.close()
        self.assertEqual(errors, [])

    def test_ports_tab_adds_port_connection_and_flow_with_checks(self):
        notes = {f"10_Model/{q.name}": q.read_text() for q in (ROOT / "testing/fixtures/charger-ports").glob("*.md")}
        errors = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1300, "height": 1000})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_default_timeout(8000)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; }", notes)
            pg.evaluate(FAKE)
            pg.evaluate("window.__files['.vault.yaml'] = 'author: skellyspencer'")
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            pg.evaluate("window.__active = null; window.__plugin.openPanel()")
            pg.wait_for_selector("text=No model note selected")
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/Charger.md")
            pg.wait_for_selector("header >> text=Charger")
            pg.click("button[role=tab]:has-text('Edit')")
            pg.click(".mded .tabs button:has-text('Ports')")

            # a conjugated, counted port typed by a port definition chosen in the browser
            pg.select_option("select[aria-label=Add]", "port")
            pg.fill(".mded input[placeholder='e.g. dcOut']", "aux")
            pg.click(".mded details:has-text('Choose') summary")
            pg.fill("input[aria-label='Search targets']", "DcPort")
            pg.click(".pick .it:has-text('DcPort')")
            pg.check(".mded .hq:has-text('Conjugated') input[type=checkbox]")
            pg.fill(".mded input[placeholder^='e.g. 2 or']", "0..1")
            pg.click("button:has-text('Preview')")
            pg.wait_for_selector(".diff .add:has-text('port aux : ~')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /port aux : ~OBJ_00002::DcPort\\[0\\.\\.1\\];/.test(window.__notes[p])", arg="10_Model/Charger.md")

            # the "?" for conjugation opens the short definition
            pg.locator(".mded .hq:has-text('Conjugated') .q").click()
            pg.wait_for_selector(".mded .hlp b:has-text('Conjugated')")

            # a flow that runs against the direction is refused with the reason
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/Station.md")
            pg.wait_for_selector("header >> text=Station")
            pg.click(".mded .tabs button:has-text('Ports')")
            pg.select_option("select[aria-label=Add]", "flow")
            pg.fill(".mded input[placeholder='e.g. charger.dcOut']:nth-of-type(1)", "battery.dcIn.flowOut")
            pg.locator(".mded input[list=mded-paths]").nth(1).fill("charger.dcOut.flowOut")
            pg.click("button:has-text('Preview')")
            pg.wait_for_selector(".callout:has-text('a flow starts at an out')")
            pg.locator(".mded input[list=mded-paths]").nth(0).fill("charger.dcOut.flowOut")
            pg.locator(".mded input[list=mded-paths]").nth(1).fill("battery.dcIn.flowOut")
            pg.click("button:has-text('Preview')")
            pg.wait_for_selector(".diff .add:has-text('flow from charger.dcOut.flowOut to battery.dcIn.flowOut')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /flow from charger.dcOut.flowOut to battery.dcIn.flowOut;/.test(window.__notes[p])", arg="10_Model/Station.md")
            # and it can be removed again from the list
            pg.locator(".mded table.rl tr:has-text('flow from') button:has-text('Remove')").click()
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => !/flow from/.test(window.__notes[p])", arg="10_Model/Station.md")
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
