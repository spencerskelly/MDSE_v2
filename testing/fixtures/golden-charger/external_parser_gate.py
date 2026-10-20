#!/usr/bin/env python3
"""Deterministic whole-model assembly and external SysML parser gate.

Explicitly requires a caller-supplied standards-aware parser command. Never
claims conformance from text inspection or from this assembler alone.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
FILES = ("01_Controller.sysml", "02_PowerModule.sysml", "03_Charger.sysml")

def assemble(root: Path) -> bytes:
    parts = []
    for name in FILES:
        path = root / "export" / name
        data = path.read_bytes()
        if b"\r" in data or not data.endswith(b"\n"):
            raise ValueError(f"{name}: expected LF-terminated UTF-8 snapshot")
        data.decode("utf-8")
        parts.append(data)
    return b"\n".join(parts)

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--validator", help="CLI template with exactly one {model} placeholder, e.g. 'validate-sysml {model}'")
    ap.add_argument("--validator-version", help="Exact external validator version or commit; required for --validator")
    ap.add_argument("--expect-sha256", help="Optional reproducibility assertion")
    ap.add_argument("--output", type=Path, help="Optional output file for deterministic assembled SysML; must be outside fixture export inputs")
    args = ap.parse_args()
    try:
        data = assemble(args.root.resolve())
        digest = hashlib.sha256(data).hexdigest()
        if args.expect_sha256 and digest != args.expect_sha256:
            raise ValueError("assembled SysML SHA-256 mismatch")
        if args.output:
            destination = args.output.resolve()
            inputs = {(args.root.resolve() / "export" / n).resolve() for n in FILES}
            if destination in inputs:
                raise ValueError("--output cannot overwrite an input snapshot")
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
        result = {"schema": "mdse-v2-external-parser-gate/1", "modelSha256": digest,
                  "modelBytes": len(data), "sources": list(FILES),
                  "parser": "not-run", "conformance": "not-verified"}
        if not args.validator:
            print(json.dumps(result, indent=2))
            return 0
        if not args.validator_version:
            ap.error("--validator-version is required for --validator")
        if args.validator.count("{model}") != 1:
            ap.error("--validator must include exactly one {model} placeholder")
        with tempfile.TemporaryDirectory(prefix="mdse-v2-parser-") as tempdir:
            model = Path(tempdir) / "golden-charger.sysml"
            model.write_bytes(data)
            command = shlex.split(args.validator.replace("{model}", str(model)))
            proc = subprocess.run(command, capture_output=True, text=True, check=False, timeout=180)
            result["parser"] = {"command": args.validator, "version": args.validator_version,
                                "returnCode": proc.returncode, "stdout": proc.stdout[-4000:],
                                "stderr": proc.stderr[-4000:]}
            result["conformance"] = "parser-exit-zero-syntax-only" if proc.returncode == 0 else "failed"
        print(json.dumps(result, indent=2))
        return 0 if proc.returncode == 0 else 1
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({"conformance": "failed", "error": str(exc)}, indent=2), file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
