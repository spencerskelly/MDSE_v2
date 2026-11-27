"""Run the built Testbench plugin (tools/testbench/dist/plugin/main.js) in a real Chromium against the fake Obsidian API
of test_workbench_plugin.py. Not real Obsidian; phone capture needs Node's http module and is tested in
tools/testbench/test/testbench.test.ts instead."""
import base64, pathlib, unittest

try:
    from playwright.sync_api import sync_playwright
except Exception:  # pragma: no cover
    sync_playwright = None

from test_workbench_plugin import FAKE

ROOT = pathlib.Path(__file__).resolve().parents[2]
MAIN = ROOT / "tools/testbench/dist/plugin/main.js"

# Synthetic notes only (DAT-002).
REQ = """---
type: Requirement
subtype: functional
id: REQ-00001
uid: uR1
status: Draft
primarySymbol: R1::Fault_report
---
# Fault report

The unit shall report a fault within 2 s.

## SysML v2

```sysml
package R1 {
 requirement def Fault_report;
}
```
"""
CASE = """---
type: Verification
subtype: test
id: VER-00001
uid: uV1
status: Draft
primarySymbol: V1::Fault_timing
---
# Fault timing

1. Power the unit at 48 V. Expected: green LED
2. Short the sense input -> fault reported within 2 s

## SysML v2

```sysml
package V1 {
 verification def Fault_timing {
  requirement r : R1::Fault_report;
  objective o {
   verify r;
  }
 }
}
```
"""
# 1x1 PNG
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
EXTRA = r"""
window.__app.vault.createBinary = async (p, b) => { if (p in window.__files) throw new Error('exists ' + p); window.__files[p] = new Uint8Array(b); return { path: p }; };
window.__app.vault.adapter.list = async (d) => ({ files: Object.keys(window.__files).filter((f) => f.slice(0, f.lastIndexOf('/')) === d), folders: [] });
window.__app.vault.adapter.stat = async (p) => ({ type: 'file', size: (window.__files[p] || '').length, mtime: Date.now(), ctime: Date.now() });
window.__app.vault.adapter.getResourcePath = (p) => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const rb = window.__app.vault.adapter.readBinary;
window.__app.vault.adapter.readBinary = async (p) => { if (p in window.__files) { const v = window.__files[p]; return typeof v === 'string' ? new TextEncoder().encode(v).buffer : v.buffer; } return rb(p); };
undefined;
"""


@unittest.skipIf(sync_playwright is None or not MAIN.exists(), "playwright or built plugin unavailable")
class TestbenchPlugin(unittest.TestCase):
    def test_plan_start_run_capture_evidence_and_submit_a_report(self):
        notes = {"10_Model/Fault report.md": REQ, "10_Model/Fault timing.md": CASE}
        errors = []
        with sync_playwright() as pw:
            b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium" if pathlib.Path("/opt/pw-browsers/chromium").is_file() else None)
            pg = b.new_page(viewport={"width": 1200, "height": 1000})
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.set_default_timeout(10000)
            pg.set_content("<body></body>")
            pg.evaluate("n => { window.__notes = n; }", notes)
            pg.evaluate(FAKE)
            pg.evaluate(EXTRA)
            pg.evaluate("window.__files['.vault.yaml'] = 'author: skellyspencer'; window.__files['Inbox/scope-ch1.csv'] = 'Model,SYNTH\\nSample Interval,1e-06\\nTime,CH1\\n0,0.1\\n1e-06,3.3\\n'")
            pg.evaluate("code => window.__run(code)", MAIN.read_text())
            pg.wait_for_function("() => window.__plugin.ix && window.__plugin.db")
            pg.evaluate("window.__plugin.settings.inboxFolder = 'Inbox'; window.__plugin.settings.testedBy = 'Synthetic Tester'")
            pg.evaluate("window.__plugin.open()")
            pg.wait_for_selector(".mdtb >> text=Test cases (1)")
            self.assertIn("REQ-00001", pg.inner_text(".mdtb"))
            pg.get_by_role("button", name="Start run").click()
            pg.wait_for_selector(".mdtb .bar >> text=TRP-")
            run_id = pg.evaluate("document.querySelector('.mdtb .bar b').textContent")
            self.assertRegex(run_id, r"^TRP-\d{4}-0001$")
            # setup: unit, then a dropped/picked photo on the setup
            pg.get_by_role("button", name="Setup", exact=True).click()
            for label, value in (("Unit serial number *", "SN-TEST-001"), ("Hardware rev *", "B"), ("Firmware version *", "1.0.0")):
                inp = pg.locator(f".mdtb input[aria-label='{label}']")
                inp.fill(value)
            pg.locator(".mdtb .ev input[type=file]").first.set_input_files(files=[{"name": "bench.png", "mimeType": "image/png", "buffer": PNG}])
            pg.wait_for_function("() => Object.keys(window.__files).some(k => /^Test Reports\\/TRP-\\d{4}-0001\\/setup-bench\\.png$/.test(k))")
            # step 1: from the numbered list in the case note, Pass, a scope CSV from the capture inbox
            pg.get_by_role("button", name="1", exact=True).click()
            self.assertIn("Power the unit at 48 V", pg.inner_text(".mdtb .step"))
            self.assertIn("green LED", pg.inner_text(".mdtb .step"))
            pg.locator(".mdtb .step .res button.Pass").click()
            pg.get_by_role("button", name="📥 Inbox (1)").click()
            pg.get_by_role("button", name="Attach to step 1").click()
            pg.wait_for_function("() => Object.keys(window.__files).some(k => /step-01-scope-ch1\\.csv$/.test(k))")
            self.assertIn("2 rows", pg.inner_text(".mdtb .step .thumbs"))
            pg.get_by_role("button", name="Next step →").click()
            pg.locator(".mdtb .step .res button.Pass").click()
            pg.get_by_role("button", name="Conclusion →").click()
            pg.locator(".mdtb select[aria-label='Overall result']").select_option("Pass")
            pg.locator(".mdtb .card").get_by_role("button", name="Submit report").click()
            path = f"Test Reports/{run_id}/{run_id}.md"
            pg.wait_for_function("p => window.__notes[p]", arg=path)
            report = pg.evaluate("p => window.__notes[p]", path)
            for text in (f"mdseTestReport: {run_id}", 'result: "Pass"', 'unitSerial: "SN-TEST-001"', "![[Test Reports/", "setup-bench.png|700]]", "| CH1 | 0.1 | 3.3 |", "## Evidence files"):
                self.assertIn(text, report)
            self.assertNotIn("\nuid:", report.split("\n---")[0])
            for k, v in notes.items():
                self.assertEqual(pg.evaluate("p => window.__notes[p]", k), v, "Testbench never edits a model note")
            pg.wait_for_function("() => window.__bin && window.__bin['.mdse/testbench.db'] && window.__plugin.db.all(\"SELECT result FROM runs\").length === 1", timeout=15000)
            self.assertEqual(pg.evaluate("window.__plugin.db.all('SELECT result, steps_pass, attachments FROM runs')"), [{"result": "Pass", "steps_pass": 2, "attachments": 2}])
            # back in Plan, the case shows its last result
            pg.get_by_role("button", name="Plan", exact=True).click()
            pg.wait_for_selector(".mdtb >> text=Pass · ")
            b.close()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
