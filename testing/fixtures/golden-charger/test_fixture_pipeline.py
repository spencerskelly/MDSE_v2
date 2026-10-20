#!/usr/bin/env python3
"""Standard-library regression tests for v2 Markdown extraction and fixture checks.

These checks intentionally DO NOT certify SysML v2 language conformance.
"""
import contextlib
import io
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
EXTRACT = ROOT / "extract_sysml.py"
CHECK = ROOT / "validate_fixture.py"
GATE = ROOT / "external_parser_gate.py"
NOTES = ("Controller.md", "Power Module.md", "Charger.md")
EXPORT = ("01_Controller.sysml", "02_PowerModule.sysml", "03_Charger.sysml")

class FixturePipeline(unittest.TestCase):
    def run_script(self, script, *args):
        return subprocess.run([sys.executable, str(script), *map(str, args)],
                              capture_output=True, text=True, check=False)

    def fixture_copy(self, temp):
        dst = Path(temp) / "fixture"
        (dst / "export").mkdir(parents=True)
        for note in NOTES:
            shutil.copy2(ROOT / note, dst / note)
        for name in EXPORT:
            shutil.copy2(ROOT / "export" / name, dst / "export" / name)
        return dst

    def test_committed_export_matches_notes(self):
        p = self.run_script(EXTRACT, "--check")
        self.assertEqual(p.returncode, 0, p.stderr)

    def test_fixture_smoke(self):
        p = self.run_script(CHECK)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertIn('"internal":', p.stdout)

    def test_missing_source_is_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            d = self.fixture_copy(t)
            (d / "Controller.md").unlink()
            p = self.run_script(EXTRACT, "--root", d, "--check")
            self.assertNotEqual(p.returncode, 0)

    def test_duplicate_symbol_is_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            d = self.fixture_copy(t)
            f = d / "Power Module.md"
            txt = f.read_text()
            f.write_text(txt.replace("PowerLibrary::PowerModule",
                                     "ControllerLibrary::Controller", 1))
            p = self.run_script(EXTRACT, "--root", d, "--check")
            self.assertNotEqual(p.returncode, 0)

    def test_changed_source_requires_regeneration(self):
        with tempfile.TemporaryDirectory() as t:
            d = self.fixture_copy(t)
            f = d / "Charger.md"
            txt = f.read_text()
            f.write_text(txt.replace("Contactor[2]", "Contactor[4]"))
            p = self.run_script(EXTRACT, "--root", d, "--check")
            self.assertNotEqual(p.returncode, 0)

    def test_model_hash_is_stable(self):
        p = self.run_script(GATE)
        q = self.run_script(GATE)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(p.stdout, q.stdout)
        self.assertIn('"conformance": "not-verified"', p.stdout)

    def test_hash_mismatch_is_rejected(self):
        p = self.run_script(GATE, "--expect-sha256", "0" * 64)
        self.assertNotEqual(p.returncode, 0)

if __name__ == "__main__":
    unittest.main()
