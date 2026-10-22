---
type: Requirement
subtype: stakeholder
id: STK-00024
uid: 20261021181500012skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00024::ChangeManagementTool
---
# Change Management Tool

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Control proposed engineering changes with impact analysis, review, decision history, change ownership and verification of the accepted outcome.

## Stakeholders (proposed)

Engineers; approvers; configuration managers; engineering leadership

## Desired outcome (proposed)

Trace a change request through affected model elements, decision and approval, implementation, and required retesting.

## Candidate use case

Review, approve and verify an engineering change

## Impact on toolset (preliminary)

Core; Importer; Workbench; existing Git-based workflow

## Existing coverage (preliminary)

Approval-controlled re-import is implemented in parts; full end-to-end change workflow not verified.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00024 {
    requirement def ChangeManagementTool {
        doc /* Control proposed engineering changes with impact analysis, review, decision history, change ownership and verification of the accepted outcome. */
    }
}
```
