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
window.__files = {}; window.__dirs = {}; window.__notices = []; window.__opened = []; window.__cmds = {}; window.__menu = 0; window.__data = null; let views = {};
class ItemView { constructor(leaf) { this.leaf = leaf; this.app = window.__app; this.contentEl = document.createElement('div'); this.contentEl.empty = function () { this.replaceChildren(); }; document.body.append(this.contentEl); } }
class Plugin { constructor(app) { this.app = app; } addCommand(c) { window.__cmds[c.id] = c; } registerView(t, f) { views[t] = f; } addRibbonIcon() {} registerEvent() {} addSettingTab(t) { window.__tab = t; } async loadData() { return window.__data; } async saveData(d) { window.__data = JSON.parse(JSON.stringify(d)); } }
class PluginSettingTab { constructor(app, plugin) { this.app = app; this.containerEl = document.createElement('div'); this.containerEl.empty = function () { this.replaceChildren(); }; } }
class Setting { constructor(el) { this.el = el; } setName() { return this; } setDesc() { return this; } addText(f) { const inp = document.createElement('input'); this.el.append(inp); const api = { setPlaceholder() { return api; }, setValue(v) { inp.value = v; return api; }, onChange(cb) { inp.oncb = cb; return api; } }; f(api); window.__setting = inp; return this; } }
class FuzzySuggestModal { constructor(app) {} setPlaceholder() {} open() { window.__modal = this; } close() { this.onClose && this.onClose(); } }
class Notice { constructor(m) { window.__notices.push(m); } }
const isDir = (p) => p in window.__dirs;
const fileOf = (path) => isDir(path) ? { path, children: [] } : { path, extension: path.split('.').pop() };
let current = null;
const leaf = { async setViewState(s) { this.view = views[s.type](this); current = this.view; await this.view.onOpen(); }, async openFile(f) { window.__opened.push(f.path); }, view: null };
window.__app = {
  vault: {
    getMarkdownFiles: () => Object.keys(window.__notes).map(fileOf),
    cachedRead: async (f) => window.__notes[f.path] ?? window.__files[f.path],
    read: async (f) => window.__files[f.path],
    getAbstractFileByPath: (p) => (p in window.__notes || p in window.__files || isDir(p)) ? fileOf(p) : null,
    getAllLoadedFiles: () => [{ path: '/', children: [] }, ...Object.keys(window.__dirs).map((p) => ({ path: p, children: [] })), ...Object.keys(window.__files).map((p) => ({ path: p }))],
    createFolder: async (p) => { window.__dirs[p] = 1; },
    create: async (p, t) => { if (p in window.__files) throw new Error('exists ' + p); window.__files[p] = t; return fileOf(p); },
    modify: async (f, t) => { window.__files[f.path] = t; },
    delete: async (f) => { delete window.__files[f.path]; },
    on: () => ({}),
  },
  workspace: { getLeaf: () => leaf, getLeavesOfType: (t) => (t === 'canvas' ? [] : current ? [leaf] : []), revealLeaf() {}, onLayoutReady: (cb) => cb(), on: (ev) => { if (ev === 'file-menu') window.__menu++; return {}; },
    openLinkText: async () => {}, getActiveFile: () => fileOf(window.__active) },
};
window.__run = async (code) => { const module = { exports: {} }; const O = { ItemView, Plugin, PluginSettingTab, Setting, FuzzySuggestModal, Notice }; new Function('module', 'require', code)(module, (id) => id === 'obsidian' ? O : {}); const P = module.exports; window.__plugin = new P(window.__app); await window.__plugin.onload(); };
undefined;
"""


@unittest.skipIf(sync_playwright is None or not MAIN.exists(), "playwright or built plugin unavailable")
class WorkbenchPlugin(unittest.TestCase):
    def test_plugin_opens_shows_table_and_previews_canvas_without_keeping_it(self):
        notes = {f"10_Model/{p.name}": p.read_text() for p in FIX.glob("*.md")}
        notes[PCE_PATH] = PCE.read_text()
        errors = []
        PREVIEW = "99_System/22_Views/Workbench Preview.canvas"
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1300, "height": 850})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; window.__active = null; }", notes)
            pg.evaluate(FAKE)
            # a stale preview left by an earlier session is removed when the plugin loads
            pg.evaluate("p => { window.__files[p] = '{}'; window.__dirs['99_System/22_Views'] = 1; }", PREVIEW)
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            pg.wait_for_function("p => !(p in window.__files)", arg=PREVIEW)
            cmds = set(pg.evaluate("Object.keys(window.__cmds)"))
            self.assertTrue({"open", "refresh", "show-note", "canvas", "save-canvas"} <= cmds, cmds)
            self.assertFalse(pg.evaluate("window.__cmds['save-canvas'].checkCallback(true)"), "nothing to save yet")
            self.assertGreaterEqual(pg.evaluate("window.__menu"), 1, "file menu registered")

            pg.evaluate("window.__plugin.open()")
            pg.wait_for_selector("text=/\\d+ notes/")
            pg.click("button[role=tab]:has-text('Notes')")
            self.assertIn("PCE25", pg.inner_text(".mdw"))

            # preview: one scratch file, overwritten each time, nothing named is kept
            pg.evaluate("p => window.__plugin.open(p)", PCE_PATH)
            pg.click("button[role=tab]:has-text('Graph')")
            self.assertEqual(pg.locator("button:has-text('Save canvas')").count(), 0)
            for _ in range(2):
                pg.click("button:has-text('Open as Canvas')")
                pg.wait_for_selector("text=/Preview opened, not saved/")
            self.assertEqual(pg.evaluate("Object.keys(window.__files)"), [PREVIEW])
            doc = json.loads(pg.evaluate("p => window.__files[p]", PREVIEW))
            self.assertTrue(any(n["type"] == "file" and n["file"] == PCE_PATH for n in doc["nodes"]))
            self.assertEqual(pg.evaluate("window.__opened.length"), 2)

            # save: pick a project folder, never overwrite, remember the choice
            self.assertTrue(pg.evaluate("window.__cmds['save-canvas'].checkCallback(true)"))
            pg.click("button:has-text('Save canvas')")
            choices = pg.evaluate("window.__modal.getItems()")
            self.assertEqual(choices[0], "99_System/23_Saved_Views", "default folder first")
            self.assertNotIn("99_System/22_Views", choices, "scratch folder is never offered")
            pg.evaluate("window.__modal.close(); window.__modal.onChooseItem('00 Product Definition/MHE')")
            pg.wait_for_selector("text=/Saved to 00 Product Definition\\/MHE\\/PCE25 - Structure/")
            saved = [k for k in pg.evaluate("Object.keys(window.__files)") if k != PREVIEW]
            self.assertEqual(len(saved), 1); self.assertTrue(saved[0].startswith("00 Product Definition/MHE/PCE25 - ") and saved[0].endswith(".canvas"))
            self.assertEqual(pg.evaluate("p => window.__files[p]", saved[0]), pg.evaluate("p => window.__files[p]", PREVIEW))
            pg.click("button:has-text('Save canvas')")
            self.assertEqual(pg.evaluate("window.__modal.getItems()")[:2], ["99_System/23_Saved_Views", "00 Product Definition/MHE"], "last folder second")
            pg.evaluate("window.__modal.close(); window.__modal.onChooseItem('00 Product Definition/MHE')")
            pg.wait_for_function("Object.keys(window.__files).length === 3")
            self.assertTrue(any(k.endswith("(2).canvas") for k in pg.evaluate("Object.keys(window.__files)")))
            self.assertEqual(pg.evaluate("window.__data.lastFolder"), "00 Product Definition/MHE")

            # cancel: nothing written
            pg.click("button:has-text('Save canvas')")
            pg.evaluate("window.__modal.close()")
            pg.wait_for_selector("text=/Save cancelled/")
            self.assertEqual(pg.evaluate("Object.keys(window.__files).length"), 3)

            # command path writes only the preview; a note that is not a model note is refused
            pg.evaluate("p => { window.__active = p; }", PCE_PATH)
            self.assertTrue(pg.evaluate("window.__cmds.canvas.checkCallback(true)"))
            pg.evaluate("window.__cmds.canvas.checkCallback(false)")
            pg.evaluate("window.__modal.onChooseItem({ name: 'Allocation' })")
            pg.wait_for_function("window.__notices.length > 0")
            self.assertRegex(pg.evaluate("window.__notices[0]"), r"Preview opened, not saved.*not in vault")
            self.assertEqual(pg.evaluate("Object.keys(window.__files).length"), 3)
            pg.evaluate("window.__active = '99_System/x.canvas'")
            self.assertFalse(pg.evaluate("window.__cmds.canvas.checkCallback(true)"))

            # unload removes the preview
            pg.evaluate("window.__plugin.onunload()")
            pg.wait_for_function("p => !(p in window.__files)", arg=PREVIEW)
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
