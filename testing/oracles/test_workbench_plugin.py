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
window.__files = {}; window.__notices = []; window.__opened = []; window.__cmds = {}; window.__menu = 0; let views = {};
class ItemView { constructor(leaf) { this.leaf = leaf; this.app = window.__app; this.contentEl = document.createElement('div'); this.contentEl.empty = function () { this.replaceChildren(); }; document.body.append(this.contentEl); } }
class Plugin { constructor(app) { this.app = app; } addCommand(c) { window.__cmds[c.id] = c; } registerView(t, f) { views[t] = f; } addRibbonIcon() {} registerEvent() {} }
class FuzzySuggestModal { constructor(app) {} setPlaceholder() {} open() { window.__modal = this; } }
class Notice { constructor(m) { window.__notices.push(m); } }
const fileOf = (path) => ({ path, extension: path.split('.').pop() });
let current = null;
const leaf = { async setViewState(s) { this.view = views[s.type](this); current = this.view; await this.view.onOpen(); }, async openFile(f) { window.__opened.push(f.path); }, view: null };
window.__app = {
  vault: {
    getMarkdownFiles: () => Object.keys(window.__notes).map(fileOf),
    cachedRead: async (f) => window.__notes[f.path] ?? window.__files[f.path],
    getAbstractFileByPath: (p) => (p in window.__notes || p in window.__files || p in (window.__dirs ||= {})) ? fileOf(p) : null,
    createFolder: async (p) => { (window.__dirs ||= {})[p] = 1; },
    create: async (p, t) => { window.__files[p] = t; return fileOf(p); },
    modify: async (f, t) => { window.__files[f.path] = t; },
    on: () => ({}),
  },
  workspace: { getLeaf: () => leaf, getLeavesOfType: () => (current ? [leaf] : []), revealLeaf() {}, onLayoutReady: (cb) => cb(), on: (ev) => { if (ev === 'file-menu') window.__menu++; return {}; },
    openLinkText: async () => {}, getActiveFile: () => fileOf(window.__active) },
};
window.__run = async (code) => { const module = { exports: {} }; new Function('module', 'require', code)(module, (id) => id === 'obsidian' ? { ItemView, Plugin, FuzzySuggestModal, Notice } : {}); const P = module.exports; window.__plugin = new P(window.__app); await window.__plugin.onload(); };
undefined;
"""


@unittest.skipIf(sync_playwright is None or not MAIN.exists(), "playwright or built plugin unavailable")
class WorkbenchPlugin(unittest.TestCase):
    def test_plugin_opens_shows_table_and_writes_canvas(self):
        notes = {f"10_Model/{p.name}": p.read_text() for p in FIX.glob("*.md")}
        notes[PCE_PATH] = PCE.read_text()
        errors = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1300, "height": 850})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; window.__active = null; }", notes)
            pg.evaluate(FAKE)
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            cmds = set(pg.evaluate("Object.keys(window.__cmds)"))
            self.assertTrue({"open", "refresh", "show-note", "canvas"} <= cmds, cmds)
            self.assertGreaterEqual(pg.evaluate("window.__menu"), 1, "file menu registered")

            pg.evaluate("window.__plugin.open()")
            pg.wait_for_selector("text=/\\d+ notes/")
            pg.click("button[role=tab]:has-text('Notes')")
            self.assertIn("PCE25", pg.inner_text(".mdw"))

            # show a note, graph tab, canvas button
            pg.evaluate("p => window.__plugin.open(p)", PCE_PATH)
            pg.click("button[role=tab]:has-text('Graph')")
            pg.click("button:has-text('Open as Canvas')")
            pg.wait_for_function("Object.keys(window.__files).some(k => k.endsWith('.canvas'))")
            path = pg.evaluate("Object.keys(window.__files).find(k => k.endsWith('.canvas'))")
            self.assertTrue(path.startswith("99_System/12_Views/PCE25 - "), path)
            doc = json.loads(pg.evaluate("p => window.__files[p]", path))
            self.assertTrue(any(n["type"] == "file" and n["file"] == PCE_PATH for n in doc["nodes"]))
            self.assertEqual(pg.evaluate("window.__opened.length"), 1)

            # command path: current note, profile chosen in the modal
            pg.evaluate("p => { window.__active = p; }", PCE_PATH)
            self.assertTrue(pg.evaluate("window.__cmds.canvas.checkCallback(true)"))
            pg.evaluate("window.__cmds.canvas.checkCallback(false)")
            pg.evaluate("window.__modal.onChooseItem({ name: 'Allocation' })")
            pg.wait_for_function("window.__notices.length > 0")
            self.assertRegex(pg.evaluate("window.__notices[0]"), r"Canvas opened.*51 not in vault|Canvas opened.*not in vault")
            self.assertTrue(pg.evaluate("Object.keys(window.__files).some(k => k.includes('Allocation'))"))
            pg.evaluate("window.__active = '99_System/x.canvas'")
            self.assertFalse(pg.evaluate("window.__cmds.canvas.checkCallback(true)"))
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
