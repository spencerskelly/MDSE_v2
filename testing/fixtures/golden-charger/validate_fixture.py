#!/usr/bin/env python3
"""Fixture checks and optional external SysML parser invocation.

Does NOT implement SysML grammar. Internal checks are deliberately limited.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
EXPORTS = ("01_Controller.sysml", "02_PowerModule.sysml", "03_Charger.sysml")
EXPECTED = {
    "ControllerLibrary::CanPort": ("01_Controller.sysml", "port def CanPort"),
    "ControllerLibrary::Controller": ("01_Controller.sysml", "part def Controller"),
    "PowerLibrary::PowerModule": ("02_PowerModule.sysml", "part def PowerModule"),
    "ChargerProduct::Contactor": ("03_Charger.sysml", "part def Contactor"),
    "ChargerProduct::Charger": ("03_Charger.sysml", "part def Charger"),
}
TYPED_USAGES = {
    "ControllerLibrary::CanPort": 1,
    "ControllerLibrary::Controller": 1,
    "PowerLibrary::PowerModule": 1,
}

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--external-command", help="External validator command with {files} placeholder; command must parse and resolve entire model")
    parser.add_argument("--external-version", help="Recorded pinned parser version or commit (required with external command)")
    args = parser.parse_args()
    root = args.root.resolve()
    exports = [root / "export" / name for name in EXPORTS]
    issues = []
    if not all(f.is_file() for f in exports):
        print("FAIL: missing export snapshots", file=sys.stderr)
        return 1
    src = {f.name: f.read_text(encoding="utf-8") for f in exports}
    combined = "\n".join(src.values())
    for qualified, (name, token) in EXPECTED.items():
        if src[name].count(token) != 1:
            issues.append(f"{qualified}: expected exactly one definition token in {name}")
    for qualified, count in TYPED_USAGES.items():
        actual = len(re.findall(r":\s*" + re.escape(qualified) + r"(?=[;\[\s])", combined))
        if actual != count:
            issues.append(f"{qualified}: expected {count} qualified usage(s), found {actual}")
    # A coarse fixture-specific check only. Real containment and name resolution require external parser.
    charger = src["03_Charger.sysml"]
    # Contactor is declared in ChargerProduct and referred to by its local name.
    if len(re.findall(r"\bpart\s+contactors\s*:\s*Contactor\[2\]\s*;", charger)) != 1:
        issues.append("expected one local Contactor usage with multiplicity 2")
    for token in ("part controller : ControllerLibrary::Controller;",
                  "part modules : PowerLibrary::PowerModule[3];",
                  "part contactors : Contactor[2];"):
        if token not in charger:
            issues.append(f"missing required charger usage: {token}")
    for token in ("MFG-C2", "MFG-C3"):
        if token in combined:
            issues.append(f"BOM alternate {token} accidentally promoted to SysML")
    status = "failed" if issues else "passed"
    external = {"status": "not-run", "version": None}
    if args.external_command:
        if not args.external_version:
            parser.error("--external-version must accompany --external-command")
        if "{files}" not in args.external_command:
            parser.error("external command must include {files}")
        # Explicit argv substitution, no shell execution.
        before, after = args.external_command.split("{files}", 1)
        if "{files}" in after:
            parser.error("one {files} token required")
        argv = shlex.split(before) + [str(f) for f in exports] + shlex.split(after)
        proc = subprocess.run(argv, capture_output=True, text=True, check=False)
        external = {"status": "passed" if proc.returncode == 0 else "failed",
                    "version": args.external_version, "exitCode": proc.returncode,
                    "stdout": proc.stdout[-5000:], "stderr": proc.stderr[-5000:]}
        if proc.returncode:
            status = "failed"
    print(json.dumps({"schema": "mdse-v2-fixture-check/1", "fixture": "Golden Charger v2",
                      "internal": {"status": "failed" if issues else "passed", "issues": issues},
                      "external": external, "overall": status if args.external_command else "internal-only"},
                     indent=2))
    return 1 if status == "failed" else 0

if __name__ == "__main__":
    raise SystemExit(main())
