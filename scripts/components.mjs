// The versioned components and the source paths that require each one to move (docs/VERSIONING.md).
// Shared by check-versions.mjs (CI) and bump.mjs (the one-command bump).
export const components = [
  { label:"Importer", path:"tools/importer/version.json", triggers:["tools/importer/src/","tools/importer/build.mjs","tools/core/src/","governance/schemas/","tools/workbench/src/","tools/workbench/build.mjs","tools/workbench/manifest.json","tools/bootstrap/src/","tools/bootstrap/manifest.json","tools/base-vault/src/","tools/base-vault/vendor/"] },
  { label:"Workbench", path:"tools/workbench/manifest.json", triggers:["tools/workbench/src/","tools/workbench/build.mjs"] },
  { label:"Bootstrap", path:"tools/bootstrap/manifest.json", triggers:["tools/bootstrap/src/"] },
  { label:"Testbench", optional:true, path:"tools/testbench/manifest.json", triggers:["tools/testbench/src/","tools/testbench/build.mjs","tools/core/src/mdse_db.ts","tools/core/vendor/"] },
  { label:"Toolset", path:"package.json", triggers:["tools/importer/src/","tools/importer/build.mjs","tools/importer/version.json","tools/workbench/src/","tools/workbench/build.mjs","tools/workbench/manifest.json","tools/bootstrap/src/","tools/bootstrap/manifest.json","tools/base-vault/src/","tools/base-vault/vendor/","tools/core/src/","governance/schemas/","tools/testbench/src/","tools/testbench/build.mjs","tools/testbench/manifest.json","tools/core/vendor/"] }
];
