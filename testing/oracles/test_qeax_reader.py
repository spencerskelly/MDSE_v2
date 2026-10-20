"""The browser SQLite reader must return exactly what sqlite3 returns, on shapes a real .qeax has."""
import json, pathlib, sqlite3, subprocess, tempfile, unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
CLI = ROOT / "testing/oracles/cli/qeax_reader_cli.cjs"


def build(path, n=4000):
    db = sqlite3.connect(path)
    db.execute("PRAGMA page_size=1024")  # small pages force interior nodes and overflow chains
    db.execute("CREATE TABLE t_object(Object_ID INTEGER PRIMARY KEY AUTOINCREMENT, ea_guid TEXT, Name TEXT, Object_Type TEXT, Stereotype TEXT, Note TEXT, ParentID INTEGER, Pos REAL, Blob BLOB)")
    db.execute("CREATE TABLE t_connector(Connector_ID INTEGER PRIMARY KEY, Connector_Type TEXT, Start_Object_ID INTEGER, End_Object_ID INTEGER, Notes TEXT)")
    db.execute("CREATE TABLE \"t_odd name\"(a INT, b TEXT)")
    rows = []
    for i in range(1, n + 1):
        note = None if i % 7 == 0 else ("é–✓ note %d " % i) * (1 if i % 50 else 400)  # every 50th row overflows
        rows.append((i, "{GUID-%05d}" % i, None if i % 11 == 0 else "Name %d ü" % i, "Class" if i % 3 else "Requirement",
                     None if i % 2 else "block", note, i // 10, i / 8 if i % 5 else -1.5e10, bytes(range(i % 200))))
    db.executemany("INSERT INTO t_object VALUES (?,?,?,?,?,?,?,?,?)", rows)
    db.executemany("INSERT INTO t_connector VALUES (?,?,?,?,?)", [(i, "Association", i, i + 1, None) for i in range(1, 900)] + [(5000, "Neg", -3, 2**40, "x")])
    db.executemany('INSERT INTO "t_odd name" VALUES (?,?)', [(1, "a"), (None, None)])
    db.commit()
    expected = {t: [dict(zip([c[1] for c in db.execute(f'PRAGMA table_info("{t}")')], r)) for r in db.execute(f'SELECT * FROM "{t}" ORDER BY rowid')]
                for t in ("t_object", "t_connector", "t_odd name")}
    db.close()
    return expected


def norm(rows):
    out = []
    for r in rows:
        r = dict(r)
        if isinstance(r.get("Blob"), (bytes, bytearray)):
            r["Blob"] = list(r["Blob"])
        out.append(r)
    return out


class ReaderParity(unittest.TestCase):
    def test_rows_match_sqlite3(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d, "t.qeax")
            exp = build(p)
            self.assertGreater(p.stat().st_size, 1 << 20)  # larger than one 1 MiB read chunk
            res = subprocess.run(["node", str(CLI), str(p), "t_object", "t_connector", "t_odd name"], capture_output=True, check=True)
            got = json.loads(res.stdout.decode("utf-8"))
            for t in exp:
                g = sorted(got[t], key=lambda r: json.dumps(r, sort_keys=True))
                e = sorted(norm(exp[t]), key=lambda r: json.dumps(r, sort_keys=True))
                self.assertEqual(len(g), len(e), t)
                for a, b in zip(g, e):
                    # the reader returns BLOBs as Uint8Array->object; compare everything else strictly
                    a, b = dict(a), dict(b)
                    for k in ("Blob",):
                        if k in a and isinstance(a[k], dict):
                            a[k] = [a[k][str(i)] for i in range(len(a[k]))]
                    self.assertEqual(a, b)

    def test_non_sqlite_file_is_rejected_with_guidance(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d, "x.eapx"); p.write_bytes(b"Standard Jet DB" + bytes(2000))
            res = subprocess.run(["node", str(CLI), str(p), "t_object"], capture_output=True)
            self.assertNotEqual(res.returncode, 0)
            self.assertIn(b"not a SQLite database", res.stderr)


if __name__ == "__main__":
    unittest.main()
