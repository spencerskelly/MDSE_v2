#!/usr/bin/env python3
"""Fail-closed experimental SysML validation probes.

Positive model must pass; deliberately malformed negative model must be rejected.
This tests the validator's rejection behavior, not full EA semantic equivalence.
"""
from pathlib import Path
import argparse
import json
import shlex
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parent
def invoke(template, model):
    if template.count("{model}") != 1:
        raise ValueError("Validator command must contain exactly one {model}")
    argv=shlex.split(template.replace("{model}", str(model)))
    p=subprocess.run(argv, text=True, capture_output=True, timeout=120, check=False)
    return {"exit":p.returncode,"stdout":p.stdout[-1500:],"stderr":p.stderr[-1500:]}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--validator",required=True,help="validator command containing {model}")
    ap.add_argument("--source",type=Path,required=True,help="assembled whole-model .sysml")
    args=ap.parse_args()
    original=args.source.read_text(encoding="utf-8")
    expected="part modules : PowerLibrary::PowerModule[3];"
    if original.count(expected)!=1:
        raise SystemExit("Fixture shape changed: expected one module usage")
    with tempfile.TemporaryDirectory(prefix="mdse-semantic-") as temp:
        target=Path(temp)/"model.sysml"
        target.write_text(original,encoding="utf-8")
        positive=invoke(args.validator,target)
        # A missing, qualified type is syntactically plausible but semantically unresolved.
        target.write_text(original.replace(expected,"part modules : PowerLibrary::MissingPowerModule[3];"),encoding="utf-8")
        missing_type=invoke(args.validator,target)
        # A malformed declaration tests the independent parser's fail-closed behavior.
        target.write_text(original.replace(expected,"part modules : ;"),encoding="utf-8")
        bad_syntax=invoke(args.validator,target)
    results={"baseline":positive,"unresolvedQualifiedType":missing_type,"invalidSyntax":bad_syntax}
    print(json.dumps(results,indent=2))
    if positive["exit"]!=0 or bad_syntax["exit"]==0 or missing_type["exit"]==0:
        raise SystemExit("FAIL: external validator did not reject all negative probes")
    print("PASS: positive baseline accepted; unresolved type and malformed syntax rejected")

if __name__=="__main__":
    main()
