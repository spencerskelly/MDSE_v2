#!/usr/bin/env python3
"""Exploratory SysML v2 connection typing probes; log observations, do not assume incompatibility."""
import argparse
import pathlib
import shlex
import subprocess
import tempfile
import json

p=argparse.ArgumentParser()
p.add_argument("--source",type=pathlib.Path,required=True)
p.add_argument("--validator",required=True)
a=p.parse_args()
s=a.source.read_text(encoding="utf-8")
key="connect controller.can to module.can;"
if s.count(key)!=1 or a.validator.count("{model}")!=1:
    raise SystemExit("Unexpected fixture/validator contract")

def exact(text,old,new):
    if text.count(old)!=1: raise SystemExit("Missing unique mutation anchor: "+old)
    return text.replace(old,new,1)

cases={
 "baseline":s,
 "separate_port_definitions":exact(s,"port can : ConnController::CanPort;","port def OtherPort;\n        port can : OtherPort;"),
 "nested_valid_candidate":exact(s,"part module : ConnPower::Module;","part group {\n            part module : ConnPower::Module;\n        }").replace(key,"connect controller.can to group.module.can;"),
 "nested_nonexistent_part":exact(s,key,"connect controller.can to group.module.can;")
}
results={}
with tempfile.TemporaryDirectory() as d:
 for name,model in cases.items():
  file=pathlib.Path(d)/"candidate.sysml"
  file.write_text(model,encoding="utf-8")
  cmd=shlex.split(a.validator.replace("{model}",str(file)))
  r=subprocess.run(cmd,capture_output=True,text=True,timeout=120)
  results[name]={"exit":r.returncode,"stderrTail":r.stderr[-350:]}
  print(name,"exit",r.returncode,flush=True)
print(json.dumps(results,indent=2))
if results["baseline"]["exit"]!=0 or results["nested_nonexistent_part"]["exit"]==0:
 raise SystemExit("FAIL mandatory positive/negative controls")
print("PASS mandatory controls; experimental port-type and nested-valid outcomes recorded, not asserted")
