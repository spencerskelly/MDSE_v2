---
type: Object
subtype: software
id: OBJ-00001
uid: 20261021163400016skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_OBJ_00001::MDSEImporter
---
# MDSE Importer

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** Software adapter that reads engineering sources and produces reconciled MDSE notes and evidence.

## Proposed trace links

- Referenced from (allocatedTo): [[REQ-00001 - Account for Every Source Row]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

## Existing implementation evidence (read-only assessment)

- **Source:** `tools/importer/src/run.ts`, `ea_source.ts`, `bom.ts`, `merge.ts`, `vault_update.ts`, `importer.template.html`.
- **Tests present:** `tools/importer/test/importer.test.ts`, `bom.test.ts`, `preflight.test.ts`, `vault_update.test.ts`, `testing/oracles/test_importer_browser.py`.
- **Functions supported partially:** [[BEH-00002 - Ingest and Reconcile Engineering Sources]], [[BEH-00007 - Maintain and Improve Model Knowledge]].
- **As implemented:** QEAX graph extraction and translation with review dispositions; BOM tabular import from `.xlsx`, `.csv`, `.tsv`; import planning, flags, approved merges, new vault ZIP and update of existing vault tool configuration.
- **Not proven:** General PDF/word-processing/image import; real full-size QEAX/BOM golden acceptance; independently parser-checked exported model.
- **Conflict to resolve:** The page's help text still promises automatic refresh of EA-owned fields, while `src/merge.ts` requires prior approval; legacy core `mergeNote` independently implements automatic refresh.
- **Evidence level:** implementation and dedicated test cases found; these test cases were not executed for this assessment, and no real-data acceptance evidence was verified.

**No new normative allocation is approved by this note.**

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_OBJ_00001 {
    part def MDSEImporter {
        doc /* Software adapter that reads engineering sources and produces reconciled MDSE notes and evidence. */
    }
}
```
