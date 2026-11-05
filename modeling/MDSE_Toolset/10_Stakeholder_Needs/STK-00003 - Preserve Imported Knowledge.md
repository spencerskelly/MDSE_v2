---
type: Requirement
subtype: stakeholder
id: STK-00003
uid: 20261021163400003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00003::StakeholderNeed03
---
# Preserve Imported Knowledge

**Status:** Proposed model element; not an approved new governance rule.

**Statement:** Model owners need to carry EA and BOM source information into MDSE without silent loss, including unsupported items.

**Stakeholder:** Model owner and data steward

**Existing basis:** MDSE_DEFINITION.md Inputs and Principles

## Proposed trace links

- motivates: [[UC-00001 - Import an Engineering Model]]

These are provisional navigational links. Formal native SysML relationships, endpoint typing, and independent parser acceptance remain to be verified. Do not treat a link or verification declaration as passed evidence.

## SysML v2

> Draft definition, not yet parser-certified. Keep this SysML section last.

```sysml
package MDSE_STK_00003 {
    requirement def StakeholderNeed03 {
        doc /* Model owners need to carry EA and BOM source information into MDSE without silent loss, including unsupported items. */
    }
}
```
