#!/usr/bin/env python3
"""Validate v2 parser provenance configuration, not SysML language correctness."""
import json
from pathlib import Path
import sys

p = Path(__file__).with_name("parser-pin.json")
pin = json.loads(p.read_text(encoding="utf-8"))
required = {"schema": "mdse-v2-parser-pin/1", "standard": "OMG SysML 2.0 / KerML 1.0",
            "standard_release": "2026-04", "pilot_release": "2026-04"}
for key, expected in required.items():
    if pin.get(key) != expected:
        raise SystemExit(f"FAIL parser pin {key}: expected {expected!r}")
digest = pin.get("parser_binary_sha256")
command = pin.get("parser_command")
if any((pin.get("parser_binary"), digest, command)):
    if not all((pin.get("parser_binary"), digest, command)):
        raise SystemExit("FAIL partial external parser configuration")
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest.lower()):
        raise SystemExit("FAIL invalid external parser SHA-256")
    if "{model}" not in command:
        raise SystemExit("FAIL external parser command has no model argument")
    print("Parser pin configured; external execution still required")
else:
    if pin.get("validation_level") != "pending-independent-parser":
        raise SystemExit("FAIL parser falsely marked validated")
    print("Parser pin accepted: independent SysML validation PENDING")
