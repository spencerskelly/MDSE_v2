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
window.__files = {}; window.__dirs = {}; window.__notices = []; window.__opened = []; window.__cmds = {}; window.__menu = 0; window.__data = null; window.__ev = {}; window.__where = []; window.__active = null; window.__evs = {}; let views = {};
class ItemView { constructor(leaf) { this.leaf = leaf; this.app = window.__app; this.contentEl = document.createElement('div'); this.contentEl.empty = function () { this.replaceChildren(); }; document.body.append(this.contentEl); } }
class Plugin { constructor(app) { this.app = app; } addCommand(c) { window.__cmds[c.id] = c; } registerView(t, f) { views[t] = f; } addRibbonIcon() {} registerEvent(e) { return e; } registerDomEvent(el, ev, fn) { el.addEventListener(ev, fn); } registerInterval(id) { return id; } addSettingTab(t) { window.__tab = t; } async loadData() { return window.__data; } async saveData(d) { window.__data = JSON.parse(JSON.stringify(d)); } }
class PluginSettingTab { constructor(app, plugin) { this.app = app; this.containerEl = document.createElement('div'); this.containerEl.empty = function () { this.replaceChildren(); }; } }
const deco = (e) => { e.empty = function () { this.replaceChildren(); }; e.setText = function (t) { this.textContent = t; }; e.createEl = function (tag, o = {}) { const c = deco(document.createElement(tag)); if (o.text) c.textContent = o.text; if (o.cls) c.className = o.cls; this.append(c); return c; }; e.createDiv = function (o = {}) { return this.createEl('div', o); }; return e; };
class Setting { constructor(el) { this.el = el; this.name = ''; } setName(n) { this.name = n; return this; } setDesc() { return this; }
  addText(f) { const inp = document.createElement('input'); inp.setAttribute('aria-label', this.name); this.el.append(inp); const api = { setPlaceholder() { return api; }, setValue(v) { inp.value = v; return api; }, onChange(cb) { inp.oncb = cb; inp.addEventListener('input', () => cb(inp.value)); return api; } }; f(api); return this; }
  addDropdown(f) { const sel = document.createElement('select'); sel.setAttribute('aria-label', this.name); this.el.append(sel); const api = { addOption(v, l) { const o = document.createElement('option'); o.value = v; o.textContent = l; sel.append(o); return api; }, setValue(v) { sel.value = v; return api; }, onChange(cb) { sel.addEventListener('change', () => cb(sel.value)); return api; } }; f(api); return this; } }
class Modal { constructor(app) { this.app = app; this.contentEl = deco(document.createElement('div')); this.contentEl.className = 'fake-modal'; document.body.append(this.contentEl); } open() { window.__relate = this; this.onOpen(); } close() { this.onClose && this.onClose(); this.contentEl.remove(); } }
class FuzzySuggestModal { constructor(app) {} setPlaceholder() {} open() { window.__modal = this; } close() { this.onClose && this.onClose(); } }
class Notice { constructor(m) { if (typeof m === 'string') window.__notices.push(m); else { window.__notices.push(m.textContent); const d = document.createElement('div'); d.className = 'fake-notice'; d.append(m); document.body.append(d); } } }
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
    on: (ev, fn) => { window.__ev['vault:' + ev] = fn; (window.__evs['vault:' + ev] ||= []).push(fn); return {}; },
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
window.__run = async (code) => { const module = { exports: {} }; const O = { ItemView, Plugin, PluginSettingTab, Setting, FuzzySuggestModal, Modal, Notice }; new Function('module', 'require', code)(module, (id) => id === 'obsidian' ? O : {}); const P = module.exports; window.__plugin = new P(window.__app); await window.__plugin.onload(); };
undefined;
"""


GROUP = {"Tables": "Model", "Structure": "Note"}


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
            for lens in ("Tables", "Structure"):
                pg.select_option(f"select[aria-label='{GROUP[lens]} menu']", label=lens)
            pg.click("button:has-text('Table in main window')")
            pg.wait_for_function("window.__leaves.main.some(l => l.type === 'mdse-table')")
            self.assertEqual(pg.evaluate("window.__leaves.main.filter(l => l.type === 'mdse-table')[0].view.lens"), "structure")
            pg.wait_for_selector("table")
            # a table opened after the index was built must be handed it, not sit on "Reading notes…"
            pg.wait_for_function("() => { const v = window.__leaves.main.filter(l => l.type === 'mdse-table')[0].view; return v.contentEl.querySelector('table') && !/Reading notes/.test(v.contentEl.textContent); }")

            # canvas: one scratch file in the main window, overwritten each time
            pg.click("button:has-text('Canvas in main window')")
            pg.wait_for_selector("text=/not saved/")
            pg.click("button:has-text('Canvas in main window')")
            self.assertEqual([k for k in pg.evaluate("Object.keys(window.__files)")], [PREVIEW])
            doc = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertTrue(any(n["type"] == "text" and n["text"].startswith("**[[" + PCE_PATH[:-3] + "|") for n in doc["nodes"]))
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
            pg.select_option("select[aria-label='Note menu']", label="Edit")
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
            pg.wait_for_function("() => 'author: skellyspencer' && Object.keys(window.__notes).some(k => /^10_Model\\/New\\/REQ-\\d{5}\\.md$/.test(k))")
            made = pg.evaluate("() => Object.entries(window.__notes).find(([k]) => k.startsWith('10_Model/New/'))[1]")
            self.assertIn("doc /* The fan shall run above 40 C. */", made)
            self.assertIn("name: Fan shall run", made)
            self.assertRegex(made, r"uid: \d{17}skellyspencer")
            pg.click("button:has-text('Undo')")
            pg.wait_for_function("() => !Object.keys(window.__notes).some(k => k.startsWith('10_Model/New/'))")

            # change / properties / remove from the note's relationship list
            pg.select_option("select[aria-label='Note menu']", label="Edit")
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

    def test_a_line_drawn_on_the_canvas_becomes_a_relationship_through_the_dropdown(self):
        notes = {f"10_Model/{p.name}": p.read_text() for p in FIX.glob("*.md") if p.name != "README.md"}
        errors = []
        PREVIEW = "99_System/22_Views/Workbench Preview.canvas"
        A, B = "10_Model/Controller.md", "10_Model/Power Module.md"
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
            pg.evaluate("p => { window.__active = p; }", "10_Model/Charger.md")
            pg.evaluate("window.__plugin.openPanel()")
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/Charger.md")
            pg.wait_for_selector("header >> text=Charger")
            pg.evaluate("(window.__oc = window.__plugin.openCanvas('structure', {}), 0)")
            pg.wait_for_function("p => p in window.__files", arg=PREVIEW)

            def draw(edge_id, a, b_):
                """What Obsidian writes when the person drags a line between two cards (its own random id)."""
                pg.evaluate("""([p, id, a, b]) => {
                    const doc = JSON.parse(window.__files[p]);
                    const card = (path) => { let n = doc.nodes.find((x) => x.file === path || (x.text || '').startsWith('**[[' + path.replace(/\\.md$/, '') + '|')); if (!n) { n = { id: 'c' + doc.nodes.length, type: 'file', x: 0, y: 800, width: 280, height: 90, file: path }; doc.nodes.push(n); } return n.id; };
                    doc.edges.push({ id, fromNode: card(a), toNode: card(b), fromSide: 'right', toSide: 'left', toEnd: 'arrow' });
                    window.__files[p] = JSON.stringify(doc);
                    for (const f of window.__evs['vault:modify']) f({ path: p, extension: 'canvas' });
                }""", [PREVIEW, edge_id, a, b_])

            # draw, pick a kind from the dropdown, see the diff, apply: the note gets the relationship and the line is labelled
            before = pg.evaluate("p => window.__notes[p]", A)
            draw("9f3a1c7e5b2d4a60", A, B)
            pg.wait_for_selector(".fake-modal select[aria-label=Relationship]")
            kinds = pg.evaluate("[...document.querySelectorAll('.fake-modal select[aria-label=Relationship] option')].map(o => o.value)")
            self.assertIn("dependsOn", kinds)
            pg.select_option(".fake-modal select[aria-label=Relationship]", "dependsOn")
            pg.wait_for_function("document.querySelector('.fake-modal pre').textContent.includes('+ ') && document.querySelector('.fake-modal pre').textContent.includes('dependency from')")
            self.assertEqual(pg.evaluate("p => window.__notes[p]", A), before, "nothing is written until Apply")
            pg.click(".fake-modal button:has-text('Apply')")
            pg.wait_for_function("p => /dependency from .* to .*PowerModule.*dependsOn/.test(window.__notes[p])", arg=A)
            pg.wait_for_selector(".fake-notice button:has-text('Undo')")
            doc = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertEqual([e.get("label") for e in doc["edges"] if e["id"] == "9f3a1c7e5b2d4a60"], ["depends on"])

            # undo restores the note and takes the line off the canvas
            pg.click(".fake-notice button:has-text('Undo')")
            pg.wait_for_function("([p, t]) => window.__notes[p] === t", arg=[A, before])
            pg.wait_for_function("p => !JSON.parse(window.__files[p]).edges.some((e) => e.id === '9f3a1c7e5b2d4a60')", arg=PREVIEW)

            # cancel: nothing written, line removed
            draw("11aa22bb33cc44dd", A, B)
            pg.wait_for_selector(".fake-modal button:has-text('Cancel')")
            pg.click(".fake-modal button:has-text('Cancel')")
            pg.wait_for_function("p => !JSON.parse(window.__files[p]).edges.some((e) => e.id === '11aa22bb33cc44dd')", arg=PREVIEW)
            self.assertEqual(pg.evaluate("p => window.__notes[p]", A), before)

            # a line that is not between two notes is refused with a reason and removed
            pg.evaluate("""p => { const doc = JSON.parse(window.__files[p]); doc.nodes.push({ id: 'free1', type: 'text', x: 0, y: 1200, width: 200, height: 80, text: 'just a thought' }); doc.edges.push({ id: '77ee88ff99aa00bb', fromNode: doc.nodes[0].id, toNode: 'free1', fromSide: 'right', toSide: 'left', toEnd: 'arrow' }); window.__files[p] = JSON.stringify(doc); for (const f of window.__evs['vault:modify']) f({ path: p, extension: 'canvas' }); }""", PREVIEW)
            pg.wait_for_function("window.__notices.some((n) => /joins two notes/.test(n))")
            pg.wait_for_function("p => !JSON.parse(window.__files[p]).edges.some((e) => e.id === '77ee88ff99aa00bb')", arg=PREVIEW)

            # pick notes by a word in the name or description, tick some, place them on a canvas (D-0078)
            pg.select_option("select[aria-label='Canvas menu']", label="Pick notes")
            pg.fill("input[aria-label='Search for notes to place on a canvas']", "o")
            pg.keyboard.press("Tab")
            pg.wait_for_selector("text=/\\d+ match/")
            pg.click("button:has-text('Tick all listed')")
            self.assertRegex(pg.inner_text("body"), r"[1-9]\d* ticked")
            pg.click("button:has-text('New canvas')")
            pg.wait_for_selector("text=/Canvas preview opened/")
            picked = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertTrue(any(n["type"] == "text" and n["text"].startswith("**[[" + A[:-3] + "|") for n in picked["nodes"]), "the ticked note is on the canvas")
            self.assertTrue(any(n["type"] == "group" and n.get("label") for n in picked["nodes"]), "boxed by type")
            self.assertTrue(all(n["type"] == "text" for n in picked["nodes"] if n["type"] != "group") and len(picked["nodes"]) >= 3)

            # a card chosen on the canvas becomes the selected note, and its related notes can be added to the canvas (D-0082)
            T, title = pg.evaluate("""() => { const ix = window.__plugin.ix, e = ix.edges.find((x) => x.to && !x.reverse && x.from !== x.to); return [e.to, ix.notes.get(e.to).title]; }""")
            pg.evaluate("p => window.__plugin.openPickCanvas([p], '', false, false, true)", T)
            pg.wait_for_function("p => JSON.parse(window.__files['99_System/22_Views/Workbench Preview.canvas']).nodes.length === 1")
            pg.evaluate("""p => { window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', canvas: { selection: new Set([{ getData: () => ({ type: 'text', text: '**[[' + p.slice(0, -3) + '|x]]**' }) }]) } } }; document.dispatchEvent(new Event('pointerup')); }""", T)
            pg.wait_for_selector(f"header >> text={title}")
            pg.select_option("select[aria-label='Note menu']", label="Note")
            pg.click("summary:has-text('Add related notes to the canvas')")
            pg.click("button:has-text('related to canvas')")
            pg.wait_for_selector("text=/Added \\d+ note/")
            added = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertGreaterEqual(len([n for n in added["nodes"] if n["type"] == "text"]), 2, "related notes were added beside the card")
            self.assertTrue(added["edges"], "and joined to it by a line")

            # two or more cards chosen on the canvas open the Common related lens, found by the 300 ms look, without any click (D-0084)
            two = pg.evaluate("""() => { const e = window.__plugin.ix.edges.find((x) => x.to && !x.reverse && x.from !== x.to); return [e.from, e.to]; }""")
            pg.evaluate("""ps => { const card = (p) => ({ getData: () => ({ type: 'text', text: '**[[' + p.slice(0, -3) + '|x]]**' }) }); window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', canvas: { selection: new Set(ps.map(card)) } } }; }""", two)
            pg.wait_for_selector("text=Chosen on the canvas", timeout=3000)
            self.assertEqual(pg.evaluate("document.querySelector(\"select[aria-label='Canvas menu']\").selectedOptions[0].textContent"), "Common related")
            pg.wait_for_selector("text=/Related to all 2/")
            # one card again: back to the note
            pg.evaluate("""p => { window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', canvas: { selection: new Set([{ getData: () => ({ type: 'text', text: '**[[' + p.slice(0, -3) + '|x]]**' }) }]) } } }; }""", two[0])
            pg.wait_for_function("document.querySelector(\"select[aria-label='Note menu']\").selectedOptions[0].textContent === 'Note'", timeout=3000)

            # Structure view: full tree or direct parts, and tick rows to add to the canvas (D-0085)
            pg.select_option("select[aria-label='Note menu']", label="Structure")
            pg.wait_for_selector("select[aria-label='How much of the structure']")
            pg.select_option("select[aria-label='How much of the structure']", label="Direct parts only")
            pg.wait_for_selector("button:has-text('Add ticked to canvas')")
            pg.click("button:has-text('Add ticked to canvas')")
            pg.wait_for_selector("text=Tick at least one row first.")
            pg.locator("input[aria-label='Tick for the canvas']").first.check()
            pg.click("button:has-text('Add ticked to canvas')")
            pg.wait_for_selector("text=/Added \\d+ note|already on the canvas/")
            pg.click("button:has-text('shown to canvas')")
            pg.wait_for_selector("text=/Added \\d+ note|already on the canvas/")
            # children go in a row below the parent (D-0090)
            if pg.locator("button:has-text('children to canvas')").count():
                pg.click("button:has-text('children to canvas')")
                pg.wait_for_selector("text=/Added \\d+ note|already on the canvas/")
            # a canvas of this view (D-0088): complete BOM and direct parts
            pg.evaluate("window.__files['99_System/22_Views/Workbench Preview.canvas'] = ''")
            for label in ("Canvas: complete BOM", "Canvas: direct parts"):
                pg.click(f"button:has-text('{label}')")
                pg.wait_for_function("() => { const t = window.__files['99_System/22_Views/Workbench Preview.canvas']; return !!t && JSON.parse(t).nodes.length > 0; }", timeout=4000)
                doc = pg.evaluate("JSON.parse(window.__files['99_System/22_Views/Workbench Preview.canvas'])")
                self.assertTrue(all(e["fromSide"] == "bottom" and e["toSide"] == "top" for e in doc["edges"]), label)
                pg.evaluate("window.__files['99_System/22_Views/Workbench Preview.canvas'] = ''")
                pg.wait_for_selector("button:has-text('Canvas: direct parts')")
            # the canvas open in the main window is the one added to, and nothing on it moves (D-0089)
            pg.evaluate("""() => { window.__files['Mine.canvas'] = JSON.stringify({ nodes: [{ id: 'memo', type: 'text', x: 5, y: 7, width: 100, height: 50, text: 'mine' }], edges: [] });
              window.__files['99_System/22_Views/Workbench Preview.canvas'] = ''; window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', file: { path: 'Mine.canvas' }, canvas: { selection: new Set() }, save: async () => {} } }; }""")
            pg.click("button:has-text('shown to canvas')")
            pg.wait_for_function("() => JSON.parse(window.__files['Mine.canvas']).nodes.length > 1", timeout=4000)
            mine = pg.evaluate("JSON.parse(window.__files['Mine.canvas'])")
            self.assertEqual([n for n in mine["nodes"] if n["id"] == "memo"][0]["x"], 5)
            self.assertEqual(pg.evaluate("window.__files['99_System/22_Views/Workbench Preview.canvas']"), "", "the preview was not touched")
            # auto-layout is a separate action
            pg.evaluate("""() => { const d = JSON.parse(window.__files['Mine.canvas']); const keep = d.nodes.filter((n) => n.id !== 'memo'), other = [...window.__plugin.ix.notes.keys()].find((k) => !keep.some((n) => n.text.includes(k.slice(0, -3))));
              d.nodes.push({ id: 'pile', type: 'text', x: keep[0].x, y: keep[0].y, width: 280, height: 90, text: '**[[' + other.slice(0, -3) + '|x]]**' }); window.__files['Mine.canvas'] = JSON.stringify(d); }""")
            scrambled = pg.evaluate("window.__files['Mine.canvas']")
            pg.click("button:has-text('Auto-layout canvas')")
            pg.wait_for_function("s => window.__files['Mine.canvas'] !== s", arg=scrambled, timeout=4000)
            laid = pg.evaluate("JSON.parse(window.__files['Mine.canvas'])")
            self.assertEqual([n for n in laid["nodes"] if n["id"] == "memo"][0]["y"], 7)
            pg.click("button:has-text('Refresh canvas')")
            pg.wait_for_selector("text=/already matches the vault|Refreshed Mine.canvas/")
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
            pg.select_option("select[aria-label='Note menu']", label="Edit")
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

    def test_merge_has_its_own_entry_points_and_takes_two_chosen_notes(self):
        notes = {f"10_Model/{q.name}": q.read_text() for q in (ROOT / "testing/fixtures/charger-merge").glob("*.md")}
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
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/CHG-1.md")
            pg.wait_for_selector("header >> text=CHG-1")
            # compare (D-0092)
            pg.select_option("select[aria-label='Note menu']", label="Compare notes")
            pg.wait_for_selector("text=Choose the second note above.")
            pg.select_option("select[aria-label='Note to compare with']", value="10_Model/Charger.md")
            pg.wait_for_selector("text=Properties that differ")
            pg.wait_for_selector("text=Structure, down to the parts that differ")
            pg.wait_for_selector("text=/\\d+ differences?:/")
            # from the note itself
            pg.select_option("select[aria-label='Note menu']", label="Note")
            pg.click("button:has-text('Merge with another note')")
            pg.wait_for_selector("text=/as the same part as/")
            # from the Note menu
            pg.select_option("select[aria-label='Model menu']", label="Dashboard")
            pg.select_option("select[aria-label='Note menu']", label="Merge notes")
            pg.wait_for_selector("text=/as the same part as/")
            # two notes chosen on the canvas: the other one is already picked, and the BOM part stays
            pg.select_option("select[aria-label='Canvas menu']", label="Common related")
            pg.evaluate("""ps => { const card = (p) => ({ getData: () => ({ type: 'text', text: '**[[' + p.slice(0, -3) + '|x]]**' }) }); window.__app.workspace.activeLeaf = { view: { getViewType: () => 'canvas', canvas: { selection: new Set(ps.map(card)) } } }; }""", ["10_Model/Charger.md", "10_Model/CHG-1.md"])
            pg.click("button:has-text('Merge these two')")
            pg.wait_for_selector("text=/as the same part as/")
            self.assertEqual(pg.locator("select[aria-label='Which note stays']").input_value(), "other", "CHG-1 is the BOM part, so it stays")
            pg.click("button:has-text('Preview alias')")
            pg.wait_for_selector(".diff .add:has-text('aliasOf')")
            # one step: merge now keeps the BOM note and retires the other (D-0091)
            pg.click("button:has-text('Merge now')")
            pg.wait_for_selector("text=Who owns what")
            pg.click("button:has-text('Preview merge')")
            pg.wait_for_selector(".callout:has-text('retired after merging')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("() => /status: Retired/.test(window.__notes['10_Model/Charger.md'])", timeout=4000)
            stub = pg.evaluate("window.__notes['10_Model/Charger.md']")
            self.assertIn("mergedInto", stub); self.assertNotIn("```sysml", stub)
            self.assertNotIn("status: Retired", pg.evaluate("window.__notes['10_Model/CHG-1.md']"))
            self.assertNotIn("aliasOf", pg.evaluate("window.__notes['10_Model/CHG-1.md']"))
            self.assertEqual(errors, [])
            b.close()

    def test_merge_tab_finds_matches_marks_aliases_merges_and_undoes(self):
        notes = {f"10_Model/{q.name}": q.read_text() for q in (ROOT / "testing/fixtures/charger-merge").glob("*.md")}
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
            pg.evaluate("p => window.__ev['file-open']({ path: p, extension: 'md' })", "10_Model/CHG-1.md")
            pg.wait_for_selector("header >> text=CHG-1")
            pg.select_option("select[aria-label='Note menu']", label="Edit")
            pg.click(".mded .tabs button:has-text('Merge')")

            # the EA part number matches the BOM number: a confident match, ticked for us
            pg.click("button:has-text('Find matches')")
            pg.wait_for_selector("tr:has-text('CHG-1'):has-text('Charger'):has-text('PN')")
            self.assertTrue(pg.locator("input[aria-label='Alias Charger']").is_checked())
            pg.click("button:has-text('Mark ticked as aliases')")
            pg.wait_for_selector(".diff .add:has-text('aliasOf')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("p => /aliasOf: \\[\"\\[\\[CHG-1\\]\\]\"\\]/.test(window.__notes[p])", arg="10_Model/Charger.md")

            # the pair is listed; merging shows what is removed, then writes it
            pg.wait_for_selector("table.rl tr:has-text('Charger'):has-text('CHG-1') button:has-text('Merge')")
            pg.click("table.rl tr:has-text('Charger') button:has-text('Merge')")
            # the owner table: seven areas, every area defaults to keeping both
            pg.wait_for_selector("text=Who owns what")
            self.assertEqual(pg.locator("select[aria-label^='Owner of']").count(), 7)
            self.assertEqual(pg.locator("select[aria-label='Owner of Part facts']").input_value(), "both")
            self.assertEqual(pg.locator("select[aria-label='Owner of Structure']").input_value(), "both")
            self.assertEqual(pg.locator("select[aria-label='Owner of Interfaces and connections']").input_value(), "both")
            pg.click("button:has-text('Preview merge')")
            pg.wait_for_selector(".callout:has-text('retired after merging')")
            pg.click("button:has-text('Apply')")
            pg.wait_for_function("() => /status: Retired/.test(window.__notes['10_Model/Charger.md'] || '')")
            merged = pg.evaluate("p => window.__notes[p]", "10_Model/CHG-1.md")
            self.assertIn("port dcOut : OBJ_00001::DcPort;", merged)
            self.assertIn("## Former ids", merged)
            station = pg.evaluate("p => window.__notes[p]", "10_Model/Station.md")
            self.assertIn("[[CHG-1|Charger]]", station)
            self.assertIn("part charger : OBJ_00003::P_CHG_1;", station)

            # undo brings the retired note's content and every rewritten link back
            pg.click("button:has-text('Undo')")
            pg.wait_for_function("() => !/status: Retired/.test(window.__notes['10_Model/Charger.md'] || '')")
            self.assertIn("[[Charger]]", pg.evaluate("p => window.__notes[p]", "10_Model/Station.md"))
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
