#!/usr/bin/env python3
"""Deterministically extract authoritative SysML fenced blocks from fixture notes.

This is an extraction and integrity test, NOT a SysML v2 parser.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
SOURCES = (
    ("Controller.md", "01_Controller.sysml", "ControllerLibrary::Controller"),
    ("Power Module.md", "02_PowerModule.sysml", "PowerLibrary::PowerModule"),
    ("Charger.md", "03_Charger.sysml", "ChargerProduct::Charger"),
)
FENCE = re.compile(r"(?m)^\x60{3}sysml[ \t]*\r?\n(.*?)^\x60{3}[ \t]*$", re.S | re.M)
SYMBOL = re.compile(r"(?m)^primarySymbol:\s*(\S+)\s*$")
ROLE = re.compile(r"(?m)^sourceRole:\s*authoritative-model\s*$")
UID = re.compile(r"(?m)^uid:\s*(\S+)\s*$")

def extract(root: Path):
    records = []
    seen_uid = set()
    seen_symbol = set()
    for note_name, output_name, required_symbol in SOURCES:
        note_path = root / note_name
        body = note_path.read_text(encoding="utf-8")
        if not body.startswith("---\n") or "\n---\n" not in body[4:]:
            raise ValueError(f"{note_name}: missing YAML frontmatter")
        metadata = body.split("\n---\n", 1)[0]
        if not ROLE.search(metadata):
            raise ValueError(f"{note_name}: sourceRole is not authoritative-model")
        symbol = SYMBOL.search(metadata)
        uid = UID.search(metadata)
        if not symbol or symbol.group(1) != required_symbol or not uid:
            raise ValueError(f"{note_name}: missing/incorrect primarySymbol or uid")
        if symbol.group(1) in seen_symbol or uid.group(1) in seen_uid:
            raise ValueError(f"{note_name}: duplicate UID or symbol")
        seen_symbol.add(symbol.group(1))
        seen_uid.add(uid.group(1))
        matches = FENCE.findall(body)
        if len(matches) != 1:
            raise ValueError(f"{note_name}: expected one sysml block, found {len(matches)}")
        normalized = matches[0].replace("\r\n", "\n").rstrip("\n") + "\n"
        data = normalized.encode("utf-8")
        records.append((output_name, data, {
            "note": note_name,
            "output": output_name,
            "primarySymbol": required_symbol,
            "uid": uid.group(1).strip('"\''),
            "sha256": hashlib.sha256(data).hexdigest(),
            "bytes": len(data)
        }))
    return records

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=HERE)
    ap.add_argument("--check", action="store_true", help="fail if committed export snapshots differ")
    ap.add_argument("--write", action="store_true", help="regenerate export snapshots; no other files")
    ns = ap.parse_args()
    if ns.check and ns.write:
        ap.error("--check and --write cannot be combined")
    root = ns.root.resolve()
    records = extract(root)
    outdir = root / "export"
    if ns.write:
        outdir.mkdir(parents=True, exist_ok=True)
    for name, data, evidence in records:
        target = outdir / name
        if ns.check:
            if not target.exists() or target.read_bytes() != data:
                raise ValueError(f"export snapshot mismatch: {name}")
        elif ns.write:
            target.write_bytes(data)
    print(json.dumps({"schema": "mdse-v2-sysml-extract/1", "checked": bool(ns.check),
                      "written": bool(ns.write), "records": [r[2] for r in records]},
                     indent=2, sort_keys=True))
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
