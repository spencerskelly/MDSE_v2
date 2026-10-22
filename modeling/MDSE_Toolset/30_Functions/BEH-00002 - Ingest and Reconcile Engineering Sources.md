---
type: Behavior
subtype: function
id: BEH-00002
uid: 20261021195900001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00002::IngestEngineeringSources
---
# Ingest and Reconcile Engineering Sources

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Import external source data and evidence into MDSE using appropriate adapters, source identity, managed files, approved reconciliation, and recorded dispositions.

## Inputs

Source files/references; adapter capabilities; current model; merge approvals.

## Outputs

New model content or attachments/references; disposition ledger; exceptions; change report.

## Functional decomposition candidates

- Identify source types and format-specific capabilities
- Normalize source data and metadata with provenance
- Match existing definitions and usages without guessing
- Plan approved additions/changes and preserve unsupported data as reviewable evidence
- Report dispositions, conflicts and actual validation results

## Function boundary

PDF, documents, and images are not automatically a SysML model simply because they are indexed or attached. PDM/PLM retains complete CAD authority.

## Use cases depending on this function

- [[UC-00001 - Import an Engineering Model]]

## Candidate verification outcome

Every processed source item has a disposition; repeat import is controlled; unsupported records are not silently lost.

## Existing implementation evidence — not certification

Partial: tools/importer/src/run.ts, ea_source.ts, bom.ts and merge.ts; importer/test/importer.test.ts. Generic document/image semantic adapters not verified.

## Proposed subfunctions

- BEH-00001 - Reconcile Source Records

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00002 {
    action def IngestEngineeringSources {
        doc /* Import external source data and evidence into MDSE using appropriate adapters, source identity, managed files, approved reconciliation, and recorded dispositions. */
    }
}
```
