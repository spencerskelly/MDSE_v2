"""Drive the single-file HTML importer in a real Chromium: no network, QEAX analysis, vault check."""
import pathlib, shutil, sqlite3, tempfile, unittest, zipfile, io

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
                # the page asks for a name first and cannot be used until one is given
                self.assertTrue(pg.is_visible("#whoDlg"))
                pg.keyboard.press("Escape"); self.assertTrue(pg.is_visible("#whoDlg"), "cannot be dismissed without a name")
                pg.fill("#whoName", "Spencer"); pg.click("#whoSave"); self.assertIn("first and a last", pg.inner_text("#whoErr"))
                pg.fill("#whoName", "Spencer Skelly"); self.assertEqual(pg.inner_text("#whoCode"), "skellyspencer"); pg.click("#whoSave")
                self.assertFalse(pg.is_visible("#whoDlg")); self.assertIn("skellyspencer", pg.inner_text("#who"))

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
            pg.fill("#whoName", "Pat Example"); pg.click("#whoSave")
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


BOM_TSV = "\n".join(["Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2",
    "01141-002\t-N\t99\tCABLE ASSY\tbuy\tPRODUCTIONPREPARATION\t1\t01191\t-0\t99\tCONNECTOR HOUSING\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t2\tea\t01141-002-N99",
    "01141-002\t-N\t99\tCABLE ASSY\tbuy\tPRODUCTIONPREPARATION\t4\t01798-006-M\t-0\t01\tWIRE 22AWG\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t0.559\tM\t01141-002-N99"]) + "\n"


@unittest.skipIf(sync_playwright is None or not HTML.exists(), "playwright or built importer unavailable")
class FullVaultBuild(unittest.TestCase):
    def test_bom_only_build_gives_a_full_bootstrap_vault_zip(self):
        errors = []
        with tempfile.TemporaryDirectory() as d, sync_playwright() as pw:
            f = pathlib.Path(d) / "bom.tsv"; f.write_text(BOM_TSV)
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(accept_downloads=True)
            pg.on("pageerror", lambda e: errors.append(str(e))); pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.goto(HTML.as_uri())
            self.assertTrue(pg.is_disabled("#genNew"))
            pg.fill("#whoName", "Spencer Skelly"); pg.click("#whoSave")
            self.assertTrue(pg.is_disabled("#genNew"), "no source yet")
            pg.set_input_files("#bomFile", str(f))
            pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('bom.tsv')")
            self.assertIn("flat", pg.inner_text("#bomOut"))
            self.assertFalse(pg.is_disabled("#genNew"))
            pg.fill("#vname", "Acme Vault")
            with pg.expect_download() as dl:
                pg.click("#genNew")
            z = zipfile.ZipFile(dl.value.path()); names = set(z.namelist())
            self.assertIn("flat", pg.inner_text("#genOut"))
            self.assertEqual(pg.get_attribute("#pbar", "aria-valuenow"), "100")
            for plug in ("mdse-bootstrap", "mdse-workbench", "templater-obsidian", "advanced-canvas", "obsidian-git"):
                for fn in ("main.js", "manifest.json"):
                    self.assertIn(".obsidian/plugins/%s/%s" % (plug, fn), names)
            y = z.read(".vault.yaml").decode()
            self.assertIn("author: skellyspencer", y); self.assertIn("vault_name: Acme Vault", y); self.assertNotIn("UNINITIALIZED", y)
            self.assertIn("99_System/04_People/Spencer Skelly.md", names)
            self.assertIn("skellyspencer", z.read("99_System/04_People/Spencer Skelly.md").decode())
            self.assertIn("mdse-bootstrap", z.read(".obsidian/community-plugins.json").decode())
            self.assertIn("99_System/05_Templates", z.read(".obsidian/plugins/templater-obsidian/data.json").decode())
            parts = [n for n in names if n.startswith("BOM/Parts/")]
            self.assertEqual(len(parts), 3)
            self.assertTrue(any(n.startswith("99_System/11_Import/BOM Findings") for n in names))
            self.assertIn("Trust author and enable plugins", pg.inner_text("#trustBody"))
            b.close()
        self.assertEqual(errors, [])


@unittest.skipIf(sync_playwright is None or not HTML.exists(), "playwright or built importer unavailable")
class BomUpdateBrowser(unittest.TestCase):
    def test_second_bom_is_scanned_and_only_ticked_changes_are_written(self):
        errors = []
        with tempfile.TemporaryDirectory() as d, sync_playwright() as pw:
            v1 = pathlib.Path(d) / "bom1.tsv"; v1.write_text(BOM_TSV)
            v2 = pathlib.Path(d) / "bom2.tsv"; v2.write_text(BOM_TSV.replace("\t2\tea\t", "\t3\tea\t").replace("CABLE ASSY\t", "CABLE ASSEMBLY\t"))
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e))); pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.route("https://mdse.test/importer.html", lambda r: r.fulfill(status=200, content_type="text/html", body=HTML.read_text()))
            pg.goto("https://mdse.test/importer.html")
            pg.fill("#whoName", "Pat Example"); pg.click("#whoSave")
            pg.evaluate(SEED)
            pg.click("#pick"); pg.wait_for_function("document.getElementById('vaultStatus').textContent.includes('existing vault')")
            self.assertTrue(pg.is_disabled("#bomScan"), "needs a BOM")
            pg.set_input_files("#bomFile", str(v1)); pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('bom1.tsv')")
            pg.uncheck("#toolUpd"); pg.click("#genAdd"); pg.wait_for_function("document.getElementById('genStatus').textContent.includes('Wrote')")
            note = pg.evaluate("window.__read('BOM/Parts/01141-002.md')")
            self.assertIn("importHash:", note); self.assertIn("importSource: bom1.tsv", note)
            # the same file again: nothing to change
            pg.click("#bomScan"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Nothing has been written')")
            self.assertIn("0 change(s) proposed", pg.inner_text("#bomUpdOut"))
            # the changed file: a description and a quantity
            pg.set_input_files("#bomFile", str(v2)); pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('bom2.tsv')")
            pg.click("#bomScan"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Nothing has been written')")
            out = pg.inner_text("#bomUpdOut")
            self.assertIn("Part description changed", out); self.assertIn("Assembly line changed", out)
            self.assertTrue(pg.is_disabled("#bomApply"), "nothing is ticked by default")
            pg.check("input.cat[data-cat=DESCRIPTION]")
            self.assertFalse(pg.is_disabled("#bomApply")); self.assertIn("Apply 1 ticked", pg.inner_text("#bomApply"))
            pg.click("#bomApply"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Applied')")
            note = pg.evaluate("window.__read('BOM/Parts/01141-002.md')")
            self.assertIn("description: CABLE ASSEMBLY", note); self.assertIn("importSource: bom2.tsv", note)
            self.assertIn("[2]", note, "the quantity change was not ticked, so it is untouched")
            names = pg.evaluate("(async () => { const r = await navigator.storage.getDirectory(); const d = await (await r.getDirectoryHandle('99_System')).getDirectoryHandle('11_Import'); const o = []; for await (const [n] of d.entries()) o.push(n); return o; })()")
            self.assertTrue(any(n.startswith("BOM Update ") for n in names), names)
            # what was not ticked is offered again
            pg.click("#bomScan"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Nothing has been written')")
            out = pg.inner_text("#bomUpdOut"); self.assertIn("Assembly line changed", out); self.assertNotIn("Part description changed", out)
            b.close()
        self.assertEqual(errors, [])


    def test_additions_arrive_ticked_and_changes_do_not(self):
        """D-0057: a later BOM that adds a line is ticked for the user; a quantity change in the same file is not."""
        errors = []
        with tempfile.TemporaryDirectory() as d, sync_playwright() as pw:
            v1 = pathlib.Path(d) / "bom1.tsv"; v1.write_text(BOM_TSV)
            extra = "01141-002\t-N\t99\tCABLE ASSY\tbuy\tPRODUCTIONPREPARATION\t5\t09999\t-0\t99\tNEW GROMMET\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t1\tea\t01141-002-N99\n"
            v2 = pathlib.Path(d) / "bom2.tsv"; v2.write_text(BOM_TSV.replace("\t2\tea\t", "\t3\tea\t") + extra)
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page()
            pg.on("pageerror", lambda e: errors.append(str(e))); pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.route("https://mdse.test/importer.html", lambda r: r.fulfill(status=200, content_type="text/html", body=HTML.read_text()))
            pg.goto("https://mdse.test/importer.html")
            pg.fill("#whoName", "Pat Example"); pg.click("#whoSave")
            pg.evaluate(SEED)
            pg.click("#pick"); pg.wait_for_function("document.getElementById('vaultStatus').textContent.includes('existing vault')")
            pg.set_input_files("#bomFile", str(v1)); pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('bom1.tsv')")
            pg.uncheck("#toolUpd"); pg.click("#genAdd"); pg.wait_for_function("document.getElementById('genStatus').textContent.includes('Wrote')")
            pg.set_input_files("#bomFile", str(v2)); pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('bom2.tsv')")
            pg.click("#bomScan"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Nothing has been written')")
            self.assertIn("Additions are ticked", pg.inner_text("#bomUpdStatus"))
            self.assertTrue(pg.is_checked("input.cat[data-cat=NEW_PART]"), "a new part is an addition")
            self.assertTrue(pg.is_checked("input.cat[data-cat=LINE_ADDED]"), "a new line is an addition")
            self.assertFalse(pg.is_checked("input.cat[data-cat=LINE_CHANGED]"), "a changed quantity is not")
            self.assertFalse(pg.is_checked("input.it[data-cat=LINE_CHANGED]"))
            self.assertFalse(pg.is_disabled("#bomApply")); self.assertIn("Apply 2 ticked", pg.inner_text("#bomApply"))
            pg.click("#bomApply"); pg.wait_for_function("document.getElementById('bomUpdStatus').textContent.includes('Applied')")
            note = pg.evaluate("window.__read('BOM/Parts/01141-002.md')")
            self.assertIn("09999", note, "the new line was written")
            self.assertIn("[2]", note, "the quantity change was not ticked, so it is untouched")
            b.close()
        self.assertEqual(errors, [])


def make_redline_xlsx(path):
    """A small redline workbook, deflate-compressed like Excel writes it: 06991 struck out, 6100148 new, one alternate row."""
    head = ["0", "1", "Structure", "Number", "Name", "CL1", "CL2", "Manufacturer", "Manufacturer Part Number", "Line Number", "Quantity", "Unit"]
    rows = [dict(zip("ABCDEFGHIJKL", head)),
            {"A": "0", "C": "0", "D": "5913538", "E": "BRACKET ASSY", "F": "B", "G": "03"},
            {"B": "1", "C": "1", "D": ("06991", "6100148"), "E": "SUPPORT AW", "F": "A", "G": "02", "H": "CIRCLE AW", "I": "AW 250", "J": "8", "K": "4.318", "L": "Meter"},
            {"H": "EATON B-LINE", "I": "AW250"}]
    sst, xml = [], []
    for r, row in enumerate(rows, 1):
        cells = []
        for col, v in row.items():
            if isinstance(v, tuple):
                sst.append('<si><r><rPr><strike/></rPr><t>%s</t></r><r><rPr/><t>%s</t></r></si>' % v)
            else:
                sst.append("<si><t>%s</t></si>" % v)
            cells.append('<c r="%s%d" t="s"><v>%d</v></c>' % (col, r, len(sst) - 1))
        xml.append('<row r="%d">%s</row>' % (r, "".join(cells)))
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", "<Types/>")
        z.writestr("xl/workbook.xml", '<workbook><sheets><sheet name="Redline" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr("xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr("xl/sharedStrings.xml", "<sst>" + "".join(sst) + "</sst>"); z.writestr("xl/worksheets/sheet1.xml", "<worksheet><sheetData>" + "".join(xml) + "</sheetData></worksheet>")


@unittest.skipIf(sync_playwright is None or not HTML.exists(), "playwright or built importer unavailable")
class RedlineXlsxInBrowser(unittest.TestCase):
    def test_browser_reads_a_compressed_redline_workbook(self):
        with tempfile.TemporaryDirectory() as d, sync_playwright() as pw:
            f = pathlib.Path(d) / "redline.xlsx"; make_redline_xlsx(f)
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(accept_downloads=True); pg.goto(HTML.as_uri())
            pg.fill("#whoName", "Spencer Skelly"); pg.click("#whoSave")
            pg.set_input_files("#bomFile", str(f))
            pg.wait_for_function("document.getElementById('bomStatus').textContent.includes('redline.xlsx')")
            self.assertIn("redline", pg.inner_text("#bomOut"))
            with pg.expect_download() as dl:
                pg.click("#genNew")
            z = zipfile.ZipFile(dl.value.path())
            top = [z.read(n).decode() for n in z.namelist() if n.startswith("BOM/Parts/5913538")][0]
            self.assertIn("P_6100148", top); self.assertIn("was 06991 before this release", top); self.assertNotIn("P_06991", top)
            self.assertTrue(any(n.startswith("BOM/Parts/6100148") for n in z.namelist()))
            alt = [z.read(n).decode() for n in z.namelist() if n.startswith("BOM/Parts/6100148")][0]
            self.assertIn("manufacturer2: EATON B-LINE", alt); self.assertIn("mfgPn2: AW250", alt)
            b.close()


if __name__ == "__main__":
    unittest.main()
