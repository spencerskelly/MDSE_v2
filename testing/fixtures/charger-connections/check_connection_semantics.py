#!/usr/bin/env python3
"""External validator negative controls for v2 CAN connection semantics.

A passing baseline and explicit invalid cases are required. Failure to reject
a negative case is reported as a failed gate, not silently treated as success.
"""
import argparse
from pathlib import Path
import subprocess
import tempfile
import shlex

parser = argparse.ArgumentParser()
parser.add_argument("--source", type=Path, required=True)
parser.add_argument("--validator", required=True, help="Command with {model} placeholder")
args = parser.parse_args()
source = args.source.read_text(encoding="utf-8")
needle = "connect controller.can to module.can;"
if source.count(needle) != 1:
    raise SystemExit("Baseline connection must occur exactly once")
if args.validator.count("{model}") != 1:
    raise SystemExit("Exactly one {model} placeholder required")

cases = {
    "baseline": (source, True),
    "missing_controller_port": (source.replace(needle, "connect controller.noSuchPort to module.can;"), False),
    "missing_module_port": (source.replace(needle, "connect controller.can to module.noSuchPort;"), False),
    "missing_endpoint_owner": (source.replace(needle, "connect unknownPart.can to module.can;"), False),
    "invalid_connection_syntax": (source.replace(needle, "connect controller.can to ;"), False),
}
failures = []
with tempfile.TemporaryDirectory(prefix="mdse-v2-connection-") as directory:
    path = Path(directory) / "connection.sysml"
    for name, (model, should_accept) in cases.items():
        path.write_text(model, encoding="utf-8")
        command = shlex.split(args.validator.replace("{model}", str(path)))
        result = subprocess.run(command, text=True, capture_output=True, timeout=120)
        accepted = result.returncode == 0
        print(f"{name}: exit={result.returncode}; expected={'accept' if should_accept else 'reject'}", flush=True)
        if accepted != should_accept:
            failures.append(name)
            print("stdout:", result.stdout[-800:], "stderr:", result.stderr[-800:], flush=True)
if failures:
    raise SystemExit("FAIL connection negative controls: " + ", ".join(failures))
print("PASS: baseline accepted and invalid endpoint/syntax controls rejected")
