---
type: Requirement
subtype: engineering
id: REQ-00001
uid: 20261021163400015skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_REQ_00001::RecordRowDisposition
---
# Account for Every Source Row

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** For each source package, element and connector processed, MDSE shall record exactly one disposition and retain enough source identity to reconcile the result.

## Proposed trace links

- Referenced from (constrainedBy): [[BEH-00001 - Reconcile Source Records]]
- allocatedTo: [[OBJ-00001 - MDSE Importer]]
- verifiedBy: [[VER-00001 - Source Row Disposition Test]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_REQ_00001 {
    requirement def RecordRowDisposition {
        doc /* For each source package, element and connector processed, MDSE shall record exactly one disposition and retain enough source identity to reconcile the result. */
    }
}
```
