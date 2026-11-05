---
type: Use Case
subtype: what
id: UC-00001
uid: 20261021163400013skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00001::ImportEngineeringModel
---
# Import an Engineering Model

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** A user imports engineering knowledge from multiple source formats, retaining provenance and reviewable disposition of every processed source record.

## Proposed trace links

- Referenced from (motivates): [[STK-00003 - Preserve Imported Knowledge]]
- requiresFunction: [[BEH-00001 - Reconcile Source Records]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

> [!note] Critical use case — expanded source formats requested by owner, 2026-10-21
> Data import is a first-class capability of the Engineering Knowledge Base, not a minor supporting use case. Existing QEAX and Excel implementations are only part of the target.

## Supported source classes (target, not current feature claims)

- Structured engineering models: EA QEAX and future model formats.
- BOM and tabular sources: Excel, CSV or equivalent.
- Documents: PDF and word-processing documents, with identifiable source, document version and extraction provenance where supported.
- Images: illustrations, diagrams, photos or scans as linked/owned evidence; extracting semantic model definitions from image content is a distinct capability requiring validation.
- Other formats: extensible through source adapters, not restricted to the examples above.

A document or image may be indexed as an attachment, linked as external evidence, or yield candidate model facts. These outcomes are **not equivalent**. Do not claim source semantics were translated when only the file was attached or linked.

## Main scenario

1. Select one or more source inputs and identify available source format and provenance.
2. Detect an appropriate source adapter and report supported extraction/translation capabilities.
3. Normalize supported records or files, preserving references to source items and original identifiers.
4. Match existing MDSE definitions/usages where justified and propose new model records.
5. Identify uncertain, unsupported, duplicate, incomplete or conflicting data in reviewable dispositions/flags.
6. Present an import plan and apply only permitted additions or approved changes.
7. Write model notes, managed attachments or links, and a source-specific import ledger/report.
8. Run appropriate structural and syntax checks, reporting their actual outcomes.

## Expected outcome

Knowledge from multiple engineering sources is available in the connected model, without silently discarding source records or overwriting accepted engineer edits.

## Critical boundaries

- PDM/PLM remains authoritative for complete CAD and controlled design files; MDSE may link to those sources instead of duplicating them.
- Import adapters must be source-specific, but canonical identity, note writing, semantic rules, conflict handling and dispositions belong to shared MDSE contracts.
- Any text or image extraction is candidate evidence, not automatically a certified fact or approved SysML relationship.
- Private data must remain in private/local vaults, not in public MDSE_v2 code.

## Traceability

- Primary capability: [[STK-00013 - Engineering Knowledge Base]]
- Supporting quality: [[STK-00003 - Preserve Imported Knowledge]]
- Existing candidate function: [[BEH-00001 - Reconcile Source Records]]
- Existing candidate requirement: [[REQ-00001 - Account for Every Source Row]]
- Existing candidate verification: [[VER-00001 - Source Row Disposition Test]]
- Actual QEAX/Excel implementations require independent acceptance; PDF/Docs/Images adapters are future implementation gaps until demonstrated.

## Proposed functional coverage

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]]
- [[BEH-00007 - Maintain and Improve Model Knowledge]]

These are draft use-case/function relations only. Formal SysML links, requirements, implementation allocation and test evidence remain to be established.

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_UC_00001 {
    use case def ImportEngineeringModel {
        doc /* A user imports engineering knowledge from multiple source formats, retaining provenance and reviewable disposition of every processed source record. */
    }
}
```
