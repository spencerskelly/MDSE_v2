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
                self.assertTrue(pg.is_disabled("#genNew"))
                b.close()
            self.assertEqual(errors, [])
            self.assertEqual([r for r in requests if not r.startswith("file:")], [], "the page must make no network requests")


if __name__ == "__main__":
    unittest.main()
