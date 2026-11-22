import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const checker = fileURLToPath(new URL("./check-versions.mjs", import.meta.url));
const write = (root, path, value) => { const p = join(root,path); mkdirSync(dirname(p),{recursive:true}); writeFileSync(p,value); };
const version = (n) => JSON.stringify({version:n})+"\n";
const git = (root, args) => {
  const r=spawnSync("git",args,{cwd:root,encoding:"utf8"});
  assert.equal(r.status,0,r.stderr); return r.stdout.trim();
};
const run = (root, base) => spawnSync(process.execPath,[checker,"--base",base],{
  cwd:root,encoding:"utf8",env:{...process.env,MDSE_VERSION_TEST_ROOT:root}
});
test("shipped source cannot change without both component and toolset version bump",() => {
  const dir=mkdtempSync(join(tmpdir(),"mdse-versions-"));
  try {
    git(dir,["init","-q"]);
    git(dir,["config","user.email","ci@example.invalid"]);
    git(dir,["config","user.name","Version Regression"]);
    write(dir,"package.json",version("0.10.0"));
    write(dir,"tools/workbench/manifest.json",version("0.10.0"));
    write(dir,"tools/bootstrap/manifest.json",version("0.1.0"));
    write(dir,"tools/importer/src/run.ts","// original importer\n");
    write(dir,"tools/workbench/src/index.ts","// original workbench\n");
    write(dir,"tools/bootstrap/src/main.js","// original bootstrap\n");
    git(dir,["add","."]);git(dir,["commit","-qm","baseline"]);
    const base=git(dir,["rev-parse","HEAD"]);

    write(dir,"tools/importer/src/run.ts","// changed importer behavior\n");
    write(dir,"tools/importer/version.json",version("0.11.0"));
    git(dir,["add","."]);git(dir,["commit","-qm","importer changed without toolset bump"]);
    let result=run(dir,base);
    assert.notEqual(result.status,0,"toolset bump must be required");
    assert.match(result.stderr,/Toolset/);

    write(dir,"package.json",version("0.11.0"));
    git(dir,["add","."]);git(dir,["commit","-qm","bump toolset too"]);
    result=run(dir,base);
    assert.equal(result.status,0,result.stderr);

    write(dir,"tools/workbench/src/index.ts","// changed workbench\n");
    git(dir,["add","."]);git(dir,["commit","-qm","workbench source changed without bump"]);
    result=run(dir,base);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Workbench/);
    write(dir,"tools/workbench/manifest.json",version("0.10.1"));
    write(dir,"package.json",version("0.11.1"));
    git(dir,["add","."]);git(dir,["commit","-qm","bump workbench and toolset"]);
    result=run(dir,base);
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/Version metadata and required increments: OK/);

    write(dir,"tools/bootstrap/src/main.js","// changed bootstrap\n");
    git(dir,["add","."]);git(dir,["commit","-qm","bootstrap unbumped"]);
    result=run(dir,base);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Bootstrap/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test("documentation-only and metadata-only changes do not require a bump", () => {
  const dir=mkdtempSync(join(tmpdir(),"mdse-versions-doc-"));
  try {
    git(dir,["init","-q"]);git(dir,["config","user.email","ci@example.invalid"]);git(dir,["config","user.name","Version Regression"]);
    for(const p of ["package.json","tools/importer/version.json","tools/workbench/manifest.json","tools/bootstrap/manifest.json"]) write(dir,p,version("0.2.0"));
    write(dir,"README.md","old\n");
    git(dir,["add","."]);git(dir,["commit","-qm","baseline"]);
    const base=git(dir,["rev-parse","HEAD"]);
    write(dir,"README.md","new docs\n");
    git(dir,["add","."]);git(dir,["commit","-qm","documentation only"]);
    const result=run(dir,base);
    assert.equal(result.status,0,result.stderr);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
