# d3-dag (vendored)

`tools/workbench/src/dag_lib.ts` embeds `dist/d3-dag.iife.min.js` from the npm package **d3-dag 2.0.0** unmodified, between the `@@D3DAG-BEGIN@@` and `@@D3DAG-END@@` markers (SHA-256 `7e56310dbb30e24ec0c1966a975af3600599a04ee497185ba82020d5ef4a96a5`, checked by `tools/workbench/test/dag_lib.test.ts`). The Workbench uses it to order the cards in each canvas row (D-0168).

The file bundles four libraries; their licences are in this folder:

| Library | Version | Licence |
|---|---|---|
| d3-dag | 2.0.0 | MIT |
| d3-array | 3.2.5 | ISC |
| javascript-lp-solver | 1.0.3 | Unlicense |
| quadprog | 2.0.0 | MIT |
| stringify-object | 7.0.0 | BSD-2-Clause |

To change the pin: download the package (`npm pack d3-dag@<version>`), replace the text between the markers, update the hash here and in the test, record a decision, and bump the Workbench version.
