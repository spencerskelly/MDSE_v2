---
type: Behavior
subtype: function
id: BEH-00001
uid: 20261021163400014skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00001::ReconcileSourceRecords
---
# Reconcile Source Records

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** Normalize and translate source records with explicit dispositions, preserving unhandled cases for review.

## Proposed trace links

- Referenced from (requiresFunction): [[UC-00001 - Import an Engineering Model]]
- constrainedBy: [[REQ-00001 - Account for Every Source Row]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

## Candidate parent function

- [[BEH-00002 - Ingest and Reconcile Engineering Sources]] — proposed broader ingestion function; this note remains the prior narrower reconciliation concept.

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_BEH_00001 {
    action def ReconcileSourceRecords {
        doc /* Normalize and translate source records with explicit dispositions, preserving unhandled cases for review. */
    }
}
```
