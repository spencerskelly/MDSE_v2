"""Drive the single-file HTML importer in a real Chromium: no network, QEAX analysis, vault check."""
import pathlib, shutil, sqlite3, tempfile, unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # pragma: no cover
    sync_playwright = None

ROOT = pathlib.Path(__file__).resolve().parents[2]
HTML = ROOT / "tools/importer/dist/mdse_importer.html"
FIX = ROOT / "testing/fixtures/golden-charger"


def make_qeax(path, objects=700, connectors=1234, diagrams=57):
    db = sqlite3.connect(path)
    db.execute("PRAGMA page_size=1024")
    db.execute("CREATE TABLE t_object(Object_ID INTEGER PRIMARY KEY, ea_guid TEXT, Name TEXT, Object_Type TEXT)")
    db.execute("CREATE TABLE t_connector(Connector_ID INTEGER PRIMARY KEY, Connector_Type TEXT, Start_Object_ID INT, End_Object_ID INT)")
    db.execute("CREATE TABLE t_package(Package_ID INTEGER PRIMARY KEY, Name TEXT)")
    db.execute("CREATE TABLE t_diagram(Diagram_ID INTEGER PRIMARY KEY, Name TEXT)")
    db.executemany("INSERT INTO t_object VALUES (?,?,?,?)", [(i, "{G%d}" % i, "n%d" % i, "Class") for i in range(1, objects + 1)])
    db.executemany("INSERT INTO t_connector VALUES (?,?,?,?)", [(i, "Association", 1, 2) for i in range(1, connectors + 1)])
    db.executemany("INSERT INTO t_package VALUES (?,?)", [(i, "p") for i in range(1, 6)])
    db.executemany("INSERT INTO t_diagram VALUES (?,?)", [(i, "d") for i in range(1, diagrams + 1)])
    db.commit(); db.close()


@unittest.skipIf(sync_playwright is None or not HTML.exists(), "playwright or built importer unavailable")
class ImporterBrowser(unittest.TestCase):
    def test_page_works_offline_and_reports_source_and_vault(self):
        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            make_qeax(d / "m.qeax")
            (d / "x.eapx").write_bytes(b"Standard Jet DB" + bytes(4000))
            vault = d / "vault"; (vault / "10_Model").mkdir(parents=True)
            for n in ("Charger.md", "Controller.md"):
                shutil.copy(FIX / n, vault / "10_Model" / n)
            bad = (FIX / "Power Module.md").read_text().replace("id: OBJ-", "id: ACT-")
            (vault / "10_Model" / "Broken.md").write_text(bad)
            (vault / "README.md").write_text("# no frontmatter\n")
            requests, errors = [], []
            with sync_playwright() as pw:
                b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
                pg = b.new_page()
                pg.on("request", lambda r: requests.append(r.url))
                pg.on("pageerror", lambda e: errors.append(str(e)))
                pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
                pg.goto(HTML.as_uri())
                self.assertIn("build ", pg.inner_text("#build"))

                pg.set_input_files("#qeax", str(d / "x.eapx"))
                pg.wait_for_function("document.getElementById('srcStatus').textContent.includes('SQLite')")
                self.assertIn("not a SQLite database", pg.inner_text("#srcStatus"))

                pg.set_input_files("#qeax", str(d / "m.qeax"))
                pg.wait_for_function("document.getElementById('srcOut').textContent.includes('t_object')")
                rows = {r.split("\t")[0]: r for r in pg.inner_text("#srcOut").split("\n") if r.startswith("t_")}
                self.assertRegex(rows["t_object"], r"\b700\b"); self.assertRegex(rows["t_connector"], r"\b1234\b")
                self.assertNotIn("t_diagram", pg.inner_text("#srcOut"))  # diagrams are never read
                self.assertIn("out of scope", pg.inner_text("#srcOut"))
                self.assertIn("m.qeax", pg.inner_text("#srcStatus"))

                pg.set_input_files("#scanInput", str(vault))
                pg.wait_for_function("document.getElementById('vaultOut').textContent.includes('Markdown files')")
                out = pg.inner_text("#vaultOut")
                self.assertIn("3 governed notes", out)
                self.assertIn("1 with issues", out)
                self.assertIn("Broken.md", out); self.assertIn("ID_PREFIX", out)
                self.assertNotIn("Charger.md\t", out)
                self.assertFalse(pg.is_disabled("#genNew"))   # source chosen
                self.assertTrue(pg.is_disabled("#genAdd"))   # needs a writable folder (read-only check does not count)
                b.close()
            self.assertEqual(errors, [])
            self.assertEqual([r for r in requests if not r.startswith("file:")], [], "the page must make no network requests")


SEED = r"""
async () => {
  const root = await navigator.storage.getDirectory();
  for await (const [n] of root.entries()) await root.removeEntry(n, { recursive: true });
  const put = async (path, text) => { let d = root; const ps = path.split('/'); for (const p of ps.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true }); const w = await (await d.getFileHandle(ps.at(-1), { create: true })).createWritable(); await w.write(text); await w.close(); };
  await put('.vault.yaml', 'vault_uid: 20250101000000000\nvault_name: Acme\nauthor: pat\nmdse_release: 0.0.0-old\nschema: mdse-vault/0.1\n');
  await put('.obsidian/app.json', '{"vimMode": true}');
  await put('.obsidian/community-plugins.json', '["templater-obsidian"]');
  await put('99_System/05_Templates/Template - Requirement.md', 'stale template\n');
  await put('README.md', '# my readme\n');
  await put('10_Model/Charger.md', 'my note\n');
  window.showDirectoryPicker = async () => root;
  window.confirm = () => true;
  window.__read = async (path) => { try { let d = root; const ps = path.split('/'); for (const p of ps.slice(0, -1)) d = await d.getDirectoryHandle(p); return await (await (await d.getFileHandle(ps.at(-1))).getFile()).text(); } catch (_) { return null; } };
}
"""


@unittest.skipIf(sync_playwright is None or not HTML.exists(), "playwright or built importer unavailable")
class VaultUpdateBrowser(unittest.TestCase):
    def test_update_vault_configuration_without_a_source(self):
        errors = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            # a file:// page has an opaque origin and no storage, so serve the same bytes from an https origin (nothing leaves the machine)
            pg.route("https://mdse.test/importer.html", lambda r: r.fulfill(status=200, content_type="text/html", body=HTML.read_text()))
            pg.goto("https://mdse.test/importer.html")
            self.assertTrue(pg.is_disabled("#updPreview"), "needs a folder")
            pg.evaluate(SEED)
            pg.click("#pick")
            pg.wait_for_function("document.getElementById('vaultStatus').textContent.includes('existing vault')")
            self.assertFalse(pg.is_disabled("#updPreview"))
            self.assertTrue(pg.is_disabled("#genAdd"), "no source chosen, so no import")
            pg.click("#updPreview")
            pg.wait_for_function("document.getElementById('updStatus').textContent.includes('Ready')")
            out = pg.inner_text("#updOut")
            self.assertIn("Template - Requirement.md", out); self.assertIn("replace", out)
            self.assertIn("mdse-workbench/main.js", out)
            self.assertIn("README.md", out); self.assertIn("not overwritten", out)
            self.assertIsNone(pg.evaluate("window.__read('.obsidian/plugins/mdse-workbench/main.js')"), "preview writes nothing")
            pg.click("#updApply")
            pg.wait_for_function("document.getElementById('updStatus').textContent.includes('Updated')")
            self.assertIn("MDSE Workbench", pg.evaluate("window.__read('.obsidian/plugins/mdse-workbench/main.js')"))
            self.assertIn("mdse-workbench", pg.evaluate("window.__read('.obsidian/community-plugins.json')"))
            self.assertIn("templater-obsidian", pg.evaluate("window.__read('.obsidian/community-plugins.json')"))
            self.assertIn("vimMode", pg.evaluate("window.__read('.obsidian/app.json')"))
            self.assertNotEqual(pg.evaluate("window.__read('99_System/05_Templates/Template - Requirement.md')"), "stale template\n")
            self.assertEqual(pg.evaluate("window.__read('README.md')"), "# my readme\n")
            self.assertEqual(pg.evaluate("window.__read('10_Model/Charger.md')"), "my note\n")
            self.assertIn("vault_uid: 20250101000000000", pg.evaluate("window.__read('.vault.yaml')"))
            # a second preview finds nothing left to do
            pg.click("#pick"); pg.wait_for_function("document.getElementById('vaultStatus').textContent.includes('existing vault')")
            pg.click("#updPreview")
            pg.wait_for_function("document.getElementById('updStatus').textContent.includes('already current')")
            self.assertTrue(pg.is_disabled("#updApply"))
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
