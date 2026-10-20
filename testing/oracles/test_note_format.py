"""Tests for the v2 note format: layout validation and block-only rewriting."""
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "testing/oracles"))
import mdse_note_format as nf  # noqa: E402

CLASSES = nf.load_classes()
SYSML = "package P {\n    part def A {\n        port p : P::Q;\n    }\n    port def Q;\n}\n"
FRONT = ("---\ntype: Object\nsubtype: electrical\nid: OBJ-00042\nuid: 20261018230000001skellyspencer\n"
         "status: Draft\ntags: []\nsourceRole: authoritative-model\nprimarySymbol: P::A\n---\n")
USER = "# A\n\nHuman note text.\n\n## Notes\n\nmy own words\n"


def note(front=FRONT, user=USER, sysml=SYSML):
    return nf.replace_sysml_block(front + user, sysml)


def codes(text):
    return {i.code for i in nf.validate(text, CLASSES)}


class FixtureNotes(unittest.TestCase):
    def test_committed_v2_notes_conform(self):
        paths = sorted((ROOT / "testing/fixtures/golden-charger").glob("*.md"))
        paths.append(ROOT / "testing/fixtures/sample-instrument/Sample Instrument.md")
        paths = [p for p in paths if p.name != "README.md"]
        self.assertEqual(len(paths), 4)
        for p in paths:
            with self.subTest(note=p.name):
                self.assertEqual([str(i) for i in nf.validate(p.read_text(encoding="utf-8"), CLASSES)], [])


class Validation(unittest.TestCase):
    def test_valid_note_has_no_issues(self):
        # a real (non-fixture) id below the reserved range, no fixture flag
        self.assertEqual(codes(note()), set())

    def test_identity_rules(self):
        self.assertIn("BAD_UID", codes(note(FRONT.replace("20261018230000001skellyspencer", "sample-v2-instrument-0001"))))
        self.assertIn("BAD_ID", codes(note(FRONT.replace("OBJ-00042", "OBJ-42"))))
        self.assertIn("ID_PREFIX", codes(note(FRONT.replace("OBJ-00042", "REQ-00042"))))

    def test_type_and_subtype_are_governed(self):
        self.assertIn("UNKNOWN_TYPE", codes(note(FRONT.replace("type: Object", "type: System"))))
        self.assertIn("BAD_SUBTYPE", codes(note(FRONT.replace("electrical", "gizmo"))))
        no_sub = FRONT.replace("type: Object\nsubtype: electrical\nid: OBJ-00042", "type: Actor\nsubtype: human\nid: ACT-00042")
        self.assertIn("BAD_SUBTYPE", codes(note(no_sub)))  # Actor has no subtypes

    def test_property_order_is_enforced(self):
        swapped = FRONT.replace("id: OBJ-00042\nuid: 20261018230000001skellyspencer\n",
                                "uid: 20261018230000001skellyspencer\nid: OBJ-00042\n")
        self.assertIn("PROPERTY_ORDER", codes(note(swapped)))

    def test_fixture_id_range_is_reserved(self):
        self.assertIn("FIXTURE_ID_RANGE", codes(note(FRONT.replace("---\n", "---\n", 1).replace("tags: []", "tags: []\nfixture: true"))))
        real_in_range = FRONT.replace("OBJ-00042", "OBJ-99999")
        self.assertIn("FIXTURE_ID_RANGE", codes(note(real_in_range)))

    def test_sysml_section_must_be_last(self):
        text = note() + "\n## Notes\n\nadded after the block\n"
        self.assertIn("SYSML_NOT_LAST", codes(text))

    def test_exactly_one_sysml_block(self):
        text = note() + "\n```sysml\npackage X;\n```\n"
        self.assertIn("SYSML_FENCE_COUNT", codes(text))

    def test_sysml_block_above_footer_is_rejected(self):
        text = note(user=USER + "\n```sysml\npackage Stray;\n```\n")
        self.assertIn("SYSML_OUTSIDE_FOOTER", codes(text))

    def test_primary_symbol_must_be_declared(self):
        self.assertIn("SYMBOL_NOT_DECLARED", codes(note(FRONT.replace("P::A", "P::Missing"))))

    def test_authoritative_note_needs_block(self):
        self.assertIn("MISSING_SYSML_BLOCK", codes(FRONT + USER))

    def test_source_ea_must_precede_sysml(self):
        text = note() + "\n## Source: EA\nEA GUID: {X}\n"
        self.assertTrue({"SOURCE_AFTER_SYSML", "SYSML_NOT_LAST"} <= codes(text))

    def test_heading_inside_user_code_fence_is_not_a_section(self):
        user = USER + "\n```\n## SysML v2\n```\n"
        self.assertEqual(codes(note(user=user)), set())

    def test_qualified_names_handle_nesting_and_forward_declarations(self):
        names = nf.qualified_names("package A { part def B; part def C { part x : B; } package N { port def D; } }")
        self.assertTrue({"A", "A::B", "A::C", "A::N", "A::N::D"} <= names)
        self.assertNotIn("A::x", names)


class Rewrite(unittest.TestCase):
    def test_user_zone_is_byte_identical_after_block_replacement(self):
        # `before` is written out literally, not built with the function under test,
        # so a rewrite that alters the user zone cannot change both sides equally.
        footer = f"{nf.SYSML_HEADING}\n\n{nf.SYSML_HINT}\n\n```sysml\n{SYSML}```\n"
        before = FRONT + USER + "\n\n\n" + footer
        after = nf.replace_sysml_block(before, "package P { part def A; }\n")
        self.assertTrue(after.startswith(FRONT + USER + "\n\n\n" + nf.SYSML_HEADING))
        self.assertEqual(after[:after.index(nf.SYSML_HEADING)], before[:before.index(nf.SYSML_HEADING)])
        self.assertIn("part def A;", after)
        self.assertNotIn("port def Q", after)

    def test_replacement_is_idempotent(self):
        once = nf.replace_sysml_block(note(), SYSML)
        self.assertEqual(once, nf.replace_sysml_block(once, SYSML))
        self.assertEqual(once, note())

    def test_extract_round_trips(self):
        self.assertEqual(nf.extract_sysml(note()), SYSML)

    def test_crlf_notes_keep_their_line_endings(self):
        crlf = note().replace("\n", "\r\n")
        out = nf.replace_sysml_block(crlf, SYSML)
        self.assertNotIn("\r\r", out)
        self.assertEqual(out.count("\n"), out.count("\r\n"))
        self.assertEqual(crlf, out)

    def test_block_is_added_after_source_ea_without_touching_it(self):
        src = "\n\n\n## Source: EA\nEA GUID: {ABC}\n\n- PN: 4050030\n"
        text = nf.replace_sysml_block(FRONT + USER.rstrip("\n") + "\n" + src, SYSML)
        self.assertEqual(codes(text), set())
        self.assertLess(text.index("## Source: EA"), text.index(nf.SYSML_HEADING))
        self.assertIn("- PN: 4050030\n", text)

    def test_block_is_added_to_note_without_footer(self):
        text = nf.replace_sysml_block(FRONT + USER, SYSML)
        self.assertTrue(text.startswith(FRONT + USER.rstrip("\n")))
        self.assertEqual(codes(text), set())


if __name__ == "__main__":
    unittest.main()
