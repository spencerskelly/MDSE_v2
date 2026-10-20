#!/usr/bin/env python3
"""Targeted validator probes for v2 typed port, owning part, and multiplicity."""
import argparse
from pathlib import Path
import subprocess
import tempfile

p=argparse.ArgumentParser()
p.add_argument("--source",type=Path,required=True)
p.add_argument("--validator",required=True)
a=p.parse_args()
original=a.source.read_text()
changes=[
 ("baseline",None,None,True),
 ("multiplicity_four","PowerModule[3]","PowerModule[4]",True),
 ("missing_port","ControllerLibrary::CanPort;","ControllerLibrary::MissingCanPort;",False),
 ("missing_controller","ControllerLibrary::Controller;","ControllerLibrary::MissingController;",False),
 ("bad_multiplicity","PowerModule[3]","PowerModule[3..];",False),
]
with tempfile.TemporaryDirectory() as directory:
    for name,old,new,accepted in changes:
        if old is not None and original.count(old)!=1:
            raise SystemExit("Fixture did not contain unique target for "+name)
        text=original if old is None else original.replace(old,new,1)
        file=Path(directory)/"model.sysml"
        file.write_text(text)
        command=a.validator.replace("{model}",str(file))
        if command==a.validator:
            raise SystemExit("Missing {model} placeholder")
        import shlex
        result=subprocess.run(shlex.split(command),capture_output=True,text=True,timeout=120)
        print(name, "exit",result.returncode,flush=True)
        if (result.returncode==0)!=accepted:
            print(result.stdout[-1000:],result.stderr[-1000:])
            raise SystemExit("FAIL: "+name)
print("PASS: structural reference and multiplicity probes")
