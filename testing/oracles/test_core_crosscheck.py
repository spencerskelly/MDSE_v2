"""The browser importer core (JS) and the Python validator must agree on every rule."""
import json, pathlib, subprocess, sys, tempfile, unittest, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "testing/oracles"))
import mdse_note_format as py  # noqa: E402

FIX = ROOT / "testing/fixtures/golden-charger"
CLI = ROOT / "testing/oracles/cli/mdse_core_cli.cjs"
BASE = (FIX / "Charger.md").read_text(encoding="utf-8")


def mutations():
    yield "clean", BASE
    yield "crlf", BASE.replace("\n", "\r\n")
    yield "swap_keys", BASE.replace("type: Object\nsubtype: part\n", "subtype: part\ntype: Object\n")
    yield "no_uid", "\n".join(l for l in BASE.split("\n") if not l.startswith("uid:"))
    yield "bad_uid", BASE.replace("uid: 2026", "uid: 26")
    yield "bad_prefix", BASE.replace("id: OBJ-", "id: ACT-")
    yield "bad_id", BASE.replace("id: OBJ-99003", "id: OBJ-3")
    yield "unknown_type", BASE.replace("type: Object", "type: Widget")
    yield "bad_subtype", BASE.replace("subtype: part", "subtype: nonsense")
    yield "fixture_low", BASE.replace("OBJ-99003", "OBJ-00003")
    yield "no_fixture_flag", BASE.replace("fixture: true\n", "")
    yield "bad_role", BASE.replace("authoritative-model", "reference")
    yield "symbol_missing", BASE.replace("primarySymbol: ChargerProduct::Charger", "primarySymbol: Nope::Nothing")
    yield "no_frontmatter", BASE.split("---\n", 2)[2]
    yield "h2_after_sysml", BASE.rstrip("\n") + "\n\n## Late\n"
    yield "second_fence", BASE.rstrip("\n") + "\n\n```sysml\npart def X;\n```\n"
    yield "fence_above", BASE.replace("## Source: EA", "```sysml\npart def Y;\n```\n\n## Source: EA", 1)
    yield "trailing_text", BASE.rstrip("\n") + "\n\ntrailing prose\n"
    yield "no_sysml_section", BASE[: BASE.index("## SysML v2")]
    yield "source_after", BASE.replace("## Source: EA", "## Zed").rstrip("\n") + "\n\n## Source: EA\n"


class CrossCheck(unittest.TestCase):
    def js(self, *args, **kw):
        return subprocess.run(["node", str(CLI), *args], capture_output=True, check=True, **kw).stdout.decode("utf-8")  # bytes: text mode would fold CRLF

    def test_validators_agree_on_every_mutation(self):
        classes = py.load_classes()
        with tempfile.TemporaryDirectory() as d:
            files = {}
            for name, text in mutations():
                p = pathlib.Path(d) / f"{name}.md"
                p.write_bytes(text.encode("utf-8"))
                files[name] = p
            got = json.loads(self.js("validate", *map(str, files.values())))
            for name, p in files.items():
                want = sorted(i.code for i in py.validate(p.read_text(encoding="utf-8"), classes))
                self.assertEqual(got[str(p)], want, name)
        # the mutations must actually exercise the validator, not all pass
        self.assertGreater(sum(1 for n, t in mutations() if py.validate(t, classes)), 12)

    def test_replace_block_is_byte_identical(self):
        with tempfile.TemporaryDirectory() as d:
            note, sysml = pathlib.Path(d, "n.md"), pathlib.Path(d, "s.sysml")
            sysml.write_text("package Z { part def Q; }\n")
            for name in ("clean", "crlf"):
                text = dict(mutations())[name]
                note.write_bytes(text.encode())
                got = self.js("replace", str(note), str(sysml))
                self.assertEqual(got, py.replace_sysml_block(text, sysml.read_text()), name)

    def test_embedded_class_table_matches_the_schema(self):
        want = {}
        for n, c in py.load_classes().items():
            want[n] = {"prefix": c["prefix"], "subtype": c.get("subtype") or []}
            if c.get("prefix_by_subtype"):
                want[n]["prefixBySubtype"] = c["prefix_by_subtype"]
        got = json.loads((ROOT / "tools/core/src/classes.json").read_text())
        self.assertEqual(got, want, "regenerate tools/core/src/classes.json from governance/schemas/element-types.yaml")

    def test_zip_is_readable_by_a_standard_reader(self):
        with tempfile.TemporaryDirectory() as d:
            out = pathlib.Path(d, "o.zip")
            self.js("zip", str(out), str(FIX / "Charger.md"), str(FIX / "Controller.md"))
            with zipfile.ZipFile(out) as z:
                self.assertIsNone(z.testzip())
                self.assertEqual(sorted(z.namelist()), ["Charger.md", "Controller.md"])
                self.assertEqual(z.read("Charger.md"), (FIX / "Charger.md").read_bytes())


if __name__ == "__main__":
    unittest.main()
